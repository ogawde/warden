import { prisma } from "@warden/db";
import { encryptToken } from "./token-crypto";
import type { GitLabOAuthTokens } from "./gitlab-oauth-types";

export function computeTokenExpiresAt(tokens: GitLabOAuthTokens): Date {
  return new Date((tokens.createdAt + tokens.expiresIn) * 1000);
}

export function buildEncryptedTokenFields(tokens: GitLabOAuthTokens) {
  return {
    accessTokenEnc: encryptToken(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null,
    tokenExpiresAt: computeTokenExpiresAt(tokens)
  };
}

export async function persistUserOAuthTokens(
  userId: string,
  tokens: GitLabOAuthTokens
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: buildEncryptedTokenFields(tokens)
  });
}
