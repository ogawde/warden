# Warden

Warden is an AI-powered engineering assistant for GitLab repositories.

It analyzes repositories, identifies technical issues, prioritizes improvements, and helps teams turn recommendations into actionable GitLab issues.

## Live Demo

🌐 https://warden.curr.xyz

---

## Problem

Engineering teams accumulate technical debt every day:

- Missing tests
- Large or hard-to-maintain files
- TODOs that never become tickets
- CI/CD issues
- Risky development patterns

These issues are often known but rarely tracked consistently.

Warden helps teams identify and prioritize them before they become larger problems.

---

## How It Works

```text
Connect GitLab
      ↓
Select Repository
      ↓
Run Scan
      ↓
Review Findings
      ↓
Review Recommendations
      ↓
Approve
      ↓
Create GitLab Issue
```

Warden combines repository analysis, GitLab project context, and AI-powered reasoning to generate actionable engineering recommendations.

Every recommendation remains human-approved before any issue is created.

---

## Features

### Repository Analysis

Warden scans repositories and identifies:

- Missing tests
- Maintainability concerns
- Technical debt
- CI/CD issues
- Risky changes

### AI Recommendations

Instead of generating dozens of suggestions, Warden focuses on the highest-impact improvements and explains why they matter.

### Human-in-the-Loop

Recommendations never execute automatically.

Users review and approve actions before Warden creates GitLab issues.

### GitLab Integration

- GitLab OAuth authentication
- Repository selection
- Issue creation
- Repository activity analysis

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- PostgreSQL
- Prisma

### Infrastructure

- Vercel
- Google Cloud Run
- Neon Postgres

### AI

- Gemini on Google Cloud

---

## Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL / Neon Database
- GitLab OAuth Application
- Google Cloud Project

### Setup

```bash
git clone <repository-url>
cd warden

cp .env.example .env

npm ci

npm run db:generate
npm run db:migrate

npm run dev
npm run dev:worker
```

Web:

```text
http://localhost:3000
```

Worker:

```text
http://localhost:8080
```

---

## Environment Variables

Copy `.env.example` and provide:

```env
DATABASE_URL=
SESSION_SECRET=
WORKER_SECRET=

GITLAB_OAUTH_CLIENT_ID=
GITLAB_OAUTH_CLIENT_SECRET=

TOKEN_ENCRYPTION_KEY=

GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=

WORKER_URL=
NEXT_PUBLIC_APP_URL=
```

---

## Deployment

Warden is deployed using:

- Vercel (Web Application)
- Google Cloud Run (Worker)
- Neon (Database)

Detailed deployment instructions:

- `cloud-run-deploy.md`

---

## Roadmap

- Scheduled repository scans
- Multi-repository support
- Team workspaces
- Repository health trends
- Notifications and integrations
- Advanced recommendation policies

---

## License

MIT