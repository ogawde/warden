import { loadRootEnv } from "@/lib/load-root-env";
import {
  getDefaultGitLabPatAuth,
  type GitLabAuth
} from "@warden/gitlab-mcp";

export type GitLabConfig = {
  auth: GitLabAuth;
  projectId: number;
  baseUrl: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

export function getGitLabBaseUrl(): string {
  loadRootEnv();

  const baseUrl = readEnv("GITLAB_BASE_URL") ?? "https://gitlab.com";
  return baseUrl.replace(/\/$/, "");
}

export function getGitLabConfig(): GitLabConfig {
  loadRootEnv();

  const projectIdRaw = readEnv("GITLAB_PROJECT_ID");
  const baseUrl = getGitLabBaseUrl();

  if (!projectIdRaw) {
    throw new Error("GITLAB_PROJECT_ID is not set");
  }

  const projectId = Number.parseInt(projectIdRaw, 10);

  if (Number.isNaN(projectId)) {
    throw new Error("GITLAB_PROJECT_ID must be a number");
  }

  return {
    auth: getDefaultGitLabPatAuth(),
    projectId,
    baseUrl
  };
}
