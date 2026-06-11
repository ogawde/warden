import type { GitLabAuth } from "./auth";

export type { GitLabAuth, GitLabOAuthAuth, GitLabPatAuth } from "./auth";

export type GitLabCollectContextInput = {
  gitlabProjectId: number;
  /** Used only when gitlab.get_project fails. GitLab API is the source of truth. */
  fallbackDefaultBranch?: string;
  /** When omitted, requests use GITLAB_PAT from the environment. */
  auth?: GitLabAuth;
};

export type McpAuditEntry = {
  tool: string;
  durationMs: number;
  summary: string;
  ok: boolean;
  error?: string;
};

export type GitLabProjectMetadata = {
  refId: string;
  projectId: number;
  pathWithNamespace: string;
  name: string;
  defaultBranch: string;
  webUrl: string;
  lastActivityAt: string | null;
};

export type GitLabMergeRequestSummary = {
  refId: string;
  iid: number;
  title: string;
  state: string;
  sourceBranch: string;
  targetBranch: string;
  webUrl: string;
  authorUsername: string | null;
  pipelineStatus: string | null;
  updatedAt: string;
};

export type GitLabPipelineSummary = {
  refId: string;
  id: number;
  status: string;
  ref: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type GitLabCommitSummary = {
  refId: string;
  sha: string;
  shortSha: string;
  title: string;
  authorName: string;
  committedAt: string;
  webUrl: string;
};

export type GitLabMcpContext = {
  project: GitLabProjectMetadata | null;
  openMergeRequests: GitLabMergeRequestSummary[];
  defaultBranchPipeline: GitLabPipelineSummary | null;
  recentCommits: GitLabCommitSummary[];
  audit: McpAuditEntry[];
  degraded: boolean;
};

export type AnalysisContext = {
  repository: {
    projectId: number;
    pathWithNamespace: string;
    defaultBranch: string;
    webUrl: string | null;
  };
  staticSignals: {
    missingTests: Array<{ refId: string; filePath: string }>;
    largeFiles: Array<{ refId: string; filePath: string; lineCount: number }>;
    todoMarkers: Array<{ refId: string; filePath: string; marker: string }>;
  };
  mcpSummary: {
    project: GitLabProjectMetadata | null;
    openMrs: GitLabMergeRequestSummary[];
    defaultBranchPipeline: GitLabPipelineSummary | null;
    recentCommits: GitLabCommitSummary[];
  };
  mcpAudit: McpAuditEntry[];
  degraded: boolean;
};
