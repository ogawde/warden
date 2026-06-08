export { requestAgentRecommendations } from "./client";
export { buildAgentPrompt } from "./build-prompt";
export { convertRecommendationsToProposals } from "./convert-recommendations";
export { getAgentPlatformConfig } from "./config";
export { validateAgentResponse, parseAgentJson } from "./validate-response";
export type {
  AgentRecommendationResponse,
  AgentProposedAction,
  AgentReasoningResult,
  FindingForPrompt
} from "./types";
export type { ConvertedProposal } from "./convert-recommendations";
