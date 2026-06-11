import type { User } from "@warden/db";
import { decryptToken } from "./token-crypto";
import { refreshGitLabOAuthTokens } from "./refresh-gitlab-oauth-tokens";
import { persistUserOAuthTokens } from "./persist-user-oauth-tokens";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const REAUTH_MESSAGE = "re-authenticate with GitLab";

function decryptAccessToken(accessTokenEnc: string): string {
  try {
    return decryptToken(accessTokenEnc);
  } catch {
    throw new Error(`GitLab access token could not be decrypted; ${REAUTH_MESSAGE}`);
  }
}

function decryptRefreshToken(refreshTokenEnc: string): string {
  try {
    return decryptToken(refreshTokenEnc);
  } catch {
    throw new Error(`GitLab refresh token could not be decrypted; ${REAUTH_MESSAGE}`);
  }
}

function assertTokenFields(user: User): asserts user is User & {
  accessTokenEnc: string;
  tokenExpiresAt: Date;
} {
  if (!user.accessTokenEnc) {
    throw new Error(`GitLab access token is not available for this user; ${REAUTH_MESSAGE}`);
  }

  if (!user.tokenExpiresAt) {
    throw new Error(`GitLab token expiry is not set for this user; ${REAUTH_MESSAGE}`);
  }
}

function accessTokenStillValid(tokenExpiresAt: Date): boolean {
  return tokenExpiresAt.getTime() - Date.now() > TOKEN_REFRESH_BUFFER_MS;
}

export async function getValidGitLabAccessToken(user: User): Promise<string> {
  assertTokenFields(user);

  if (accessTokenStillValid(user.tokenExpiresAt)) {
    return decryptAccessToken(user.accessTokenEnc);
  }

  if (!user.refreshTokenEnc) {
    throw new Error(`GitLab refresh token is not available; ${REAUTH_MESSAGE}`);
  }

  const refreshToken = decryptRefreshToken(user.refreshTokenEnc);

  let tokens;

  try {
    tokens = await refreshGitLabOAuthTokens(refreshToken, {
      previousRefreshToken: refreshToken
    });
  } catch {
    throw new Error(`GitLab token refresh failed; ${REAUTH_MESSAGE}`);
  }

  await persistUserOAuthTokens(user.id, tokens);

  return tokens.accessToken;
}
