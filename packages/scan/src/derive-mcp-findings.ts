import type { GitLabMcpContext } from "@warden/gitlab-mcp";
import { computePriorityScore } from "./scoring";
import type { StaticFindingDraft } from "./types";

export function deriveMcpFindings(
  mcpContext: GitLabMcpContext,
  defaultBranch: string
): StaticFindingDraft[] {
  if (mcpContext.degraded) {
    return [];
  }

  const findings: StaticFindingDraft[] = [];

  const failedMrs = mcpContext.openMergeRequests.filter(
    (mr) => mr.pipelineStatus === "failed"
  );

  if (failedMrs.length > 0) {
    const mr = failedMrs[0];
    const severity = "HIGH";
    const confidence = 0.88;

    findings.push({
      category: "CI_CD",
      severity,
      confidence,
      source: "HYBRID",
      title: `Failed pipeline on open MR !${mr.iid}`,
      description: `Merge request "${mr.title}" has a failed pipeline. Review CI before merge.`,
      priorityScore: computePriorityScore(severity, "CI_CD", confidence),
      priorityReason: "GitLab MCP: open MR with failed head pipeline",
      evidence: [
        {
          refId: mr.refId,
          type: "merge_request",
          filePath: mr.webUrl
        }
      ]
    });
  } else if (
    mcpContext.defaultBranchPipeline &&
    mcpContext.defaultBranchPipeline.status === "failed"
  ) {
    const pipeline = mcpContext.defaultBranchPipeline;
    const severity = "HIGH";
    const confidence = 0.9;

    findings.push({
      category: "CI_CD",
      severity,
      confidence,
      source: "HYBRID",
      title: `Default branch pipeline failed on ${defaultBranch}`,
      description: `Latest pipeline on ${defaultBranch} has status "${pipeline.status}".`,
      priorityScore: computePriorityScore(severity, "CI_CD", confidence),
      priorityReason: "GitLab MCP: default branch pipeline status",
      evidence: [
        {
          refId: pipeline.refId,
          type: "pipeline",
          filePath: pipeline.webUrl
        }
      ]
    });
  }

  const latestCommit = mcpContext.recentCommits[0];
  if (latestCommit) {
    const severity = "HIGH";
    const confidence = 0.8;

    findings.push({
      category: "RISKY_CHANGE",
      severity,
      confidence,
      source: "HYBRID",
      title: `Recent commit on ${defaultBranch}`,
      description: `Latest commit "${latestCommit.title}" (${latestCommit.shortSha}) landed on ${defaultBranch}. Verify it went through merge request review.`,
      priorityScore: computePriorityScore(severity, "RISKY_CHANGE", confidence),
      priorityReason: "GitLab MCP: recent default-branch commit",
      evidence: [
        {
          refId: latestCommit.refId,
          type: "commit",
          commitSha: latestCommit.shortSha,
          filePath: latestCommit.webUrl
        }
      ]
    });
  }

  return findings;
}
