import type { GitLabProject } from "@/lib/gitlab/list-projects";
import type { Repository } from "@warden/db";
import { prisma } from "@/lib/db";

const GITLAB_INSTANCE = "https://gitlab.com";

export async function selectUserRepository(
  userId: string,
  project: GitLabProject
): Promise<Repository> {
  const now = new Date();

  return prisma.repository.upsert({
    where: {
      userId_gitlabProjectId: {
        userId,
        gitlabProjectId: project.id
      }
    },
    create: {
      userId,
      gitlabProjectId: project.id,
      pathWithNamespace: project.pathWithNamespace,
      name: project.name,
      defaultBranch: project.defaultBranch,
      webUrl: project.webUrl,
      gitlabInstance: GITLAB_INSTANCE,
      selectedAt: now
    },
    update: {
      pathWithNamespace: project.pathWithNamespace,
      name: project.name,
      defaultBranch: project.defaultBranch,
      webUrl: project.webUrl,
      gitlabInstance: GITLAB_INSTANCE,
      selectedAt: now
    }
  });
}
