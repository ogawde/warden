import type { ReactNode } from "react";
import Link from "next/link";
import { RunScanButton } from "@/components/run-scan-button";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { resolveActiveRepository } from "@/lib/services/resolve-active-repository";
import { APP_NAME } from "@warden/contracts";
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

        <div className="mt-2">
          <RunScanButton />
        </div>
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
