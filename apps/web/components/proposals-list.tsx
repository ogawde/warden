import { ApproveProposalButton } from "@/components/approve-proposal-button";

type ProposalItem = {
  id: string;
  title: string;
  summary: string;
  status: string;
  priorityScore: number;
  findingIds: string[];
  issueUrl?: string | null;
};

type ProposalsListProps = {
  proposals: ProposalItem[];
};

export function ProposalsList({ proposals }: ProposalsListProps) {
  if (proposals.length === 0) {
    return <p className="text-sm text-slate-600">No proposed actions.</p>;
  }

  return (
    <ul className="space-y-4">
      {proposals.map((proposal) => {
        const canApprove = proposal.status === "PENDING_APPROVAL";
        const isExecuted = proposal.status === "EXECUTED";

        return (
          <li
            key={proposal.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {proposal.status}
              </span>
              <span className="text-xs text-slate-500">
                Score {proposal.priorityScore} · {proposal.findingIds.length}{" "}
                findings
              </span>
            </div>
            <h3 className="mt-2 font-medium text-slate-900">{proposal.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {proposal.summary}
            </p>
            {canApprove ? (
              <div className="mt-4">
                <ApproveProposalButton proposalId={proposal.id} />
              </div>
            ) : null}
            {isExecuted && proposal.issueUrl ? (
              <p className="mt-3 text-sm text-green-700">
                Issue created.{" "}
                <a
                  href={proposal.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Open in GitLab
                </a>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
