import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env";

const DEFAULT_MAX_FILE_LINES = 400;
const DEFAULT_MAX_FINDINGS = 12;

export type ScanConfig = {
  repoLocalPath: string;
  maxFileLines: number;
  maxFindings: number;
};

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

  const maxFileLines = Number.parseInt(
    process.env.WARDEN_MAX_FILE_LINES ?? String(DEFAULT_MAX_FILE_LINES),
    10
  );

  const maxFindings = Number.parseInt(
    process.env.WARDEN_MAX_FINDINGS ?? String(DEFAULT_MAX_FINDINGS),
    10
  );

  return {
    repoLocalPath,
    maxFileLines: Number.isNaN(maxFileLines) ? DEFAULT_MAX_FILE_LINES : maxFileLines,
    maxFindings: Number.isNaN(maxFindings) ? DEFAULT_MAX_FINDINGS : maxFindings
  };
}
