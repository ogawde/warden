type FindingItem = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  priorityScore: number;
  source: string;
  evidence: Array<{ filePath?: string; commitSha?: string }>;
};

type FindingsListProps = {
  findings: FindingItem[];
};

const severityStyles: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-slate-100 text-slate-700",
  INFO: "bg-slate-100 text-slate-600"
};

export function FindingsList({ findings }: FindingsListProps) {
  if (findings.length === 0) {
    return <p className="text-sm text-slate-600">No findings for this scan.</p>;
  }

  return (
    <ul className="space-y-4">
      {findings.map((finding) => {
        const evidence = finding.evidence[0];

        return (
          <li
            key={finding.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyles[finding.severity] ?? severityStyles.LOW}`}
              >
                {finding.severity}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {finding.category}
              </span>
              <span className="text-xs text-slate-500">
                Score {finding.priorityScore}
              </span>
            </div>
            <h3 className="mt-2 font-medium text-slate-900">{finding.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{finding.description}</p>
            {evidence?.filePath ? (
              <p className="mt-2 font-mono text-xs text-slate-500">
                {evidence.filePath}
              </p>
            ) : null}
            {evidence?.commitSha ? (
              <p className="mt-2 font-mono text-xs text-slate-500">
                commit {evidence.commitSha}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
