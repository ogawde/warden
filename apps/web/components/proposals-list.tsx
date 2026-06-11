import { ExternalLinkIcon } from "lucide-react";
import { MotionItem } from "@/components/motion/motion-item";
import { ApproveProposalButton } from "@/components/approve-proposal-button";
import { ProposalSummary } from "@/components/proposal-summary";
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
  PENDING_APPROVAL: "border-amber-300/60 bg-amber-100 text-amber-950",
  APPROVED: "border-warden-sea/40 bg-warden-mint/30 text-warden-dark",
  EXECUTED: "border-warden-sea/50 bg-warden-sea/15 text-warden-dark",
  REJECTED: "border-red-300/60 bg-red-100 text-red-950"
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
      {proposals.map((proposal, index) => {
        const canApprove = proposal.status === "PENDING_APPROVAL";
        const isExecuted = proposal.status === "EXECUTED";

        return (
          <MotionItem key={proposal.id} index={index}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
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
                <div className="text-muted-foreground">
                  <ProposalSummary content={proposal.summary} />
                </div>
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
          </MotionItem>
        );
      })}
    </ul>
  );
}
