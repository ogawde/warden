import { requireSession } from "@/lib/auth/get-session-user";
import { createIssue } from "@/lib/gitlab/create-issue";
import { getGitLabBaseUrl } from "@/lib/gitlab/config";
import { resolveActingUserGitLabAuth } from "@/lib/gitlab/resolve-acting-user-gitlab-auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { assertRepositoryOwnedByUser } from "./assert-repository-ownership";
import { ResourceNotFoundError } from "./resource-not-found-error";

export type ExecuteProposedActionResult = {
  issueCreationId: string;
  webUrl: string;
  gitlabIssueIid: number;
};

export async function executeProposedAction(
  proposedActionId: string
): Promise<ExecuteProposedActionResult> {
  const user = await requireSession();

  const proposedAction = await prisma.proposedAction.findUnique({
    where: { id: proposedActionId },
    include: { approvals: true, issueCreation: true, repository: true }
  });

  if (!proposedAction) {
    throw new ResourceNotFoundError("Proposed action not found");
  }

  assertRepositoryOwnedByUser(proposedAction.repository, user);

  if (proposedAction.status !== "APPROVED") {
    throw new Error("Proposed action must be approved before execution");
  }

  if (proposedAction.approvals.length === 0) {
    throw new Error("Approval record required before execution");
  }

  if (proposedAction.issueCreation) {
    throw new Error("Issue already created for this proposal");
  }

  const template = proposedAction.gitlabIssueTemplate as {
    title: string;
    description: string;
    labels?: string[];
  };

  const idempotencyKey = proposedAction.idempotencyKey ?? randomUUID();
  const auth = await resolveActingUserGitLabAuth();
  const gitlabConfig = {
    auth,
    projectId: proposedAction.repository.gitlabProjectId,
    baseUrl: getGitLabBaseUrl()
  };

  await prisma.proposedAction.update({
    where: { id: proposedAction.id },
    data: {
      status: "EXECUTING",
      idempotencyKey
    }
  });

  const issueCreation = await prisma.issueCreation.create({
    data: {
      proposedActionId: proposedAction.id,
      repositoryId: proposedAction.repositoryId,
      status: "PENDING",
      gitlabProjectId: proposedAction.repository.gitlabProjectId,
      idempotencyKey
    }
  });

  try {
    const gitlabIssue = await createIssue(
      {
        title: template.title,
        description: template.description,
        labels: template.labels ?? ["warden"]
      },
      gitlabConfig
    );

    await prisma.$transaction([
      prisma.issueCreation.update({
        where: { id: issueCreation.id },
        data: {
          status: "SUCCEEDED",
          gitlabIssueIid: gitlabIssue.iid,
          gitlabIssueId: gitlabIssue.id,
          webUrl: gitlabIssue.webUrl,
          executedAt: new Date()
        }
      }),
      prisma.proposedAction.update({
        where: { id: proposedAction.id },
        data: { status: "EXECUTED" }
      }),
      prisma.activityEvent.create({
        data: {
          repositoryId: proposedAction.repositoryId,
          scanId: proposedAction.scanId,
          proposedActionId: proposedAction.id,
          actorType: "SYSTEM",
          verb: "ISSUE_CREATED",
          summary: `Created GitLab issue #${gitlabIssue.iid}`,
          metadata: { webUrl: gitlabIssue.webUrl }
        }
      })
    ]);

    return {
      issueCreationId: issueCreation.id,
      webUrl: gitlabIssue.webUrl,
      gitlabIssueIid: gitlabIssue.iid
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown GitLab error";

    await prisma.$transaction([
      prisma.issueCreation.update({
        where: { id: issueCreation.id },
        data: {
          status: "FAILED",
          errorMessage: message
        }
      }),
      prisma.proposedAction.update({
        where: { id: proposedAction.id },
        data: { status: "FAILED" }
      })
    ]);

    throw error;
  }
}
