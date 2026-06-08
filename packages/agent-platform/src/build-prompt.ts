import type { AnalysisContext } from "@warden/gitlab-mcp";
import type { FindingForPrompt } from "./types";

export function buildAgentPrompt(input: {
  scanId: string;
  analysisContext: AnalysisContext;
  findings: FindingForPrompt[];
}): string {
  const { scanId, analysisContext, findings } = input;
  const { repository, mcpSummary, staticSignals } = analysisContext;

  const payload = {
    scanId,
    repository,
    staticSignals,
    findings,
    gitlabMcpSummary: {
      project: mcpSummary.project,
      openMergeRequests: mcpSummary.openMrs.map((mr) => ({
        iid: mr.iid,
        title: mr.title,
        pipelineStatus: mr.pipelineStatus,
        targetBranch: mr.targetBranch,
        webUrl: mr.webUrl
      })),
      defaultBranchPipeline: mcpSummary.defaultBranchPipeline,
      recentCommits: mcpSummary.recentCommits.map((commit) => ({
        shortSha: commit.shortSha,
        title: commit.title,
        authorName: commit.authorName,
        committedAt: commit.committedAt
      }))
    },
    riskSignals: findings.map((finding) => ({
      id: finding.id,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      priorityScore: finding.priorityScore
    }))
  };

  return [
    "You are Warden, an engineering manager assistant for a single GitLab repository.",
    "Analyze the facts below and recommend up to 3 GitLab issues the team should create.",
    "Use only evidence from the input. Do not invent file paths, commits, or MR numbers.",
    "",
    "Return JSON only with this exact shape:",
    JSON.stringify(
      {
        summary: "string",
        priorities: ["string"],
        proposedActions: [
          {
            title: "string",
            impact: "string",
            effort: "string",
            reasoning: "string"
          }
        ]
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- proposedActions: 1 to 3 items",
    "- priorities: ordered list of engineering focus areas",
    "- titles must be actionable GitLab issue titles",
    "- reasoning must cite finding ids or MCP facts from the input",
    "",
    "=== ANALYSIS INPUT ===",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}
