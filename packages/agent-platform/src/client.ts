import { GoogleAuth } from "google-auth-library";
import { getAgentPlatformConfig } from "./config";
import { parseAgentJson, validateAgentResponse } from "./validate-response";
import type { AgentReasoningResult } from "./types";

async function getAccessToken(): Promise<string | null> {
  const explicitToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
  if (explicitToken) {
    return explicitToken;
  }

  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token ?? null;
  } catch {
    return null;
  }
}

function extractTextFromReasoningResponse(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Empty agent response");
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.output === "string") {
    return record.output;
  }

  if (typeof record.text === "string") {
    return record.text;
  }

  if (record.output && typeof record.output === "object") {
    const output = record.output as Record<string, unknown>;
    if (typeof output.text === "string") {
      return output.text;
    }
    if (typeof output.result === "string") {
      return output.result;
    }
  }

  if (typeof record.result === "string") {
    return record.result;
  }

  return JSON.stringify(payload);
}

function extractTextFromVertexResponse(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error("Empty Vertex AI response");
  }

  const record = payload as Record<string, unknown>;
  const candidates = record.candidates;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("Vertex AI returned no candidates");
  }

  const first = candidates[0] as Record<string, unknown>;
  const content = first.content as Record<string, unknown> | undefined;
  const parts = content?.parts;

  if (!Array.isArray(parts)) {
    throw new Error("Vertex AI response missing content parts");
  }

  const text = parts
    .map((part) => {
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text: string }).text);
      }
      return "";
    })
    .join("")
    .trim();

  if (!text) {
    throw new Error("Vertex AI returned an empty response");
  }

  return text;
}

async function invokeReasoningEngine(
  prompt: string
): Promise<{ rawResponse: unknown; text: string }> {
  const config = getAgentPlatformConfig();

  if (!config.projectId || !config.reasoningEngineId) {
    throw new Error("Reasoning engine is not configured");
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Google Cloud credentials are not available");
  }

  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/reasoningEngines/${config.reasoningEngineId}:query`;

  const inputPayload =
    config.inputKey === "input"
      ? { input: prompt }
      : { [config.inputKey]: prompt };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      class_method: config.classMethod,
      input: inputPayload
    })
  });

  const rawResponse = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      rawResponse &&
      typeof rawResponse === "object" &&
      "error" in rawResponse &&
      typeof (rawResponse as { error?: { message?: string } }).error?.message ===
        "string"
        ? (rawResponse as { error: { message: string } }).error.message
        : `Reasoning engine returned ${response.status}`;
    throw new Error(message);
  }

  return {
    rawResponse,
    text: extractTextFromReasoningResponse(rawResponse)
  };
}

async function invokeVertexGemini(
  prompt: string
): Promise<{ rawResponse: unknown; text: string }> {
  const config = getAgentPlatformConfig();

  if (!config.projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured");
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error(
      "Google Cloud credentials are not available. Run: gcloud auth application-default login"
    );
  }

  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${config.vertexModel}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  const rawResponse = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      rawResponse &&
      typeof rawResponse === "object" &&
      "error" in rawResponse &&
      typeof (rawResponse as { error?: { message?: string } }).error?.message ===
        "string"
        ? (rawResponse as { error: { message: string } }).error.message
        : `Vertex AI returned ${response.status}`;
    throw new Error(message);
  }

  return {
    rawResponse,
    text: extractTextFromVertexResponse(rawResponse)
  };
}

export async function requestAgentRecommendations(
  prompt: string
): Promise<AgentReasoningResult> {
  const config = getAgentPlatformConfig();

  if (!config.isConfigured) {
    throw new Error("Agent Platform is not configured");
  }

  let transport: AgentReasoningResult["transport"] = "vertex-ai";
  let invocation: { rawResponse: unknown; text: string };

  if (config.projectId && config.reasoningEngineId) {
    try {
      invocation = await invokeReasoningEngine(prompt);
      transport = "reasoning-engine";
    } catch (reasoningError) {
      if (!config.vertexFallbackEnabled) {
        throw reasoningError;
      }

      invocation = await invokeVertexGemini(prompt);
      transport = "vertex-ai";
    }
  } else {
    invocation = await invokeVertexGemini(prompt);
  }

  const parsed = parseAgentJson(invocation.text);
  const recommendations = validateAgentResponse(parsed);

  return {
    recommendations,
    rawResponse: invocation.rawResponse,
    transport
  };
}
