import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { executeProposedAction } from "@/lib/services/execute-proposed-action";

export type CreateTestIssueResult = {
  issueCreationId: string;
  webUrl: string;
  gitlabIssueIid: number;
};

export async function createTestIssue(): Promise<CreateTestIssueResult> {
  const repository = await prisma.repository.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (!repository) {
    throw new Error("No repository found. Run db:seed.");
  }

  const issueTitle = `Warden test issue ${new Date().toISOString()}`;
  const issueDescription = "Created by Warden.";

  const scan = await prisma.scan.create({
    data: {
      repositoryId: repository.id,
      status: "COMPLETED",
      trigger: "MANUAL",
      completedAt: new Date()
    }
  });

  const proposedAction = await prisma.proposedAction.create({
    data: {
      scanId: scan.id,
      repositoryId: repository.id,
      status: "APPROVED",
      title: issueTitle,
      summary: issueDescription,
      findingIds: [],
      gitlabIssueTemplate: {
        title: issueTitle,
        description: issueDescription,
        labels: ["warden", "test"]
      },
      idempotencyKey: randomUUID()
    }
  });

  await prisma.approval.create({
    data: {
      proposedActionId: proposedAction.id,
      userId: (
        await prisma.user.findFirstOrThrow({
          where: { email: "demo@warden.local" }
        })
      ).id,
      decision: "APPROVED"
    }
  });

  return executeProposedAction(proposedAction.id);
}
