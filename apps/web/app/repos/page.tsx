import { getValidGitLabAccessToken } from "@warden/auth";
import { requireSession } from "@/lib/auth/get-session-user";
import { listAccessibleGitLabProjects } from "@/lib/gitlab/list-projects";
import { redirect } from "next/navigation";
import { FolderGit2Icon, GitBranchIcon, KeyRoundIcon } from "lucide-react";
import { MotionItem } from "@/components/motion/motion-item";
import { EmptyState } from "@/components/empty-state";
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

export default async function ReposPage() {
  let user;

  try {
    user = await requireSession();
  } catch {
    redirect("/login");
  }

  let projects;

  try {
    const accessToken = await getValidGitLabAccessToken(user);
    projects = await listAccessibleGitLabProjects(accessToken);
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <PageHeader />
        <div className="mt-8">
          <EmptyState
            icon={KeyRoundIcon}
            title="Session expired"
            description="Please sign in with GitLab again to browse your repositories."
          />
        </div>
      </main>
    );
  }

  if (projects.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <PageHeader />
        <div className="mt-8">
          <EmptyState
            icon={FolderGit2Icon}
            title="No repositories found"
            description="No accessible GitLab repositories were found for your account."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        description={`${projects.length} accessible ${projects.length === 1 ? "repository" : "repositories"} found.`}
      />

      <ul className="mt-8 grid gap-4">
        {projects.map((project, index) => (
          <MotionItem key={project.id} index={index}>
            <Card className="transition-colors hover:border-primary/30 hover:bg-warden-mint/10">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.pathWithNamespace}</CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <GitBranchIcon className="size-3" />
                    {project.defaultBranch}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <form method="POST" action="/api/repos/select">
                  <input type="hidden" name="gitlabProjectId" value={project.id} />
                  <Button type="submit" size="sm" className="shadow-button">
                    Select repository
                  </Button>
                </form>
              </CardContent>
            </Card>
          </MotionItem>
        ))}
      </ul>
    </main>
  );
}

function PageHeader({ description }: { description?: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Repositories</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {description ?? "Select a GitLab repository to continue."}
      </p>
    </div>
  );
}
