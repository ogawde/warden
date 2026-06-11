import { requireSession } from "@/lib/auth/get-session-user";
import { prisma } from "@/lib/db";
import { assertRepositoryOwnedByUser } from "./assert-repository-ownership";
import { ResourceNotFoundError } from "./resource-not-found-error";

export async function approveProposedAction(proposedActionId: string) {
  const user = await requireSession();

  const proposedAction = await prisma.proposedAction.findUnique({
    where: { id: proposedActionId },
    include: { repository: true }
  });

  if (!proposedAction) {
    throw new ResourceNotFoundError("Proposed action not found");
  }

  assertRepositoryOwnedByUser(proposedAction.repository, user);

  if (proposedAction.status !== "PENDING_APPROVAL") {
    throw new Error("Only pending proposals can be approved");
  }

  await prisma.$transaction([
    prisma.approval.create({
      data: {
        proposedActionId: proposedAction.id,
        userId: user.id,
        decision: "APPROVED"
      }
    }),
    prisma.proposedAction.update({
      where: { id: proposedAction.id },
      data: { status: "APPROVED" }
    }),
    prisma.activityEvent.create({
      data: {
        repositoryId: proposedAction.repositoryId,
        scanId: proposedAction.scanId,
        proposedActionId: proposedAction.id,
        actorType: "USER",
        actorUserId: user.id,
        verb: "PROPOSAL_APPROVED",
        summary: `Approved: ${proposedAction.title}`
      }
    })
  ]);

  return { proposedActionId: proposedAction.id };
}
