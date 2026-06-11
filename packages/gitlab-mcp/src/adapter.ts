/**
 * GitLab MCP adapter: exposes P0 MCP tool names and audit shape.
 * Transport uses GitLab REST API (same contract Agent Builder will consume later).
 */
import { gitlabRestRequest } from "./rest-client";
import type {
  GitLabCollectContextInput,
  GitLabCommitSummary,
  GitLabMcpContext,
  GitLabMergeRequestSummary,
  GitLabPipelineSummary,
  GitLabProjectMetadata,
  McpAuditEntry
} from "./types";

type GitLabProjectResponse = {
  id: number;
  path_with_namespace: string;
  name: string;
  default_branch: string;
  web_url: string;
  last_activity_at?: string;
};

type GitLabMergeRequestResponse = {
  iid: number;
  title: string;
  state: string;
  source_branch: string;
  target_branch: string;
  web_url: string;
  author?: { username?: string };
  updated_at: string;
  head_pipeline?: { status?: string } | null;
};

type GitLabPipelineResponse = {
  id: number;
  status: string;
  ref: string;
  web_url: string;
  created_at: string;
  updated_at: string;
};

type GitLabCommitResponse = {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  committed_date: string;
  web_url: string;
};

const MAX_MCP_CALLS = 8;

async function invokeTool<T>(
  tool: string,
  runner: () => Promise<T>,
  summarize: (result: T) => string
): Promise<{ result: T | null; audit: McpAuditEntry }> {
  const startedAt = Date.now();

  try {
    const result = await runner();
    return {
      result,
      audit: {
        tool,
        durationMs: Date.now() - startedAt,
        summary: summarize(result),
        ok: true
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool call failed";
    return {
      result: null,
      audit: {
        tool,
        durationMs: Date.now() - startedAt,
        summary: message,
        ok: false,
        error: message
      }
    };
  }
}

function projectPath(projectId: number): string {
  return encodeURIComponent(String(projectId));
}

export class GitLabMcpAdapter {
  async collectContext(
    repository: GitLabCollectContextInput
  ): Promise<GitLabMcpContext> {
    const audit: McpAuditEntry[] = [];
    const projectId = repository.gitlabProjectId;
    const requestOptions = repository.auth ? { auth: repository.auth } : {};
    let callCount = 0;

    const projectCall = await invokeTool(
      "gitlab.get_project",
      () =>
        gitlabRestRequest<GitLabProjectResponse>(
          `/projects/${projectPath(projectId)}`,
          requestOptions
        ),
      (project) => `${project.path_with_namespace} (${project.default_branch})`
    );
    audit.push(projectCall.audit);
    callCount += 1;

    const project = projectCall.result
      ? mapProject(projectCall.result)
      : null;

    const defaultBranch =
      project?.defaultBranch ??
      repository.fallbackDefaultBranch ??
      "main";

    const mrCall = await invokeTool(
      "gitlab.list_merge_requests",
      () =>
        gitlabRestRequest<GitLabMergeRequestResponse[]>(
          `/projects/${projectPath(projectId)}/merge_requests?state=opened&per_page=10&order_by=updated_at&sort=desc`,
          requestOptions
        ),
      (mrs) => {
        const failed = mrs.filter(
          (mr) => mr.head_pipeline?.status === "failed"
        ).length;
        return `${mrs.length} open MRs${failed > 0 ? `, ${failed} failed pipeline` : ""}`;
      }
    );
    audit.push(mrCall.audit);
    callCount += 1;

    const openMergeRequests = (mrCall.result ?? []).map((mr, index) =>
      mapMergeRequest(mr, index)
    );

    const pipelineCall = await invokeTool(
      "gitlab.get_pipeline",
      () =>
        gitlabRestRequest<GitLabPipelineResponse[]>(
          `/projects/${projectPath(projectId)}/pipelines?ref=${encodeURIComponent(defaultBranch)}&per_page=1&order_by=id&sort=desc`,
          requestOptions
        ).then((pipelines) => pipelines[0] ?? null),
      (pipeline) =>
        pipeline
          ? `${pipeline.status} on ${pipeline.ref}`
          : `No pipeline on ${defaultBranch}`
    );
    audit.push(pipelineCall.audit);
    callCount += 1;

    const defaultBranchPipeline = pipelineCall.result
      ? mapPipeline(pipelineCall.result, 0)
      : null;

    const commitsCall = await invokeTool(
      "gitlab.list_commits",
      () =>
        gitlabRestRequest<GitLabCommitResponse[]>(
          `/projects/${projectPath(projectId)}/repository/commits?ref_name=${encodeURIComponent(defaultBranch)}&per_page=20`,
          requestOptions
        ),
      (commits) => `${commits.length} commits on ${defaultBranch}`
    );
    audit.push(commitsCall.audit);
    callCount += 1;

    const recentCommits = (commitsCall.result ?? []).map((commit, index) =>
      mapCommit(commit, index)
    );

    const failedMrs = openMergeRequests.filter(
      (mr) => mr.pipelineStatus === "failed"
    );

    for (const mr of failedMrs.slice(0, 2)) {
      if (callCount >= MAX_MCP_CALLS) {
        break;
      }

      const mrPipelineCall = await invokeTool(
        "gitlab.get_pipeline",
        () =>
          gitlabRestRequest<GitLabPipelineResponse[]>(
            `/projects/${projectPath(projectId)}/merge_requests/${mr.iid}/pipelines?per_page=1`,
            requestOptions
          ).then((pipelines) => pipelines[0] ?? null),
        (pipeline) =>
          pipeline
            ? `MR !${mr.iid}: ${pipeline.status}`
            : `MR !${mr.iid}: no pipeline`
      );
      audit.push(mrPipelineCall.audit);
      callCount += 1;
    }

    const successfulCalls = audit.filter((entry) => entry.ok).length;

    return {
      project,
      openMergeRequests,
      defaultBranchPipeline,
      recentCommits,
      audit,
      degraded: successfulCalls < 2
    };
  }
}

function mapProject(project: GitLabProjectResponse): GitLabProjectMetadata {
  return {
    refId: "mcp.project.0",
    projectId: project.id,
    pathWithNamespace: project.path_with_namespace,
    name: project.name,
    defaultBranch: project.default_branch,
    webUrl: project.web_url,
    lastActivityAt: project.last_activity_at ?? null
  };
}

function mapMergeRequest(
  mr: GitLabMergeRequestResponse,
  index: number
): GitLabMergeRequestSummary {
  return {
    refId: `mcp.mr.${index}`,
    iid: mr.iid,
    title: mr.title,
    state: mr.state,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    webUrl: mr.web_url,
    authorUsername: mr.author?.username ?? null,
    pipelineStatus: mr.head_pipeline?.status ?? null,
    updatedAt: mr.updated_at
  };
}

function mapPipeline(
  pipeline: GitLabPipelineResponse,
  index: number
): GitLabPipelineSummary {
  return {
    refId: `mcp.pipeline.${index}`,
    id: pipeline.id,
    status: pipeline.status,
    ref: pipeline.ref,
    webUrl: pipeline.web_url,
    createdAt: pipeline.created_at,
    updatedAt: pipeline.updated_at
  };
}

function mapCommit(
  commit: GitLabCommitResponse,
  index: number
): GitLabCommitSummary {
  return {
    refId: `mcp.commit.${index}`,
    sha: commit.id,
    shortSha: commit.short_id,
    title: commit.title,
    authorName: commit.author_name,
    committedAt: commit.committed_date,
    webUrl: commit.web_url
  };
}
