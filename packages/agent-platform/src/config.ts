import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

let loaded = false;

function loadEnv(): void {
  if (loaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../../../.env")
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath, override: true });
      loaded = true;
      return;
    }
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

export type AgentPlatformConfig = {
  projectId: string;
  location: string;
  reasoningEngineId: string | null;
  classMethod: string;
  inputKey: string;
  vertexModel: string;
  isConfigured: boolean;
  vertexFallbackEnabled: boolean;
};

export function getAgentPlatformConfig(): AgentPlatformConfig {
  loadEnv();

  const projectId = readEnv("GOOGLE_CLOUD_PROJECT") ?? "";
  const location = readEnv("GOOGLE_CLOUD_LOCATION") ?? "us-central1";
  const reasoningEngineId =
    readEnv("AGENT_PLATFORM_REASONING_ENGINE_ID") ??
    readEnv("WARDEN_AGENT_REASONING_ENGINE_ID") ??
    null;
  const classMethod = readEnv("AGENT_PLATFORM_CLASS_METHOD") ?? "query";
  const inputKey = readEnv("AGENT_PLATFORM_INPUT_KEY") ?? "input";
  const vertexModel =
    readEnv("VERTEX_GEMINI_MODEL") ??
    readEnv("GEMINI_MODEL") ??
    "gemini-2.5-flash";

  const vertexFallbackEnabled = Boolean(projectId);
  const isConfigured = Boolean(
    (projectId && reasoningEngineId) || vertexFallbackEnabled
  );

  return {
    projectId,
    location,
    reasoningEngineId,
    classMethod,
    inputKey,
    vertexModel,
    isConfigured,
    vertexFallbackEnabled
  };
}
