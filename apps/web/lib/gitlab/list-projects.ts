import { loadRootEnv } from "@/lib/load-root-env";

const DEFAULT_GITLAB_BASE_URL = "https://gitlab.com";

export type GitLabProject = {
  id: number;
  name: string;
  pathWithNamespace: string;
  defaultBranch: string;
  webUrl: string;
};

type GitLabProjectApiResponse = {
  id: number;
  name: string;
  path_with_namespace: string;
  default_branch?: string;
  web_url?: string;
};

function getGitLabBaseUrl(): string {
  loadRootEnv();

  const raw = process.env.GITLAB_BASE_URL?.trim().replace(/^["']|["']$/g, "");
  return (raw ?? DEFAULT_GITLAB_BASE_URL).replace(/\/$/, "");
}

function formatListProjectsError(status: number, body: string): string {
  return `GitLab project list failed (${status}): ${body || "no response body"}`;
}

function normalizeProject(project: GitLabProjectApiResponse): GitLabProject {
  if (
    !project.id ||
    !project.name?.trim() ||
    !project.path_with_namespace?.trim() ||
    !project.web_url?.trim()
  ) {
    throw new Error("GitLab project response is missing required fields");
  }

  return {
    id: project.id,
    name: project.name,
    pathWithNamespace: project.path_with_namespace,
    defaultBranch: project.default_branch?.trim() || "main",
    webUrl: project.web_url
  };
}

/**
 * List GitLab projects accessible to the authenticated user.
 * @see https://docs.gitlab.com/api/projects.html#list-all-projects
 */
export async function listAccessibleGitLabProjects(
  accessToken: string
): Promise<GitLabProject[]> {
  const baseUrl = getGitLabBaseUrl();
  const params = new URLSearchParams({
    membership: "true",
    min_access_level: "30",
    order_by: "last_activity_at",
    sort: "desc",
    per_page: "100"
  });

  const response = await fetch(`${baseUrl}/api/v4/projects?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(formatListProjectsError(response.status, body));
  }

  let payload: GitLabProjectApiResponse[];

  try {
    payload = JSON.parse(body) as GitLabProjectApiResponse[];
  } catch {
    throw new Error("GitLab project list response was not valid JSON");
  }

  if (!Array.isArray(payload)) {
    throw new Error("GitLab project list response was not a JSON array");
  }

  return payload.map(normalizeProject);
}
