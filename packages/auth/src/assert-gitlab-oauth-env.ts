import { loadEnv } from "./load-env";

const TOKEN_KEY_LENGTH = 32;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

/**
 * Ensures env required to decrypt and refresh OAuth tokens is configured.
 * Call only on OAuth credential paths (not demo PAT scans).
 */
export function assertGitLabOAuthCredentialEnv(): void {
  loadEnv();

  const missing: string[] = [];

  if (!readEnv("TOKEN_ENCRYPTION_KEY")) {
    missing.push("TOKEN_ENCRYPTION_KEY");
  }

  if (!readEnv("GITLAB_OAUTH_CLIENT_ID")) {
    missing.push("GITLAB_OAUTH_CLIENT_ID");
  }

  if (!readEnv("GITLAB_OAUTH_CLIENT_SECRET")) {
    missing.push("GITLAB_OAUTH_CLIENT_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `OAuth-triggered scan requires worker env: ${missing.join(", ")}. Set the same values as apps/web.`
    );
  }

  const key = Buffer.from(readEnv("TOKEN_ENCRYPTION_KEY")!, "base64");
  if (key.length !== TOKEN_KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${TOKEN_KEY_LENGTH} bytes (256 bits); got ${key.length} bytes`
    );
  }
}

export function getMissingGitLabOAuthCredentialEnv(): string[] {
  loadEnv();

  const missing: string[] = [];

  if (!readEnv("TOKEN_ENCRYPTION_KEY")) {
    missing.push("TOKEN_ENCRYPTION_KEY");
  }

  if (!readEnv("GITLAB_OAUTH_CLIENT_ID")) {
    missing.push("GITLAB_OAUTH_CLIENT_ID");
  }

  if (!readEnv("GITLAB_OAUTH_CLIENT_SECRET")) {
    missing.push("GITLAB_OAUTH_CLIENT_SECRET");
  }

  return missing;
}
