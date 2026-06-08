import type { StaticFindingDraft } from "./types";

const STUB_REF_IDS = new Set(["static.ci_cd.stub"]);

function isLocalRiskyStub(finding: StaticFindingDraft): boolean {
  return (
    finding.category === "RISKY_CHANGE" &&
    finding.source === "STATIC" &&
    finding.priorityReason.includes("Stub git heuristic")
  );
}

export function mergeStaticAndMcpFindings(
  staticFindings: StaticFindingDraft[],
  mcpFindings: StaticFindingDraft[],
  maxFindings: number
): StaticFindingDraft[] {
  const mcpCategories = new Set(mcpFindings.map((finding) => finding.category));

  const filteredStatic = staticFindings.filter((finding) => {
    if (
      finding.evidence[0]?.refId &&
      STUB_REF_IDS.has(finding.evidence[0].refId)
    ) {
      return !mcpCategories.has("CI_CD");
    }

    if (isLocalRiskyStub(finding)) {
      return !mcpCategories.has("RISKY_CHANGE");
    }

    return true;
  });

  return [...filteredStatic, ...mcpFindings]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, maxFindings);
}
