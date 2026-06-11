import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLinkIcon, FlaskConicalIcon, ScanSearchIcon } from "lucide-react";
import { RunScanButton } from "@/components/run-scan-button";
import { CreateTestIssueButton } from "@/components/create-test-issue-button";
import { ScanStatusBadge } from "@/components/scan-status-badge";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { resolveActiveRepository } from "@/lib/services/resolve-active-repository";
import { APP_NAME } from "@warden/contracts";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function RepositoryDashboardPage() {
  const user = await getSessionUser();
  const repository = await resolveActiveRepository();

  if (!repository) {
    if (user) {
      redirect("/repos");
    }
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <PageHeading subtitle="Repository dashboard" />
        <Alert className="mt-8">
          <AlertTitle>No repository configured</AlertTitle>
          <AlertDescription>
            No repository in database. Run{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
              npm run db:seed
            </code>{" "}
            to get started.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const latestScan = await prisma.scan.findFirst({
    where: { repositoryId: repository.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <PageHeading
        subtitle={repository.pathWithNamespace}
        action={
          <Button variant="outline" size="sm" render={<Link href="/repos" />}>
            Switch repository
          </Button>
        }
      />

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Repository details</CardTitle>
            <CardDescription>
              Active repository configuration and monitoring status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailItem label="Default branch" value={repository.defaultBranch} />
              <DetailItem
                label="GitLab project ID"
                value={String(repository.gitlabProjectId)}
              />
              <DetailItem
                label="Monitoring"
                value={
                  <Badge
                    variant={repository.monitoringEnabled ? "default" : "secondary"}
                  >
                    {repository.monitoringEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ScanSearchIcon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Scan</CardTitle>
                <CardDescription>
                  Queues a scan on the worker (run{" "}
                  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                    npm run dev:worker
                  </code>
                  ). Analyzes your local clone via{" "}
                  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                    REPO_LOCAL_PATH
                  </code>
                  .
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RunScanButton />

            {latestScan ? (
              <>
                <Separator />
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Latest scan</span>
                  <ScanStatusBadge status={latestScan.status} />
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    render={<Link href={`/scans/${latestScan.id}`} />}
                  >
                    {latestScan.createdAt.toLocaleString()}
                    <ExternalLinkIcon data-icon="inline-end" className="size-3" />
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FlaskConicalIcon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>M1 dev shortcut</CardTitle>
                <CardDescription>
                  Create a test GitLab issue to verify the integration pipeline.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CreateTestIssueButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PageHeading({
  subtitle,
  action
}: {
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
