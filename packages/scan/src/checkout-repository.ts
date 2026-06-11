import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Repository, Scan } from "@warden/db";
import type { GitLabAuth } from "@warden/gitlab-mcp";
import { getScanConfig } from "./config";
import {
  formatRepoSizeLimitError,
  measureDirectoryBytes
} from "./repository-limits";

const execFileAsync = promisify(execFile);

const CHECKOUT_ROOT = path.join(os.tmpdir(), "warden", "checkouts");
const GIT_TIMEOUT_MS = 120_000;

export type CheckoutRepositoryInput = {
  scan: Pick<Scan, "id" | "triggeredById">;
  repository: Pick<
    Repository,
    "gitlabInstance" | "pathWithNamespace" | "defaultBranch"
  >;
  auth?: GitLabAuth;
};

export type CheckoutRepositoryResult = {
  localPath: string;
  headCommitSha?: string;
  checkoutBranch?: string;
  cleanup: () => Promise<void>;
};

function buildCloneUrl(
  gitlabInstance: string,
  pathWithNamespace: string
): string {
  const base = gitlabInstance.replace(/\/$/, "");
  return `${base}/${pathWithNamespace}.git`;
}

function buildGitHttpExtraHeader(auth: GitLabAuth): string {
  if (auth.type === "pat") {
    return `PRIVATE-TOKEN: ${auth.token}`;
  }

  return `Authorization: Bearer ${auth.accessToken}`;
}

function formatGitError(command: string, error: unknown): string {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = String((error as { stderr?: string }).stderr ?? "").trim();
    if (stderr) {
      return `${command} failed: ${stderr}`;
    }
  }

  if (error instanceof Error && error.message) {
    return `${command} failed: ${error.message}`;
  }

  return `${command} failed`;
}

async function runGit(
  args: string[],
  options: { cwd?: string } = {}
): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: options.cwd,
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024
  });

  return stdout.trim();
}

async function prepareCheckoutDirectory(scanId: string): Promise<string> {
  const checkoutPath = path.join(CHECKOUT_ROOT, scanId);

  try {
    await fs.mkdir(CHECKOUT_ROOT, { recursive: true });
    await fs.rm(checkoutPath, { recursive: true, force: true });
  } catch (error) {
    throw new Error(
      `Failed to prepare checkout directory: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }

  return checkoutPath;
}

function createCleanup(checkoutPath: string | null): () => Promise<void> {
  if (!checkoutPath) {
    return async () => {};
  }

  return async () => {
    await fs.rm(checkoutPath, { recursive: true, force: true });
  };
}

async function checkoutOAuthRepository(
  input: CheckoutRepositoryInput
): Promise<CheckoutRepositoryResult> {
  if (!input.auth) {
    throw new Error(
      "GitLab authentication is required to checkout an OAuth-triggered scan repository"
    );
  }

  const branch = input.repository.defaultBranch?.trim();
  if (!branch) {
    throw new Error("Repository default branch is not set");
  }

  const checkoutPath = await prepareCheckoutDirectory(input.scan.id);
  const cloneUrl = buildCloneUrl(
    input.repository.gitlabInstance,
    input.repository.pathWithNamespace
  );
  const extraHeader = buildGitHttpExtraHeader(input.auth);

  try {
    await runGit([
      "-c",
      `http.extraHeader=${extraHeader}`,
      "clone",
      "--depth",
      "1",
      "--branch",
      branch,
      cloneUrl,
      checkoutPath
    ]);
  } catch (error) {
    await fs.rm(checkoutPath, { recursive: true, force: true });

    const message = formatGitError("git clone", error);
    if (message.includes("Remote branch") && message.includes("not found")) {
      throw new Error(`Repository branch "${branch}" was not found: ${message}`);
    }

    throw new Error(message);
  }

  let headCommitSha: string | undefined;

  try {
    headCommitSha = await runGit(["rev-parse", "HEAD"], { cwd: checkoutPath });
  } catch (error) {
    await fs.rm(checkoutPath, { recursive: true, force: true });
    throw new Error(formatGitError("git rev-parse HEAD", error));
  }

  const { maxRepoSizeMb } = getScanConfig();
  const checkoutSizeBytes = await measureDirectoryBytes(checkoutPath);

  if (checkoutSizeBytes > maxRepoSizeMb * 1024 * 1024) {
    await fs.rm(checkoutPath, { recursive: true, force: true });
    throw new Error(formatRepoSizeLimitError(maxRepoSizeMb));
  }

  return {
    localPath: checkoutPath,
    headCommitSha,
    checkoutBranch: branch,
    cleanup: createCleanup(checkoutPath)
  };
}

export async function checkoutRepository(
  input: CheckoutRepositoryInput
): Promise<CheckoutRepositoryResult> {
  if (!input.scan.triggeredById) {
    const { repoLocalPath } = getScanConfig();
    const checkoutBranch = input.repository.defaultBranch?.trim() || undefined;

    return {
      localPath: repoLocalPath,
      checkoutBranch,
      cleanup: createCleanup(null)
    };
  }

  return checkoutOAuthRepository(input);
}
