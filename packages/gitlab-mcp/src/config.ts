import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import type { GitLabAuth, GitLabPatAuth } from "./auth";

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

export type GitLabMcpConfig = {
  auth: GitLabAuth;
  projectId: number;
  baseUrl: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/^["']|["']$/g, "");
}

export function getGitLabMcpConfig(): GitLabMcpConfig {
  loadEnv();

  const pat = readEnv("GITLAB_PAT");
  const projectIdRaw = readEnv("GITLAB_PROJECT_ID");
  const baseUrl = readEnv("GITLAB_BASE_URL") ?? "https://gitlab.com";

  if (!pat) {
    throw new Error("GITLAB_PAT is not set");
  }

  if (!projectIdRaw) {
    throw new Error("GITLAB_PROJECT_ID is not set");
  }

  const projectId = Number.parseInt(projectIdRaw, 10);

  if (Number.isNaN(projectId)) {
    throw new Error("GITLAB_PROJECT_ID must be a number");
  }

  return {
    auth: { type: "pat", token: pat },
    projectId,
    baseUrl: baseUrl.replace(/\/$/, "")
  };
}

export function getDefaultGitLabPatAuth(): GitLabPatAuth {
  loadEnv();

  const pat = readEnv("GITLAB_PAT");
  if (!pat) {
    throw new Error("GITLAB_PAT is not set");
  }

  return { type: "pat", token: pat };
}
