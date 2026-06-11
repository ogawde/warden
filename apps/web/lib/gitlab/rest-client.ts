import {
  buildGitLabAuthHeaders,
  type GitLabAuth
} from "@warden/gitlab-mcp";
import { getGitLabConfig, type GitLabConfig } from "./config";

type GitLabRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  config?: GitLabConfig;
  auth?: GitLabAuth;
};

export async function gitlabRequest<T>(
  path: string,
  options: GitLabRequestOptions = {}
): Promise<T> {
  const config = options.config ?? getGitLabConfig();
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

  return response.json() as Promise<T>;
}
