import { analyzeCiCdStub } from "./analyzers/ci-cd";
import { analyzeMaintainability } from "./analyzers/maintainability";
import { analyzeMissingTests } from "./analyzers/missing-tests";
import { analyzeRiskyChange } from "./analyzers/risky-change";
import { analyzeTechnicalDebt } from "./analyzers/technical-debt";
import { getScanConfig } from "./config";
import { readRepositorySnapshot } from "./repository-reader";
import type { StaticAnalysisResult } from "./types";

export async function runStaticAnalysis(
  repoLocalPath: string
): Promise<StaticAnalysisResult> {
  const config = getScanConfig();
  const snapshot = await readRepositorySnapshot(repoLocalPath);

  const findings = [
    ...analyzeMissingTests(snapshot),
    ...analyzeMaintainability(snapshot, config.maxFileLines),
    ...analyzeTechnicalDebt(snapshot),
    ...(await analyzeRiskyChange(repoLocalPath)),
    ...analyzeCiCdStub()
  ];

  const sorted = findings.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    findings: sorted,
    audit: [
      {
        tool: "static.scan_file_tree",
        summary: `Scanned ${snapshot.files.length} files at ${repoLocalPath}`
      },
      {
        tool: "static.detect_missing_tests",
        summary: `Missing tests: ${sorted.filter((f) => f.category === "MISSING_TESTS").length}`
      },
      {
        tool: "static.detect_large_files",
        summary: `Maintainability: ${sorted.filter((f) => f.category === "MAINTAINABILITY").length}`
      },
      {
        tool: "static.count_todo_markers",
        summary: `Technical debt: ${sorted.filter((f) => f.category === "TECHNICAL_DEBT").length}`
      }
    ]
  };
}
