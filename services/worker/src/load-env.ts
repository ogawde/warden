import {
  getMissingGitLabOAuthCredentialEnv
} from "@warden/auth";
import { loadEnv as loadScanEnv } from "@warden/scan";

const TOKEN_KEY_LENGTH = 32;

/**
 * Worker runtime environment.
 *
 * Demo scans (triggeredById null):
 *   GITLAB_PAT, GITLAB_PROJECT_ID, GITLAB_BASE_URL
 *
 * OAuth-triggered scans additionally require (same values as apps/web):
 *   TOKEN_ENCRYPTION_KEY — decrypt User.accessTokenEnc / refreshTokenEnc
 *   GITLAB_OAUTH_CLIENT_ID — GitLab OAuth app client id
 *   GITLAB_OAUTH_CLIENT_SECRET — GitLab OAuth app client secret
 */
export function loadWorkerEnv(): void {
  loadScanEnv();
  assertProductionEnv();
  validateTokenEncryptionKey();
  warnMissingOAuthCredentialEnv();
}

function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required in production");
  }

  if (!process.env.WORKER_SECRET?.trim()) {
    throw new Error("WORKER_SECRET is required in production");
  }
}

function validateTokenEncryptionKey(): void {
  const raw = process.env.TOKEN_ENCRYPTION_KEY?.trim();

  if (!raw) {
    console.warn(
      "[worker] TOKEN_ENCRYPTION_KEY is not set — OAuth-triggered scans will fail at credential resolution"
    );
    return;
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== TOKEN_KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${TOKEN_KEY_LENGTH} bytes (256 bits); got ${key.length} bytes`
    );
  }
}

function warnMissingOAuthCredentialEnv(): void {
  const missing = getMissingGitLabOAuthCredentialEnv().filter(
    (name) => name !== "TOKEN_ENCRYPTION_KEY"
  );

  if (missing.length === 0) {
    return;
  }

  console.warn(
    `[worker] Missing OAuth env (${missing.join(", ")}) — OAuth-triggered scans will fail until configured`
  );
}
