import fs from "node:fs/promises";
import path from "node:path";
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

async function walkDirectory(
  rootPath: string,
  currentPath: string,
  files: RepoFile[]
): Promise<void> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        await walkDirectory(rootPath, fullPath, files);
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

    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");
    const content = await fs.readFile(fullPath, "utf8");
    const lineCount = content.split("\n").length;

    files.push({
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

  const files: RepoFile[] = [];
  await walkDirectory(rootPath, rootPath, files);

  return {
    rootPath,
    files,
    filePathSet: new Set(files.map((file) => file.relativePath))
  };
}

export function getSourceFiles(snapshot: ScanRepositorySnapshot): RepoFile[] {
  return snapshot.files.filter(
    (file) => !isTestFile(file.relativePath) && !file.relativePath.startsWith("test/")
  );
}
