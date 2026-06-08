import type {
  AgentRecommendationResponse,
  FindingForPrompt
} from "./types";

export type ConvertedProposal = {
  title: string;
  summary: string;
  priorityScore: number;
  findingIds: string[];
  labels: string[];
};

const IMPACT_SCORE: Record<string, number> = {
  high: 90,
  medium: 75,
  low: 60
};

function scoreImpact(impact: string): number {
  const normalized = impact.toLowerCase();
  if (normalized.includes("high")) {
    return IMPACT_SCORE.high;
  }
  if (normalized.includes("low")) {
    return IMPACT_SCORE.low;
  }
  return IMPACT_SCORE.medium;
}

function matchFindingIds(
  action: AgentRecommendationResponse["proposedActions"][number],
  findings: FindingForPrompt[],
  priorities: string[]
): string[] {
  const haystack = [
    action.title,
    action.reasoning,
    action.impact,
    ...priorities
  ]
    .join(" ")
    .toLowerCase();

  const matched = findings
    .filter((finding) => {
      const category = finding.category.toLowerCase().replace(/_/g, " ");
      return (
        haystack.includes(finding.id.toLowerCase()) ||
        haystack.includes(category) ||
        haystack.includes(finding.title.toLowerCase())
      );
    })
    .map((finding) => finding.id);

  if (matched.length > 0) {
    return matched;
  }

  const topFinding = [...findings].sort(
    (a, b) => b.priorityScore - a.priorityScore
  )[0];

  return topFinding ? [topFinding.id] : [];
}

function buildSummary(
  recommendations: AgentRecommendationResponse,
  action: AgentRecommendationResponse["proposedActions"][number]
): string {
  return [
    "## Summary",
    "",
    recommendations.summary,
    "",
    `### ${action.title}`,
    "",
    `**Impact:** ${action.impact}`,
    `**Effort:** ${action.effort}`,
    "",
    action.reasoning,
    "",
    "## Priorities",
    ...recommendations.priorities.map((priority) => `- ${priority}`)
  ].join("\n");
}

export function convertRecommendationsToProposals(
  recommendations: AgentRecommendationResponse,
  findings: FindingForPrompt[]
): ConvertedProposal[] {
  return recommendations.proposedActions.map((action, index) => ({
    title: action.title,
    summary: buildSummary(recommendations, action),
    priorityScore: Math.max(50, scoreImpact(action.impact) - index * 5),
    findingIds: matchFindingIds(action, findings, recommendations.priorities),
    labels: ["warden", "agent-recommended"]
  }));
}
