import {
  buildAgentPrompt,
  convertRecommendationsToProposals,
  getAgentPlatformConfig,
  requestAgentRecommendations,
  type AgentReasoningResult,
  type FindingForPrompt
} from "@warden/agent-platform";
import type { AnalysisContext } from "@warden/gitlab-mcp";
import { generateProposals } from "./generate-proposals";
import type { ProposalDraft, StaticFindingDraft } from "./types";

export type AgentReasoningSnapshot = {
  source: "gemini-agent-platform" | "rule-based-fallback";
  transport?: AgentReasoningResult["transport"];
  summary?: string;
  priorities?: string[];
  proposedActions?: AgentReasoningResult["recommendations"]["proposedActions"];
  rawResponse?: unknown;
  error?: string;
};

export type RunAgentReasoningResult = {
  proposals: ProposalDraft[];
  agentDegraded: boolean;
  agentReasoning: AgentReasoningSnapshot;
};

export async function runAgentReasoning(input: {
  scanId: string;
  analysisContext: AnalysisContext;
  findings: StaticFindingDraft[];
  findingRecords: Array<{ id: string } & StaticFindingDraft>;
}): Promise<RunAgentReasoningResult> {
  const { scanId, analysisContext, findings, findingRecords } = input;
  const agentConfig = getAgentPlatformConfig();

  const findingsForPrompt: FindingForPrompt[] = findingRecords.map(
    (record) => ({
      id: record.id,
      category: record.category,
      severity: record.severity,
      title: record.title,
      description: record.description,
      priorityScore: record.priorityScore,
      source: record.source
    })
  );

  if (!agentConfig.isConfigured) {
    return {
      proposals: generateProposals(
        findings,
        findingRecords.map((record) => record.id)
      ),
      agentDegraded: true,
      agentReasoning: {
        source: "rule-based-fallback",
        error: "Agent Platform is not configured"
      }
    };
  }

  try {
    const prompt = buildAgentPrompt({
      scanId,
      analysisContext,
      findings: findingsForPrompt
    });

    const agentResult = await requestAgentRecommendations(prompt);
    const proposals = convertRecommendationsToProposals(
      agentResult.recommendations,
      findingsForPrompt
    );

    return {
      proposals,
      agentDegraded: false,
      agentReasoning: {
        source: "gemini-agent-platform",
        transport: agentResult.transport,
        summary: agentResult.recommendations.summary,
        priorities: agentResult.recommendations.priorities,
        proposedActions: agentResult.recommendations.proposedActions,
        rawResponse: agentResult.rawResponse
      }
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent reasoning failed";

    return {
      proposals: generateProposals(
        findings,
        findingRecords.map((record) => record.id)
      ),
      agentDegraded: true,
      agentReasoning: {
        source: "rule-based-fallback",
        error: message
      }
    };
  }
}
