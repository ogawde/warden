import type {
  GitLabOAuthTokens,
  GitLabTokenApiResponse
} from "./gitlab-oauth-types";

export function parseGitLabTokenResponse(
  payload: GitLabTokenApiResponse
): GitLabOAuthTokens {
  if (!payload.access_token) {
    throw new Error("GitLab OAuth response returned no access_token");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenType: payload.token_type,
    expiresIn: payload.expires_in,
    createdAt: payload.created_at ?? Math.floor(Date.now() / 1000)
  };
}
