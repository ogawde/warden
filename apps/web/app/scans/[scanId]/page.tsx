import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingsList } from "@/components/findings-list";
import { ProposalsList } from "@/components/proposals-list";
import { ScanProgressTracker } from "@/components/scan-progress-tracker";
import { ScanStatusBadge } from "@/components/scan-status-badge";
import { APP_NAME } from "@warden/contracts";
import { getScanForUser } from "@/lib/services/get-scan-for-user";
import { ResourceNotFoundError } from "@/lib/services/resource-not-found-error";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  params: Promise<{ scanId: string }>;
};

export default async function ScanDetailPage({ params }: ScanPageProps) {
  const { scanId } = await params;

  let scan;

  try {
    scan = await getScanForUser(scanId);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      notFound();
    }

    throw error;
  }

  const findings = scan.findings.map((finding) => ({
    id: finding.id,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    priorityScore: finding.priorityScore,
    source: finding.source,
    evidence: finding.evidence as Array<{
      filePath?: string;
      commitSha?: string;
    }>
  }));

  const contextSnapshot = scan.contextSnapshot as {
    repoPath?: string;
    fileCount?: string;
  } | null;

  const proposals = scan.proposedActions.map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    summary: proposal.summary,
    status: proposal.status,
    priorityScore: proposal.priorityScore,
    findingIds: proposal.findingIds,
    issueUrl: proposal.issueCreation?.webUrl ?? null
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ScanProgressTracker scanId={scanId} initialStatus={scan.status} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/repo" />}>
              Repository
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Scan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME} Scan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {scan.repository.pathWithNamespace}
          </p>
        </div>
        <ScanStatusBadge status={scan.status} />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scan overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {contextSnapshot?.repoPath ? (
            <p>
              Scanned path:{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {contextSnapshot.repoPath}
              </code>
            </p>
          ) : null}
          <p>
            {findings.length} findings · {proposals.length} proposed actions
          </p>
        </CardContent>
      </Card>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">Findings</h2>
          <span className="text-sm text-muted-foreground">{findings.length}</span>
        </div>
        <Separator className="my-4" />
        <FindingsList findings={findings} />
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">Proposed Actions</h2>
          <span className="text-sm text-muted-foreground">{proposals.length}</span>
        </div>
        <Separator className="my-4" />
        <ProposalsList proposals={proposals} />
      </section>
    </main>
  );
}
