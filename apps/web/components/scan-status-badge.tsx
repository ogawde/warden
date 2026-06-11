import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  QUEUED: "border-amber-300/60 bg-amber-100 text-amber-950",
  RUNNING: "border-warden-sea/40 bg-warden-mint/35 text-warden-dark",
  COMPLETED: "border-warden-sea/50 bg-warden-sea/15 text-warden-dark",
  FAILED: "border-red-300/60 bg-red-100 text-red-950"
};

type ScanStatusBadgeProps = {
  status: string;
};

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status] ?? "bg-secondary text-secondary-foreground")}
    >
      {status}
    </Badge>
  );
}
