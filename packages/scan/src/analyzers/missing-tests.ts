import path from "node:path";
import type { ScanRepositorySnapshot } from "../types";
import { getSourceFiles } from "../repository-reader";
import { computePriorityScore } from "../scoring";
import type { StaticFindingDraft } from "../types";

function expectedTestPaths(sourcePath: string): string[] {
  const directory = path.dirname(sourcePath);
  const extension = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, extension);

  return [
    path.join(directory, `${baseName}.test${extension}`),
    path.join(directory, `${baseName}.spec${extension}`),
    path.join(directory, "__tests__", `${baseName}.test${extension}`)
  ].map((filePath) => filePath.replace(/\\/g, "/"));
}

function hasMatchingTest(
  sourcePath: string,
  filePathSet: Set<string>
): boolean {
  return expectedTestPaths(sourcePath).some((candidate) =>
    filePathSet.has(candidate)
  );
}

export function analyzeMissingTests(
  snapshot: ScanRepositorySnapshot
): StaticFindingDraft[] {
  const findings: StaticFindingDraft[] = [];
  let refIndex = 0;

  for (const file of getSourceFiles(snapshot)) {
    if (hasMatchingTest(file.relativePath, snapshot.filePathSet)) {
      continue;
    }

    const severity = file.relativePath.includes("src/") ? "MEDIUM" : "LOW";
    const confidence = 0.92;

    findings.push({
      category: "MISSING_TESTS",
      severity,
      confidence,
      source: "STATIC",
      title: `No test file for ${file.relativePath}`,
      description: `Source file \`${file.relativePath}\` has no matching unit test file (.test, .spec, or __tests__).`,
      priorityScore: computePriorityScore(severity, "MISSING_TESTS", confidence),
      priorityReason: "Static rule: missing companion test file",
      evidence: [
        {
          refId: `static.missing_test.${refIndex}`,
          type: "file",
          filePath: file.relativePath
        }
      ]
    });

    refIndex += 1;
  }

  return findings;
}
