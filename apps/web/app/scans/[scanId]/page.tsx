import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingsList } from "@/components/findings-list";
import { ProposalsList } from "@/components/proposals-list";
import { APP_NAME } from "@warden/contracts";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  params: Promise<{ scanId: string }>;
};

export default async function ScanDetailPage({ params }: ScanPageProps) {
  const { scanId } = await params;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      repository: true,
      findings: {
        orderBy: { priorityScore: "desc" }
      },
      proposedActions: {
        orderBy: { priorityScore: "desc" },
        include: { issueCreation: true }
      }
    }
  });

  if (!scan) {
    notFound();
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
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link href="/repo" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to repository
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
        {APP_NAME} Scan
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {scan.repository.pathWithNamespace} · {scan.status}
        {scan.status === "QUEUED" || scan.status === "RUNNING" ? (
          <> · refresh when complete</>
        ) : null}
        {contextSnapshot?.repoPath ? (
          <> · scanned {contextSnapshot.repoPath}</>
        ) : null}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-900">
          Findings ({findings.length})
        </h2>
        <div className="mt-4">
          <FindingsList findings={findings} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-slate-900">
          Proposed Actions ({proposals.length})
        </h2>
        <div className="mt-4">
          <ProposalsList proposals={proposals} />
        </div>
      </section>
    </main>
  );
}
