-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanTrigger" AS ENUM ('MANUAL');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('MISSING_TESTS', 'MAINTAINABILITY', 'TECHNICAL_DEBT', 'RISKY_CHANGE', 'CI_CD');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingSource" AS ENUM ('STATIC', 'AGENT', 'HYBRID');

-- CreateEnum
CREATE TYPE "ProposedActionType" AS ENUM ('CREATE_ISSUE');

-- CreateEnum
CREATE TYPE "ProposedActionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTING', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityActorType" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ActivityVerb" AS ENUM ('SCAN_STARTED', 'SCAN_COMPLETED', 'SCAN_FAILED', 'PROPOSAL_CREATED', 'PROPOSAL_APPROVED', 'PROPOSAL_REJECTED', 'ISSUE_CREATED', 'AGENT_TOOL_CALLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "gitlabProjectId" INTEGER NOT NULL,
    "pathWithNamespace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "webUrl" TEXT,
    "gitlabInstance" TEXT NOT NULL DEFAULT 'https://gitlab.com',
    "tokenHint" TEXT,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "trigger" "ScanTrigger" NOT NULL DEFAULT 'MANUAL',
    "triggeredById" TEXT,
    "correlationId" TEXT NOT NULL,
    "baseCommitSha" TEXT,
    "headCommitSha" TEXT,
    "agentStatus" TEXT,
    "agentDegraded" BOOLEAN NOT NULL DEFAULT false,
    "agentError" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT 'warden-mvp-1.0',
    "mcpAudit" JSONB NOT NULL DEFAULT '[]',
    "contextSnapshot" JSONB,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL,
    "source" "FindingSource" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "priorityReason" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedAction" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "type" "ProposedActionType" NOT NULL DEFAULT 'CREATE_ISSUE',
    "status" "ProposedActionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "findingIds" TEXT[],
    "gitlabIssueTemplate" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "proposedActionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueCreation" (
    "id" TEXT NOT NULL,
    "proposedActionId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "gitlabProjectId" INTEGER NOT NULL,
    "gitlabIssueIid" INTEGER,
    "gitlabIssueId" INTEGER,
    "webUrl" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueCreation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT,
    "scanId" TEXT,
    "proposedActionId" TEXT,
    "actorType" "ActivityActorType" NOT NULL,
    "actorUserId" TEXT,
    "verb" "ActivityVerb" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Repository_createdAt_idx" ON "Repository"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_gitlabProjectId_key" ON "Repository"("gitlabProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Scan_correlationId_key" ON "Scan"("correlationId");

-- CreateIndex
CREATE INDEX "Scan_repositoryId_createdAt_idx" ON "Scan"("repositoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Finding_scanId_priorityScore_idx" ON "Finding"("scanId", "priorityScore" DESC);

-- CreateIndex
CREATE INDEX "Finding_scanId_category_idx" ON "Finding"("scanId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProposedAction_idempotencyKey_key" ON "ProposedAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ProposedAction_scanId_idx" ON "ProposedAction"("scanId");

-- CreateIndex
CREATE INDEX "ProposedAction_repositoryId_status_idx" ON "ProposedAction"("repositoryId", "status");

-- CreateIndex
CREATE INDEX "Approval_proposedActionId_createdAt_idx" ON "Approval"("proposedActionId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "IssueCreation_proposedActionId_key" ON "IssueCreation"("proposedActionId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueCreation_idempotencyKey_key" ON "IssueCreation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IssueCreation_repositoryId_createdAt_idx" ON "IssueCreation"("repositoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityEvent_repositoryId_createdAt_idx" ON "ActivityEvent"("repositoryId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedAction" ADD CONSTRAINT "ProposedAction_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_proposedActionId_fkey" FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueCreation" ADD CONSTRAINT "IssueCreation_proposedActionId_fkey" FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueCreation" ADD CONSTRAINT "IssueCreation_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_proposedActionId_fkey" FOREIGN KEY ("proposedActionId") REFERENCES "ProposedAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
