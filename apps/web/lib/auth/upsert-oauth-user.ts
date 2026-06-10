import type {
  GitLabOAuthTokens,
  GitLabUserProfile
} from "@/lib/auth/gitlab-oauth";
import { encryptToken } from "@/lib/auth/token-crypto";
import type { User } from "@warden/db";
import { prisma } from "@/lib/db";

function pickRealEmail(profile: GitLabUserProfile): string | null {
  const email = profile.email?.trim();
  if (email) {
    return email;
  }

  const publicEmail = profile.publicEmail?.trim();
  if (publicEmail) {
    return publicEmail;
  }

  return null;
}

function resolveUserEmail(profile: GitLabUserProfile): string {
  return pickRealEmail(profile) ?? `${profile.id}@users.gitlab.warden`;
}

function computeTokenExpiresAt(tokens: GitLabOAuthTokens): Date {
  return new Date((tokens.createdAt + tokens.expiresIn) * 1000);
}

function buildEncryptedTokenFields(tokens: GitLabOAuthTokens) {
  return {
    accessTokenEnc: encryptToken(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null,
    tokenExpiresAt: computeTokenExpiresAt(tokens)
  };
}

export async function upsertOAuthUser(
  profile: GitLabUserProfile,
  tokens: GitLabOAuthTokens
): Promise<User> {
  const now = new Date();
  const realEmail = pickRealEmail(profile);
  const encryptedTokens = buildEncryptedTokenFields(tokens);

  return prisma.user.upsert({
    where: { gitlabUserId: profile.id },
    create: {
      gitlabUserId: profile.id,
      gitlabUsername: profile.username,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      email: resolveUserEmail(profile),
      lastLoginAt: now,
      ...encryptedTokens
    },
    update: {
      gitlabUsername: profile.username,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      lastLoginAt: now,
      ...encryptedTokens,
      ...(realEmail ? { email: realEmail } : {})
    }
  });
}
