import { ExternalLinkIcon } from "lucide-react";
import { ApproveProposalButton } from "@/components/approve-proposal-button";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodoIcon } from "lucide-react";

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

const statusStyles: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  APPROVED: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  EXECUTED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
};

export function ProposalsList({ proposals }: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={ListTodoIcon}
        title="No proposed actions"
        description="No action proposals were generated for this scan."
      />
    );
  }

  return (
    <ul className="grid gap-4">
      {proposals.map((proposal) => {
        const canApprove = proposal.status === "PENDING_APPROVAL";
        const isExecuted = proposal.status === "EXECUTED";

        return (
          <li key={proposal.id}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      statusStyles[proposal.status] ??
                        "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {proposal.status}
                  </Badge>
                  <Badge variant="ghost" className="text-muted-foreground">
                    Score {proposal.priorityScore} · {proposal.findingIds.length}{" "}
                    findings
                  </Badge>
                </div>
                <CardTitle className="text-base">{proposal.title}</CardTitle>
                <CardDescription className="whitespace-pre-wrap">
                  {proposal.summary}
                </CardDescription>
              </CardHeader>

              {(canApprove || (isExecuted && proposal.issueUrl)) && (
                <CardContent className="border-t bg-muted/20 pt-4">
                  {canApprove ? (
                    <ApproveProposalButton proposalId={proposal.id} />
                  ) : null}
                  {isExecuted && proposal.issueUrl ? (
                    <a
                      href={proposal.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4"
                    >
                      Open issue in GitLab
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  ) : null}
                </CardContent>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
