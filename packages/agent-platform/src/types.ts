export type AgentProposedAction = {
  title: string;
  impact: string;
  effort: string;
  reasoning: string;
};

export type AgentRecommendationResponse = {
  summary: string;
  priorities: string[];
  proposedActions: AgentProposedAction[];
};

export type AgentReasoningResult = {
  recommendations: AgentRecommendationResponse;
  rawResponse: unknown;
  transport: "reasoning-engine" | "vertex-ai";
};

export type FindingForPrompt = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  priorityScore: number;
  source: string;
};
