export type GitLabPatAuth = {
  type: "pat";
  token: string;
};

export type GitLabOAuthAuth = {
  type: "oauth";
  accessToken: string;
};

export type GitLabAuth = GitLabPatAuth | GitLabOAuthAuth;

export function buildGitLabAuthHeaders(auth: GitLabAuth): Record<string, string> {
  if (auth.type === "pat") {
    return { "PRIVATE-TOKEN": auth.token };
  }

  return { Authorization: `Bearer ${auth.accessToken}` };
}
