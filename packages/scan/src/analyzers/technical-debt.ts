import type { ScanRepositorySnapshot } from "../types";
import { getSourceFiles } from "../repository-reader";
import { computePriorityScore } from "../scoring";
import type { StaticFindingDraft } from "../types";

const MARKER_PATTERN = /\b(TODO|FIXME|HACK)\b/g;

export function analyzeTechnicalDebt(
  snapshot: ScanRepositorySnapshot
): StaticFindingDraft[] {
  const findings: StaticFindingDraft[] = [];
  let refIndex = 0;

  for (const file of getSourceFiles(snapshot)) {
    if (!file.content) {
      continue;
    }

    const matches = file.content.match(MARKER_PATTERN);
    if (!matches || matches.length === 0) {
      continue;
    }

    const severity = matches.length >= 10 ? "MEDIUM" : "LOW";
    const confidence = 0.9;

    findings.push({
      category: "TECHNICAL_DEBT",
      severity,
      confidence,
      source: "STATIC",
      title: `${matches.length} debt markers in ${file.relativePath}`,
      description: `Found ${matches.length} TODO/FIXME/HACK comments. Track and prioritize paydown.`,
      priorityScore: computePriorityScore(severity, "TECHNICAL_DEBT", confidence),
      priorityReason: `TODO/FIXME/HACK count = ${matches.length}`,
      evidence: [
        {
          refId: `static.todo.${refIndex}`,
          type: "file",
          filePath: file.relativePath
        }
      ]
    });

    refIndex += 1;
  }

  return findings;
}
