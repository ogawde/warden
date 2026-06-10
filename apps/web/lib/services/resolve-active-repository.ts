import { getSessionUser } from "@/lib/auth/get-session-user";
import { getGitLabConfig } from "@/lib/gitlab/config";
import type { Repository } from "@warden/db";
import { prisma } from "@/lib/db";

export async function resolveActiveRepository(): Promise<Repository | null> {
  const user = await getSessionUser();

  if (!user) {
    const gitlabConfig = getGitLabConfig();

    return prisma.repository.findFirst({
      where: {
        gitlabProjectId: gitlabConfig.projectId,
        userId: null
      }
    });
  }

  return prisma.repository.findFirst({
    where: {
      userId: user.id,
      selectedAt: {
        not: null
      }
    },
    orderBy: {
      selectedAt: "desc"
    }
  });
}
