import Link from "next/link";
import { RunScanButton } from "@/components/run-scan-button";
import { CreateTestIssueButton } from "@/components/create-test-issue-button";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { resolveActiveRepository } from "@/lib/services/resolve-active-repository";
import { APP_NAME } from "@warden/contracts";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RepositoryDashboardPage() {
  const user = await getSessionUser();
  const repository = await resolveActiveRepository();

  if (!repository) {
    if (user) {
      redirect("/repos");
    }
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {APP_NAME}
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          No repository in database. Run{" "}
          <code className="rounded bg-slate-100 px-1">npm run db:seed</code>.
        </p>
      </main>
    );
  }

  const latestScan = await prisma.scan.findFirst({
    where: { repositoryId: repository.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {APP_NAME}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {repository.pathWithNamespace}
      </p>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-3 text-sm text-slate-700">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Default branch</dt>
            <dd>{repository.defaultBranch}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">GitLab project ID</dt>
            <dd>{repository.gitlabProjectId}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Monitoring</dt>
            <dd>{repository.monitoringEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium text-slate-900">Scan</h2>
        <p className="mt-2 text-sm text-slate-600">
          Queues a scan on the worker (run{" "}
          <code className="rounded bg-slate-100 px-1">npm run dev:worker</code>
          ). Analyzes your local clone via{" "}
          <code className="rounded bg-slate-100 px-1">REPO_LOCAL_PATH</code>.
        </p>
        <div className="mt-4">
          <RunScanButton />
        </div>
        {latestScan ? (
          <p className="mt-3 text-sm text-slate-600">
            Latest scan:{" "}
            <Link
              href={`/scans/${latestScan.id}`}
              className="font-medium text-slate-900 underline"
            >
              {latestScan.status} · {latestScan.createdAt.toLocaleString()}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-medium text-slate-700">M1 dev shortcut</h2>
        <div className="mt-3">
          <CreateTestIssueButton />
        </div>
      </section>
    </main>
  );
}
