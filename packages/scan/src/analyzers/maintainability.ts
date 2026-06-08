import type { ScanRepositorySnapshot } from "../types";
import { getSourceFiles } from "../repository-reader";
import { computePriorityScore } from "../scoring";
import type { StaticFindingDraft } from "../types";

export function analyzeMaintainability(
  snapshot: ScanRepositorySnapshot,
  maxFileLines: number
): StaticFindingDraft[] {
  const findings: StaticFindingDraft[] = [];
  let refIndex = 0;

  for (const file of getSourceFiles(snapshot)) {
    if (file.lineCount <= maxFileLines) {
      continue;
    }

    const severity = file.lineCount > maxFileLines * 1.75 ? "HIGH" : "MEDIUM";
    const confidence = 0.95;

    findings.push({
      category: "MAINTAINABILITY",
      severity,
      confidence,
      source: "STATIC",
      title: `${file.relativePath} exceeds ${maxFileLines} lines`,
      description: `File has ${file.lineCount} lines (threshold: ${maxFileLines}). Consider splitting into smaller modules.`,
      priorityScore: computePriorityScore(
        severity,
        "MAINTAINABILITY",
        confidence
      ),
      priorityReason: `File length ${file.lineCount} > ${maxFileLines}`,
      evidence: [
        {
          refId: `static.large_file.${refIndex}`,
          type: "file",
          filePath: file.relativePath
        }
      ]
    });

    refIndex += 1;
  }

  return findings;
}
