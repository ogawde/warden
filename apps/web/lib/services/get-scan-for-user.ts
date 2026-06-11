import { getSessionUser } from "@/lib/auth/get-session-user";
import { prisma } from "@/lib/db";
import { ResourceNotFoundError } from "./resource-not-found-error";

export async function getScanForUser(scanId: string) {
  const user = await getSessionUser();

  if (!user) {
    throw new ResourceNotFoundError("Scan not found");
  }

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      repository: {
        userId: user.id
      }
    },
    include: {
      repository: true,
      findings: {
        orderBy: { priorityScore: "desc" }
      },
      proposedActions: {
        orderBy: { priorityScore: "desc" },
        include: { issueCreation: true }
      }
    }
  });

  if (!scan) {
    throw new ResourceNotFoundError("Scan not found");
  }

  return scan;
}
