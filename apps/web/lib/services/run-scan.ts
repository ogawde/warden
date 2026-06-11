import { getSessionUser } from "@/lib/auth/get-session-user";
import { resolveActiveRepository } from "@/lib/services/resolve-active-repository";
import { enqueueScanJob } from "@/lib/worker/enqueue-scan";
import { prisma } from "@/lib/db";

export type QueueScanResult = {
  scanId: string;
  status: "QUEUED";
};

export async function runScan(): Promise<QueueScanResult> {
  const user = await getSessionUser();
  const repository = await resolveActiveRepository();

  if (!repository) {
    throw new Error(
      "No active repository found. Run db:seed or select a repository."
    );
  }

  const scan = await prisma.scan.create({
    data: {
      repositoryId: repository.id,
      triggeredById: user?.id ?? null,
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
