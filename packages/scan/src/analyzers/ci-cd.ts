import type { StaticFindingDraft } from "../types";
import { computePriorityScore } from "../scoring";

export function analyzeCiCdStub(): StaticFindingDraft[] {
  const severity = "MEDIUM";
  const confidence = 0.6;

  return [
    {
      category: "CI_CD",
      severity,
      confidence,
      source: "STATIC",
      title: "CI/CD verification pending (M3 stub)",
      description:
        "Pipeline health is not checked in M3. GitLab REST pipeline integration will replace this stub in a later milestone.",
      priorityScore: computePriorityScore(severity, "CI_CD", confidence),
      priorityReason: "Placeholder until GitLab pipeline read is wired",
      evidence: [
        {
          refId: "static.ci_cd.stub",
          type: "pipeline"
        }
      ]
    }
  ];
}
