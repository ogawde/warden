import type { FindingCategory } from "@warden/contracts";
import type { StaticFindingDraft } from "./types";

const severityWeight: Record<StaticFindingDraft["severity"], number> = {
  CRITICAL: 50,
  HIGH: 35,
  MEDIUM: 20,
  LOW: 10,
  INFO: 5
};

const categoryBoost: Record<FindingCategory, number> = {
  CI_CD: 15,
  RISKY_CHANGE: 12,
  MISSING_TESTS: 8,
  MAINTAINABILITY: 6,
  TECHNICAL_DEBT: 4
};

export function computePriorityScore(
  severity: StaticFindingDraft["severity"],
  category: FindingCategory,
  confidence: number
): number {
  return Math.min(
    100,
    severityWeight[severity] +
      categoryBoost[category] +
      10 +
      Math.round(confidence * 10)
  );
}
