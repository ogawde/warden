import type { FindingCategory } from "@warden/contracts";

export type RepoFile = {
  relativePath: string;
  lineCount: number;
  content?: string;
};

export type ScanRepositorySnapshot = {
  rootPath: string;
  files: RepoFile[];
  filePathSet: Set<string>;
};

export type StaticFindingDraft = {
  category: FindingCategory;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  confidence: number;
  source: "STATIC" | "AGENT" | "HYBRID";
  title: string;
  description: string;
  priorityScore: number;
  priorityReason: string;
  evidence: Array<{
    refId: string;
    type: string;
    filePath?: string;
    commitSha?: string;
  }>;
};

export type ProposalDraft = {
  title: string;
  summary: string;
  priorityScore: number;
  findingIds: string[];
  labels: string[];
};

export type StaticAnalysisResult = {
  findings: StaticFindingDraft[];
  audit: Array<{ tool: string; summary: string }>;
};
