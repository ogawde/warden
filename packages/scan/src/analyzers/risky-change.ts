import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { StaticFindingDraft } from "../types";
import { computePriorityScore } from "../scoring";

const execFileAsync = promisify(execFile);

async function getRecentCommitSha(
  repoPath: string
): Promise<string | null> {
  const branches = ["main", "master"];

  for (const branch of branches) {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["-C", repoPath, "log", "-1", "--format=%H", branch],
        { timeout: 5000 }
      );
      const sha = stdout.trim();
      if (sha) {
        return sha;
      }
    } catch {
      continue;
    }
  }

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", repoPath, "log", "-1", "--format=%H"],
      { timeout: 5000 }
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function analyzeRiskyChange(
  repoPath: string
): Promise<StaticFindingDraft[]> {
  const commitSha = await getRecentCommitSha(repoPath);

  if (!commitSha) {
    return [];
  }

  const severity = "HIGH";
  const confidence = 0.75;

  return [
    {
      category: "RISKY_CHANGE",
      severity,
      confidence,
      source: "STATIC",
      title: "Recent commit on default branch (stub heuristic)",
      description:
        "M3 stub: recent commit detected via local git. Review whether changes bypassed merge request workflow.",
      priorityScore: computePriorityScore(severity, "RISKY_CHANGE", confidence),
      priorityReason: "Stub git heuristic on latest main/master commit",
      evidence: [
        {
          refId: "static.risky_change.0",
          type: "commit",
          commitSha: commitSha.slice(0, 7)
        }
      ]
    }
  ];
}
