import type { User } from "@warden/db";
import { decryptToken } from "./token-crypto";

export function getUserGitLabAccessToken(user: User): string {
  if (!user.accessTokenEnc) {
    throw new Error("GitLab access token is not available for this user");
  }

  if (!user.tokenExpiresAt) {
    throw new Error("GitLab token expiry is not set for this user");
  }

  if (user.tokenExpiresAt.getTime() <= Date.now()) {
    throw new Error("GitLab access token has expired; re-authenticate with GitLab");
  }

  try {
    return decryptToken(user.accessTokenEnc);
  } catch {
    throw new Error("GitLab access token could not be decrypted");
  }
}
