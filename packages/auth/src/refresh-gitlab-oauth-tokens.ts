import { loadEnv } from "./load-env";
import { parseGitLabTokenResponse } from "./parse-gitlab-token-response";
import type {
  GitLabOAuthTokens,
  GitLabTokenApiResponse
} from "./gitlab-oauth-types";

const GITLAB_COM_ORIGIN = "https://gitlab.com";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

function getGitLabOAuthBaseUrl(): string {
  loadEnv();

  const baseUrl = (readEnv("GITLAB_BASE_URL") ?? GITLAB_COM_ORIGIN).replace(
    /\/$/,
    ""
  );

  if (baseUrl !== GITLAB_COM_ORIGIN) {
    throw new Error(
      "GitLab OAuth only supports gitlab.com; set GITLAB_BASE_URL to https://gitlab.com"
    );
  }

  return baseUrl;
}

function formatGitLabOAuthError(
  action: string,
  status: number,
  body: string
): string {
  return `GitLab OAuth ${action} failed (${status}): ${body || "no response body"}`;
}

export type RefreshGitLabOAuthTokensOptions = {
  /** Kept when GitLab omits a new refresh_token in the response. */
  previousRefreshToken?: string;
};

/**
 * Exchange a refresh token for new OAuth tokens.
 * @see https://docs.gitlab.com/api/oauth2/
 */
export async function refreshGitLabOAuthTokens(
  refreshToken: string,
  options: RefreshGitLabOAuthTokensOptions = {}
): Promise<GitLabOAuthTokens> {
  const baseUrl = getGitLabOAuthBaseUrl();
  const body = new URLSearchParams({
    client_id: requireEnv("GITLAB_OAUTH_CLIENT_ID"),
    client_secret: requireEnv("GITLAB_OAUTH_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: body.toString()
  });

  const payload = (await response.json()) as GitLabTokenApiResponse;

  if (!response.ok || payload.error) {
    const detail =
      payload.error_description ?? payload.error ?? JSON.stringify(payload);
    throw new Error(formatGitLabOAuthError("token refresh", response.status, detail));
  }

  const tokens = parseGitLabTokenResponse(payload);

  if (!tokens.refreshToken && options.previousRefreshToken) {
    return {
      ...tokens,
      refreshToken: options.previousRefreshToken
    };
  }

  return tokens;
}
