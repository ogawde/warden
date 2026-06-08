import { loadRootEnv } from "@/lib/load-root-env";

export type GitLabConfig = {
  pat: string;
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

export function getGitLabConfig(): GitLabConfig {
  loadRootEnv();

  const pat = readEnv("GITLAB_PAT");
  const projectIdRaw = readEnv("GITLAB_PROJECT_ID");
  const baseUrl = readEnv("GITLAB_BASE_URL") ?? "https://gitlab.com";

  if (!pat) {
    throw new Error("GITLAB_PAT is not set");
  }

  if (!projectIdRaw) {
    throw new Error("GITLAB_PROJECT_ID is not set");
  }

  const projectId = Number.parseInt(projectIdRaw, 10);

  if (Number.isNaN(projectId)) {
    throw new Error("GITLAB_PROJECT_ID must be a number");
  }

  return {
    pat,
    projectId,
    baseUrl: baseUrl.replace(/\/$/, "")
  };
}
