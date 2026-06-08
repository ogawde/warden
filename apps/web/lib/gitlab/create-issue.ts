import { getGitLabConfig, type GitLabConfig } from "./config";
import { gitlabRequest } from "./rest-client";

export type CreateIssueInput = {
  title: string;
  description: string;
  labels?: string[];
};

export type CreateIssueResult = {
  id: number;
  iid: number;
  webUrl: string;
  title: string;
};

type GitLabIssueResponse = {
  id: number;
  iid: number;
  web_url: string;
  title: string;
};

export async function createIssue(
  input: CreateIssueInput,
  config?: GitLabConfig
): Promise<CreateIssueResult> {
  const resolvedConfig = config ?? getGitLabConfig();
  const encodedProjectId = encodeURIComponent(
    String(resolvedConfig.projectId)
  );

  const issue = await gitlabRequest<GitLabIssueResponse>(
    `/projects/${encodedProjectId}/issues`,
    {
      method: "POST",
      config: resolvedConfig,
      body: {
        title: input.title,
        description: input.description,
        labels: input.labels?.join(",") ?? "warden,test"
      }
    }
  );

  return {
    id: issue.id,
    iid: issue.iid,
    webUrl: issue.web_url,
    title: issue.title
  };
}
