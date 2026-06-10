import { loadRootEnv } from "@/lib/load-root-env";

const GITLAB_COM_ORIGIN = "https://gitlab.com";
const OAUTH_CALLBACK_PATH = "/api/auth/gitlab/callback";

export type GitLabOAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number;
  createdAt: number;
};

export type GitLabUserProfile = {
  id: number;
  username: string;
  email: string | null;
  publicEmail: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type GitLabTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  created_at: number;
  error?: string;
  error_description?: string;
};

type GitLabUserApiResponse = {
  id: number;
  username: string;
  email?: string | null;
  public_email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

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

function getGitLabBaseUrl(): string {
  loadRootEnv();

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

function getOAuthRedirectUri(): string {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  return `${appUrl}${OAUTH_CALLBACK_PATH}`;
}

function getOAuthScopes(): string {
  return requireEnv("GITLAB_OAUTH_SCOPES");
}

function getOAuthClientId(): string {
  return requireEnv("GITLAB_OAUTH_CLIENT_ID");
}

function getOAuthClientSecret(): string {
  return requireEnv("GITLAB_OAUTH_CLIENT_SECRET");
}

function formatGitLabOAuthError(
  action: string,
  status: number,
  body: string
): string {
  return `GitLab OAuth ${action} failed (${status}): ${body || "no response body"}`;
}

/**
 * Build the GitLab authorization URL for the authorization code flow.
 * @see https://docs.gitlab.com/api/oauth2/
 */
export function getGitLabAuthorizeUrl(state: string): string {
  const baseUrl = getGitLabBaseUrl();
  const params = new URLSearchParams({
    client_id: getOAuthClientId(),
    redirect_uri: getOAuthRedirectUri(),
    response_type: "code",
    state,
    scope: getOAuthScopes()
  });

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for OAuth access and refresh tokens.
 * @see https://docs.gitlab.com/api/oauth2/
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GitLabOAuthTokens> {
  const baseUrl = getGitLabBaseUrl();
  const body = new URLSearchParams({
    client_id: getOAuthClientId(),
    client_secret: getOAuthClientSecret(),
    code,
    grant_type: "authorization_code",
    redirect_uri: getOAuthRedirectUri()
  });

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: body.toString()
  });

  const payload = (await response.json()) as GitLabTokenResponse;

  if (!response.ok || payload.error) {
    const detail =
      payload.error_description ?? payload.error ?? JSON.stringify(payload);
    throw new Error(
      formatGitLabOAuthError("token exchange", response.status, detail)
    );
  }

  if (!payload.access_token) {
    throw new Error("GitLab OAuth token exchange returned no access_token");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenType: payload.token_type,
    expiresIn: payload.expires_in,
    createdAt: payload.created_at
  };
}

/**
 * Fetch the authenticated GitLab user profile.
 * @see https://docs.gitlab.com/api/users.html#for-user
 */
export async function fetchGitLabUser(
  accessToken: string
): Promise<GitLabUserProfile> {
  const baseUrl = getGitLabBaseUrl();

  const response = await fetch(`${baseUrl}/api/v4/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      formatGitLabOAuthError("user profile fetch", response.status, body)
    );
  }

  let payload: GitLabUserApiResponse;

  try {
    payload = JSON.parse(body) as GitLabUserApiResponse;
  } catch {
    throw new Error("GitLab user profile response was not valid JSON");
  }

  if (!payload.id || !payload.username) {
    throw new Error("GitLab user profile response is missing required fields");
  }

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email ?? null,
    publicEmail: payload.public_email ?? null,
    name: payload.name ?? null,
    avatarUrl: payload.avatar_url ?? null
  };
}
