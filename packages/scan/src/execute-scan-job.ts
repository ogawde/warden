import {
  buildAnalysisContext,
  GitLabMcpAdapter,
  type GitLabAuth,
  type GitLabMcpContext
} from "@warden/gitlab-mcp";
import { prisma, Prisma } from "@warden/db";
import { checkoutRepository } from "./checkout-repository";
import { deriveMcpFindings } from "./derive-mcp-findings";
import { getScanConfig } from "./config";
import { runAgentReasoning } from "./run-agent-reasoning";
import { mergeStaticAndMcpFindings } from "./merge-findings";
import { resolveScanGitLabAuth } from "./resolve-scan-gitlab-auth";
import { runStaticAnalysis } from "./run-static-analysis";

export type ExecuteScanJobInput = {
  scanId: string;
  repositoryId: string;
};

export type ExecuteScanJobResult = {
  scanId: string;
  findingCount: number;
  proposalCount: number;
  status: "COMPLETED" | "SKIPPED";
};

async function recordMcpToolEvents(
  scanId: string,
  repositoryId: string,
  audit: GitLabMcpContext["audit"]
) {
  await Promise.all(
    audit.map((entry) =>
      prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "AGENT",
          verb: "AGENT_TOOL_CALLED",
          summary: `${entry.tool}: ${entry.summary}`,
          metadata: {
            tool: entry.tool,
            durationMs: entry.durationMs,
            ok: entry.ok,
            error: entry.error ?? null
          }
        }
      })
    )
  );
}

async function collectMcpContext(
  repository: {
    gitlabProjectId: number;
    defaultBranch: string;
  },
  auth?: GitLabAuth
): Promise<GitLabMcpContext> {
  try {
    return await new GitLabMcpAdapter().collectContext({
      gitlabProjectId: repository.gitlabProjectId,
      fallbackDefaultBranch: repository.defaultBranch,
      auth
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitLab MCP context failed";

    return {
      project: null,
      openMergeRequests: [],
      defaultBranchPipeline: null,
      recentCommits: [],
      audit: [
        {
          tool: "gitlab.collect_context",
          durationMs: 0,
          summary: message,
          ok: false,
          error: message
        }
      ],
      degraded: true
    };
  }
}

export async function executeScanJob(
  input: ExecuteScanJobInput
): Promise<ExecuteScanJobResult> {
  const { scanId, repositoryId } = input;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      repository: true,
      triggeredBy: true
    }
  });

  if (!scan || scan.repositoryId !== repositoryId) {
    throw new Error(`Scan ${scanId} not found for repository ${repositoryId}`);
  }

  if (scan.status !== "QUEUED") {
    return {
      scanId,
      findingCount: 0,
      proposalCount: 0,
      status: "SKIPPED"
    };
  }

  const claimed = await prisma.scan.updateMany({
    where: { id: scanId, status: "QUEUED" },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      agentStatus: "STATIC_ANALYSIS"
    }
  });

  if (claimed.count === 0) {
    return {
      scanId,
      findingCount: 0,
      proposalCount: 0,
      status: "SKIPPED"
    };
  }

  const scanConfig = getScanConfig();
  const repository = scan.repository;
  let headCommitSha: string | undefined;
  let checkoutBranch: string | undefined;

  try {
    const auth = await resolveScanGitLabAuth(scan);
    const checkout = await checkoutRepository({
      scan,
      repository,
      auth
    });
    const { localPath, cleanup } = checkout;
    headCommitSha = checkout.headCommitSha;
    checkoutBranch = checkout.checkoutBranch;

    try {
      if (headCommitSha) {
        await prisma.scan.update({
          where: { id: scanId },
          data: { headCommitSha }
        });
      }

      await prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "SYSTEM",
          verb: "SCAN_STARTED",
          summary: "Scan started",
          metadata: {
            pathWithNamespace: repository.pathWithNamespace,
            ...(checkoutBranch ? { branch: checkoutBranch } : {})
          }
        }
      });

      const staticAnalysis = await runStaticAnalysis(localPath);

    await prisma.scan.update({
      where: { id: scanId },
      data: { agentStatus: "MCP_CONTEXT_GATHER" }
    });

    const mcpContext = await collectMcpContext(repository, auth);
    await recordMcpToolEvents(scanId, repositoryId, mcpContext.audit);

    const gitlabDefaultBranch =
      mcpContext.project?.defaultBranch ?? repository.defaultBranch;

    if (
      mcpContext.project?.defaultBranch &&
      mcpContext.project.defaultBranch !== repository.defaultBranch
    ) {
      await prisma.repository.update({
        where: { id: repositoryId },
        data: {
          defaultBranch: mcpContext.project.defaultBranch,
          pathWithNamespace: mcpContext.project.pathWithNamespace,
          webUrl: mcpContext.project.webUrl,
          name: mcpContext.project.name
        }
      });
    }

    const mcpFindings = deriveMcpFindings(mcpContext, gitlabDefaultBranch);
    const findings = mergeStaticAndMcpFindings(
      staticAnalysis.findings,
      mcpFindings,
      scanConfig.maxFindings
    );

    const analysisContext = buildAnalysisContext({
      repository: {
        gitlabProjectId: repository.gitlabProjectId,
        pathWithNamespace: repository.pathWithNamespace,
        defaultBranch: gitlabDefaultBranch,
        webUrl: mcpContext.project?.webUrl ?? repository.webUrl
      },
      staticFindings: staticAnalysis.findings,
      mcpContext
    });

    const findingRecords = await Promise.all(
      findings.map((finding) =>
        prisma.finding.create({
          data: {
            scanId,
            repositoryId,
            category: finding.category,
            severity: finding.severity,
            confidence: new Prisma.Decimal(finding.confidence),
            source: finding.source,
            title: finding.title,
            description: finding.description,
            priorityScore: finding.priorityScore,
            priorityReason: finding.priorityReason,
            evidence: finding.evidence
          }
        })
      )
    );

    await prisma.scan.update({
      where: { id: scanId },
      data: { agentStatus: "AGENT_REASONING" }
    });

    await prisma.activityEvent.create({
      data: {
        repositoryId,
        scanId,
        actorType: "AGENT",
        verb: "AGENT_REASONING_STARTED",
        summary: "Gemini agent reasoning started"
      }
    });

    const agentResult = await runAgentReasoning({
      scanId,
      analysisContext,
      findings,
      findingRecords: findingRecords.map((record, index) => ({
        ...findings[index],
        id: record.id
      }))
    });

    if (agentResult.agentDegraded) {
      await prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "AGENT",
          verb: "AGENT_REASONING_FAILED",
          summary:
            agentResult.agentReasoning.error ??
            "Agent reasoning unavailable — using rule-based proposals",
          metadata: {
            source: agentResult.agentReasoning.source
          }
        }
      });
    } else {
      await prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "AGENT",
          verb: "AGENT_REASONING_COMPLETED",
          summary: agentResult.agentReasoning.summary ?? "Agent reasoning completed",
          metadata: {
            transport: agentResult.agentReasoning.transport,
            proposalCount: agentResult.proposals.length
          }
        }
      });
    }

    const proposalDrafts = agentResult.proposals;

    await Promise.all(
      proposalDrafts.map((proposal) =>
        prisma.proposedAction.create({
          data: {
            scanId,
            repositoryId,
            status: "PENDING_APPROVAL",
            title: proposal.title,
            summary: proposal.summary,
            priorityScore: proposal.priorityScore,
            findingIds: proposal.findingIds,
            gitlabIssueTemplate: {
              title: proposal.title,
              description: proposal.summary,
              labels: proposal.labels
            }
          }
        })
      )
    );

    const mcpAudit = [...staticAnalysis.audit, ...mcpContext.audit];

    await prisma.$transaction([
      prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          agentStatus: "COMPLETED",
          agentDegraded: mcpContext.degraded || agentResult.agentDegraded,
          mcpAudit,
          contextSnapshot: {
            ...analysisContext,
            repoPath: localPath,
            pathWithNamespace: repository.pathWithNamespace,
            gitlabProjectId: repository.gitlabProjectId,
            headCommitSha: headCommitSha ?? null,
            checkoutBranch: checkoutBranch ?? null,
            agentReasoning: agentResult.agentReasoning
          }
        }
      }),
      prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "SYSTEM",
          verb: "SCAN_COMPLETED",
          summary: `Scan completed with ${findingRecords.length} findings`,
          metadata: {
            pathWithNamespace: repository.pathWithNamespace,
            ...(headCommitSha ? { headCommitSha } : {})
          }
        }
      }),
      prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "SYSTEM",
          verb: "PROPOSAL_CREATED",
          summary: `Created ${proposalDrafts.length} proposed actions`
        }
      })
    ]);

      return {
        scanId,
        findingCount: findingRecords.length,
        proposalCount: proposalDrafts.length,
        status: "COMPLETED"
      };
    } finally {
      try {
        await cleanup();
      } catch (cleanupError) {
        console.warn(
          "Checkout cleanup failed:",
          cleanupError instanceof Error
            ? cleanupError.message
            : cleanupError
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";

    await prisma.$transaction([
      prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "FAILED",
          agentError: message,
          completedAt: new Date()
        }
      }),
      prisma.activityEvent.create({
        data: {
          repositoryId,
          scanId,
          actorType: "SYSTEM",
          verb: "SCAN_FAILED",
          summary: message,
          metadata: {
            pathWithNamespace: repository.pathWithNamespace,
            ...(headCommitSha ? { headCommitSha } : {})
          }
        }
      })
    ]);

    throw error;
  }
}
