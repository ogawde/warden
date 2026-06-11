import { SearchXIcon } from "lucide-react";
import { MotionItem } from "@/components/motion/motion-item";
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
  CRITICAL: "border-red-300/60 bg-red-100 text-red-950",
  HIGH: "border-orange-300/60 bg-orange-100 text-orange-950",
  MEDIUM: "border-amber-300/60 bg-amber-100 text-amber-950",
  LOW: "border-border bg-secondary text-secondary-foreground",
  INFO: "border-border bg-muted text-muted-foreground"
};

export function FindingsList({ findings }: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="No findings"
        description="No findings were detected for this scan."
      />
    );
  }

  return (
    <ul className="grid gap-4">
      {findings.map((finding, index) => {
        const evidence = finding.evidence[0];

        return (
          <MotionItem key={finding.id} index={index}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      severityStyles[finding.severity] ?? severityStyles.LOW
                    )}
                  >
                    {finding.severity}
                  </Badge>
                  <Badge variant="outline">{finding.category}</Badge>
                  <Badge variant="ghost" className="text-muted-foreground">
                    Score {finding.priorityScore}
                  </Badge>
                </div>
                <CardTitle className="text-base">{finding.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {finding.description}
                </CardDescription>
              </CardHeader>
              {(evidence?.filePath || evidence?.commitSha) && (
                <CardContent className="space-y-1 border-t bg-muted/30 pt-4 font-mono text-xs text-muted-foreground">
                  {evidence?.filePath ? <p>{evidence.filePath}</p> : null}
                  {evidence?.commitSha ? <p>commit {evidence.commitSha}</p> : null}
                </CardContent>
              )}
            </Card>
          </MotionItem>
        );
      })}
    </ul>
  );
}
