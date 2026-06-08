import type { FindingCategory } from "@warden/contracts";
import type { ProposalDraft, StaticFindingDraft } from "./types";

type ProposalTemplate = {
  categories: FindingCategory[];
  title: (findings: StaticFindingDraft[]) => string;
  labels: string[];
};

const TEMPLATES: ProposalTemplate[] = [
  {
    categories: ["MISSING_TESTS"],
    labels: ["warden", "missing-tests"],
    title: (findings) => {
      const paths = findings.map((f) => f.evidence[0]?.filePath).filter(Boolean);
      return `Add unit tests for ${paths.length} source file(s)`;
    }
  },
  {
    categories: ["MAINTAINABILITY"],
    labels: ["warden", "maintainability"],
    title: (findings) =>
      `Refactor oversized file: ${findings[0]?.evidence[0]?.filePath ?? "target"}`
  },
  {
    categories: ["TECHNICAL_DEBT"],
    labels: ["warden", "technical-debt"],
    title: () => "Track and reduce TODO/FIXME/HACK markers"
  },
  {
    categories: ["RISKY_CHANGE", "CI_CD"],
    labels: ["warden", "ci-cd"],
    title: () => "Review default-branch workflow and CI health"
  }
];

function buildSummary(
  title: string,
  findings: StaticFindingDraft[]
): string {
  const bullets = findings.map((f) => `- ${f.title}`).join("\n");

  return ["## Summary", "", title, "", "## Findings", bullets].join("\n");
}

export function generateProposals(
  findings: StaticFindingDraft[],
  findingIds: string[]
): ProposalDraft[] {
  const proposals: ProposalDraft[] = [];

  for (const template of TEMPLATES) {
    if (proposals.length >= 3) {
      break;
    }

    const matchedIndexes: number[] = [];

    findings.forEach((finding, index) => {
      if (template.categories.includes(finding.category)) {
        matchedIndexes.push(index);
      }
    });

    if (matchedIndexes.length === 0) {
      continue;
    }

    const matchedFindings = matchedIndexes.map((i) => findings[i]);
    const title = template.title(matchedFindings);
    const priorityScore = Math.max(
      ...matchedFindings.map((finding) => finding.priorityScore)
    );

    proposals.push({
      title,
      summary: buildSummary(title, matchedFindings),
      priorityScore,
      findingIds: matchedIndexes.map((i) => findingIds[i]),
      labels: template.labels
    });
  }

  return proposals;
}
