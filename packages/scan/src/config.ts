import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env";
import type { RepositoryLimits } from "./repository-limits";

const DEFAULT_MAX_FILE_LINES = 400;
const DEFAULT_MAX_FINDINGS = 12;
const DEFAULT_MAX_REPO_FILES = 5000;
const DEFAULT_MAX_REPO_SIZE_MB = 100;
const DEFAULT_MAX_FILE_SIZE_MB = 2;

export type ScanConfig = {
  repoLocalPath: string;
  maxFileLines: number;
  maxFindings: number;
  maxRepoFiles: number;
  maxRepoSizeMb: number;
  maxFileSizeMb: number;
};

function readPositiveInt(
  raw: string | undefined,
  fallback: number
): number {
  const parsed = Number.parseInt(raw ?? String(fallback), 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

export function getScanConfig(): ScanConfig {
  loadEnv();

  const configuredPath = process.env.REPO_LOCAL_PATH;
  const candidates = configuredPath
    ? [path.resolve(configuredPath)]
    : [
        path.resolve(process.cwd(), "demo/debt-lab"),
        path.resolve(process.cwd(), "../../demo/debt-lab"),
        path.resolve(process.cwd(), "../../../demo/debt-lab")
      ];

  const repoLocalPath =
    candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];

  return {
    repoLocalPath,
    maxFileLines: readPositiveInt(
      process.env.WARDEN_MAX_FILE_LINES,
      DEFAULT_MAX_FILE_LINES
    ),
    maxFindings: readPositiveInt(
      process.env.WARDEN_MAX_FINDINGS,
      DEFAULT_MAX_FINDINGS
    ),
    maxRepoFiles: readPositiveInt(
      process.env.WARDEN_MAX_REPO_FILES,
      DEFAULT_MAX_REPO_FILES
    ),
    maxRepoSizeMb: readPositiveInt(
      process.env.WARDEN_MAX_REPO_SIZE_MB,
      DEFAULT_MAX_REPO_SIZE_MB
    ),
    maxFileSizeMb: readPositiveInt(
      process.env.WARDEN_MAX_FILE_SIZE_MB,
      DEFAULT_MAX_FILE_SIZE_MB
    )
  };
}

export function getRepositoryLimits(): RepositoryLimits {
  const config = getScanConfig();

  return {
    maxRepoFiles: config.maxRepoFiles,
    maxRepoSizeBytes: config.maxRepoSizeMb * 1024 * 1024,
    maxFileSizeBytes: config.maxFileSizeMb * 1024 * 1024
  };
}
