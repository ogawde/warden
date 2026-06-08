# Warden Decisions

## Project Mode

- Hackathon Mode
- Optimize for demo quality over platform completeness
- Single user
- Single repository focus
- Human-in-the-loop workflow

---

## Core User Flow

Connect Repository
→ Run Scan
→ View Findings
→ Review Proposal
→ Approve
→ GitLab Issue Created

---

## Findings Categories

Only these categories are allowed:

- MISSING_TESTS
- MAINTAINABILITY
- TECHNICAL_DEBT
- RISKY_CHANGE
- CI_CD

No additional categories during hackathon.

---

## GitLab Strategy

Read Operations:
- GitLab MCP

Write Operations:
- GitLab REST API

Issue Creation:
- REST only

No MCP write operations.

---

## Agent Strategy

- Single agent
- Stateless
- One repository per scan
- No multi-agent architecture
- No conversational chat
- No cross-repository memory

---

## Authentication

MVP:
- No Better Auth
- Single seeded user

Post Hackathon:
- Better Auth

---

## GitLab Credentials

MVP:
- PAT stored in environment variables

Post Hackathon:
- Google Secret Manager

---

## Deployment

Frontend:
- Vercel

Worker:
- Cloud Run

Database:
- Neon PostgreSQL

---

## Database

Hackathon Schema:

- User
- Repository
- Scan
- Finding
- ProposedAction
- Approval
- IssueCreation
- ActivityEvent

Removed:

- Workspace
- WorkspaceMember
- AgentRun
- AgentAction
- ScanFinding
- FindingEvidence
- RepositoryHealthScore
- MergeRequestCreationRecord
- OutboxEvent

---

## Demo Repository

Controlled GitLab repository with:

- Missing Tests
- Large File (>700 LOC)
- TODO/FIXME/HACK comments
- Broken CI Pipeline
- Direct Commit To Main

---

## Architecture Freeze

Do NOT build:

- Draft Merge Requests
- Better Auth
- Multi-repository support
- Scheduled scans
- Webhook scans
- Security scanning
- Slack integration
- Email notifications
- Health trend analytics
- Team workspaces
- RBAC

Any new idea goes into a roadmap file.
Not into implementation.