import { SearchXIcon } from "lucide-react";
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
  CRITICAL: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  HIGH: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  MEDIUM: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  LOW: "bg-secondary text-secondary-foreground",
  INFO: "bg-muted text-muted-foreground"
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
      {findings.map((finding) => {
        const evidence = finding.evidence[0];

        return (
          <li key={finding.id}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
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
          </li>
        );
      })}
    </ul>
  );
}
