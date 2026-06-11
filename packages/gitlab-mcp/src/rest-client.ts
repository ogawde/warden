import { buildGitLabAuthHeaders, type GitLabAuth } from "./auth";
import { getGitLabMcpConfig, type GitLabMcpConfig } from "./config";

type GitLabRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  config?: GitLabMcpConfig;
  auth?: GitLabAuth;
};

export async function gitlabRestRequest<T>(
  path: string,
  options: GitLabRequestOptions = {}
): Promise<T> {
  const config = options.config ?? getGitLabMcpConfig();
  const auth = options.auth ?? config.auth;
  const url = `${config.baseUrl}/api/v4${path}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...buildGitLabAuthHeaders(auth),
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitLab API ${response.status}: ${errorBody || response.statusText}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
