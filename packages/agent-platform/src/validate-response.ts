import type {
  AgentProposedAction,
  AgentRecommendationResponse
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateProposedAction(value: unknown): AgentProposedAction | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.impact) ||
    !isNonEmptyString(value.effort) ||
    !isNonEmptyString(value.reasoning)
  ) {
    return null;
  }

  return {
    title: value.title.trim(),
    impact: value.impact.trim(),
    effort: value.effort.trim(),
    reasoning: value.reasoning.trim()
  };
}

export function parseAgentJson(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error("Agent response is not valid JSON");
  }
}

export function validateAgentResponse(
  value: unknown
): AgentRecommendationResponse {
  if (!isRecord(value)) {
    throw new Error("Agent response must be a JSON object");
  }

  if (!isNonEmptyString(value.summary)) {
    throw new Error("Agent response missing summary");
  }

  if (!Array.isArray(value.priorities)) {
    throw new Error("Agent response missing priorities array");
  }

  const priorities = value.priorities
    .filter((item): item is string => typeof item === "string" && item.trim())
    .map((item) => item.trim());

  if (!Array.isArray(value.proposedActions) || value.proposedActions.length === 0) {
    throw new Error("Agent response must include at least one proposedAction");
  }

  const proposedActions = value.proposedActions
    .map(validateProposedAction)
    .filter((action): action is AgentProposedAction => action !== null)
    .slice(0, 3);

  if (proposedActions.length === 0) {
    throw new Error("Agent proposedActions failed validation");
  }

  return {
    summary: value.summary.trim(),
    priorities,
    proposedActions
  };
}
