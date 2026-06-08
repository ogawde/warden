import { enqueueScanJob } from "@/lib/worker/enqueue-scan";
import { getGitLabConfig } from "@/lib/gitlab/config";
import { prisma } from "@/lib/db";

export type QueueScanResult = {
  scanId: string;
  status: "QUEUED";
};

export async function runScan(): Promise<QueueScanResult> {
  const gitlabConfig = getGitLabConfig();

  const repository = await prisma.repository.findFirst({
    where: { gitlabProjectId: gitlabConfig.projectId }
  });

  if (!repository) {
    throw new Error(
      `No repository found for GITLAB_PROJECT_ID=${gitlabConfig.projectId}. Run db:seed.`
    );
  }

  const scan = await prisma.scan.create({
    data: {
      repositoryId: repository.id,
      status: "QUEUED",
      trigger: "MANUAL",
      agentStatus: "QUEUED",
      queuedAt: new Date()
    }
  });

  try {
    await enqueueScanJob(scan.id, repository.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue scan";

    await prisma.$transaction([
      prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: "FAILED",
          agentError: message,
          completedAt: new Date()
        }
      }),
      prisma.activityEvent.create({
        data: {
          repositoryId: repository.id,
          scanId: scan.id,
          actorType: "SYSTEM",
          verb: "SCAN_FAILED",
          summary: message
        }
      })
    ]);

    throw error;
  }

  return {
    scanId: scan.id,
    status: "QUEUED"
  };
}
