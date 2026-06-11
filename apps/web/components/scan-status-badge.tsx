import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  QUEUED: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  RUNNING: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
};

type ScanStatusBadgeProps = {
  status: string;
};

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(statusStyles[status] ?? "bg-secondary text-secondary-foreground")}
    >
      {status}
    </Badge>
  );
}
