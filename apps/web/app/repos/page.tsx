import { getUserGitLabAccessToken } from "@/lib/auth/get-user-gitlab-token";
import { requireSession } from "@/lib/auth/get-session-user";
import { listAccessibleGitLabProjects } from "@/lib/gitlab/list-projects";
import { redirect } from "next/navigation";

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
    const accessToken = getUserGitLabAccessToken(user);
    projects = await listAccessibleGitLabProjects(accessToken);
  } catch {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Repositories</h1>
        <p className="mt-4">Please sign in with GitLab again.</p>
      </main>
    );
  }

  if (projects.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Repositories</h1>
        <p className="mt-4">No accessible GitLab repositories found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Repositories</h1>
      <p className="mt-2 text-sm text-slate-600">
        Select a GitLab repository to continue.
      </p>

      <ul className="mt-8 space-y-4">
        {projects.map((project) => (
          <li key={project.id} className="border border-slate-200 p-4">
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-slate-600">{project.pathWithNamespace}</p>
            <p className="text-sm text-slate-600">
              Default branch: {project.defaultBranch}
            </p>

            <form
              method="POST"
              action="/api/repos/select"
              className="mt-3"
            >
              <input
                type="hidden"
                name="gitlabProjectId"
                value={project.id}
              />
              <button type="submit">Select</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
