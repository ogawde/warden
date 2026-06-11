import fs from "node:fs/promises";
import path from "node:path";
import { getRepositoryLimits, getScanConfig } from "./config";
import {
  formatRepoFileCountLimitError,
  formatRepoSizeLimitError,
  type RepositoryLimits
} from "./repository-limits";
import type { RepoFile, ScanRepositorySnapshot } from "./types";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".venv"
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".java"
]);

function isTestFile(relativePath: string): boolean {
  return (
    relativePath.includes("__tests__") ||
    relativePath.includes(".test.") ||
    relativePath.includes(".spec.")
  );
}

type WalkState = {
  files: RepoFile[];
  totalBytes: number;
  limits: RepositoryLimits;
  maxRepoSizeMb: number;
};

async function walkDirectory(
  rootPath: string,
  currentPath: string,
  state: WalkState
): Promise<void> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        await walkDirectory(rootPath, fullPath, state);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }

    const stat = await fs.stat(fullPath);

    if (stat.size > state.limits.maxFileSizeBytes) {
      continue;
    }

    if (state.files.length >= state.limits.maxRepoFiles) {
      throw new Error(
        formatRepoFileCountLimitError(state.limits.maxRepoFiles)
      );
    }

    if (state.totalBytes + stat.size > state.limits.maxRepoSizeBytes) {
      throw new Error(formatRepoSizeLimitError(state.maxRepoSizeMb));
    }

    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");
    const content = await fs.readFile(fullPath, "utf8");
    const lineCount = content.split("\n").length;

    state.totalBytes += stat.size;
    state.files.push({
      relativePath,
      lineCount,
      content: isTestFile(relativePath) ? undefined : content
    });
  }
}

export async function readRepositorySnapshot(
  rootPath: string
): Promise<ScanRepositorySnapshot> {
  try {
    await fs.access(rootPath);
  } catch {
    throw new Error(
      `Repository path not found: ${rootPath}. Set REPO_LOCAL_PATH to your local clone.`
    );
  }

  const scanConfig = getScanConfig();
  const limits = getRepositoryLimits();
  const state: WalkState = {
    files: [],
    totalBytes: 0,
    limits,
    maxRepoSizeMb: scanConfig.maxRepoSizeMb
  };

  await walkDirectory(rootPath, rootPath, state);

  return {
    rootPath,
    files: state.files,
    filePathSet: new Set(state.files.map((file) => file.relativePath))
  };
}

export function getSourceFiles(snapshot: ScanRepositorySnapshot): RepoFile[] {
  return snapshot.files.filter(
    (file) => !isTestFile(file.relativePath) && !file.relativePath.startsWith("test/")
  );
}
