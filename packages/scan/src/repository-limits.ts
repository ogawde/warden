import fs from "node:fs/promises";
import path from "node:path";

export type RepositoryLimits = {
  maxRepoFiles: number;
  maxRepoSizeBytes: number;
  maxFileSizeBytes: number;
};

export function formatRepoSizeLimitError(limitMb: number): string {
  return `Repository exceeds maximum size limit (${limitMb} MB)`;
}

export function formatRepoFileCountLimitError(limit: number): string {
  return `Repository exceeds maximum file count (${limit})`;
}

export async function measureDirectoryBytes(rootPath: string): Promise<number> {
  let totalBytes = 0;

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stat = await fs.stat(fullPath);
      totalBytes += stat.size;
    }
  }

  await walk(rootPath);
  return totalBytes;
}
