import type { AnalysisContext, GitLabMcpContext } from "./types";

type RepositoryRecord = {
  gitlabProjectId: number;
  pathWithNamespace: string;
  defaultBranch: string;
  webUrl: string | null;
};

type StaticFindingInput = {
  category: string;
  description: string;
  evidence: Array<{ refId: string; filePath?: string }>;
};

function parseLineCount(description: string): number {
  const match = description.match(/(\d+) lines/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function buildAnalysisContext(input: {
  repository: RepositoryRecord;
  staticFindings: StaticFindingInput[];
  mcpContext: GitLabMcpContext;
}): AnalysisContext {
  const { repository, staticFindings, mcpContext } = input;

  const missingTests = staticFindings
    .filter((finding) => finding.category === "MISSING_TESTS")
    .map((finding) => ({
      refId: finding.evidence[0]?.refId ?? "static.missing_test.unknown",
      filePath: finding.evidence[0]?.filePath ?? "unknown"
    }));

  const largeFiles = staticFindings
    .filter((finding) => finding.category === "MAINTAINABILITY")
    .map((finding) => ({
      refId: finding.evidence[0]?.refId ?? "static.large_file.unknown",
      filePath: finding.evidence[0]?.filePath ?? "unknown",
      lineCount: parseLineCount(finding.description)
    }));

  const todoMarkers = staticFindings
    .filter((finding) => finding.category === "TECHNICAL_DEBT")
    .map((finding) => ({
      refId: finding.evidence[0]?.refId ?? "static.todo.unknown",
      filePath: finding.evidence[0]?.filePath ?? "unknown",
      marker: "TODO"
    }));

  const gitlabProject = mcpContext.project;

  return {
    repository: {
      projectId: gitlabProject?.projectId ?? repository.gitlabProjectId,
      pathWithNamespace:
        gitlabProject?.pathWithNamespace ?? repository.pathWithNamespace,
      defaultBranch: gitlabProject?.defaultBranch ?? repository.defaultBranch,
      webUrl: gitlabProject?.webUrl ?? repository.webUrl
    },
    staticSignals: {
      missingTests,
      largeFiles,
      todoMarkers
    },
    mcpSummary: {
      project: mcpContext.project,
      openMrs: mcpContext.openMergeRequests,
      defaultBranchPipeline: mcpContext.defaultBranchPipeline,
      recentCommits: mcpContext.recentCommits
    },
    mcpAudit: mcpContext.audit,
    degraded: mcpContext.degraded
  };
}
