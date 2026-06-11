# Warden

Autonomous engineering oversight for GitLab repositories — static analysis, GitLab context, agent reasoning, and human-approved issue creation.

**Production:** [warden-web-silk.vercel.app](https://warden-web-silk.vercel.app/)

## Architecture

| Component | Host | Role |
|-----------|------|------|
| Web (`apps/web`) | Vercel | OAuth login, repo selection, scan enqueue, issue approval |
| Worker (`services/worker`) | Cloud Run | Checkout, static analysis, MCP context, agent reasoning |
| Database | Neon Postgres | Users, repos, scans, findings, proposals |

## Prerequisites

- Node.js 22+
- Neon Postgres database
- GitLab OAuth application ([gitlab.com → User Settings → Applications](https://gitlab.com/-/user_settings/applications))
- Google Cloud project (Vertex AI for agent reasoning)
- `gcloud` CLI (worker deploy)

## Local development

```bash
cp .env.example .env
# Fill in DATABASE_URL, OAuth credentials, TOKEN_ENCRYPTION_KEY, etc.

npm ci
npm run db:generate
npm run db:migrate
npm run db:seed          # optional demo data

npm run dev              # web on :3000
npm run dev:worker       # worker on :8080
```

Generate secrets:

```bash
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 32   # TOKEN_ENCRYPTION_KEY
openssl rand -base64 32   # WORKER_SECRET
```

## Production environment variables

### Web (Vercel) — required

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon Postgres connection string |
| `SESSION_SECRET` | iron-session cookie encryption (≥32 chars) |
| `NEXT_PUBLIC_APP_URL` | Public app URL, e.g. `https://your-app.vercel.app` |
| `GITLAB_OAUTH_CLIENT_ID` | GitLab OAuth application ID |
| `GITLAB_OAUTH_CLIENT_SECRET` | GitLab OAuth application secret |
| `GITLAB_OAUTH_SCOPES` | e.g. `read_user read_api api` |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for OAuth tokens at rest (base64, 32 bytes) |
| `WORKER_URL` | Cloud Run service URL (no trailing slash) |
| `WORKER_SECRET` | Bearer token for worker `/run-scan` |

> **`TOKEN_ENCRYPTION_KEY` must match the worker value exactly.**  
> **`WORKER_SECRET` must match the worker value exactly.**

### Worker (Cloud Run) — required

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Same Neon database as Vercel |
| `WORKER_SECRET` | Same value as Vercel `WORKER_SECRET` |
| `TOKEN_ENCRYPTION_KEY` | Same value as Vercel `TOKEN_ENCRYPTION_KEY` |
| `GITLAB_OAUTH_CLIENT_ID` | Same GitLab OAuth app as Vercel |
| `GITLAB_OAUTH_CLIENT_SECRET` | Same GitLab OAuth app as Vercel |
| `GITLAB_PAT` | GitLab personal access token (MCP REST fallback) |
| `GITLAB_PROJECT_ID` | Numeric GitLab project ID |

Also recommended on worker: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `VERTEX_GEMINI_MODEL`.

See [cloud-run-deploy.md](./cloud-run-deploy.md) for full GCP deploy steps.

## Production deployment sequence

Run in order before serving traffic:

### 1. Database migrations

```bash
export DATABASE_URL="postgresql://..."
npm run db:migrate:deploy
```

Applies committed Prisma migrations to Neon. Does not modify the schema — only runs existing migration files.

### 2. Deploy worker (Cloud Run)

```bash
gcloud builds submit . \
  --tag="${IMAGE}" \
  --file="services/worker/Dockerfile"

gcloud run deploy warden-worker \
  --image="${IMAGE}" \
  --set-secrets="DATABASE_URL=...,WORKER_SECRET=...,TOKEN_ENCRYPTION_KEY=...,GITLAB_OAUTH_CLIENT_SECRET=...,GITLAB_PAT=..." \
  --set-env-vars="GITLAB_OAUTH_CLIENT_ID=...,GITLAB_PROJECT_ID=..."
```

Full commands, IAM, and Secret Manager setup: [cloud-run-deploy.md](./cloud-run-deploy.md).

### 3. Deploy web (Vercel)

Set all required Vercel env vars (see table above). Set `WORKER_URL` to the Cloud Run service URL after step 2.

### 4. Verify

1. Sign in with GitLab at `/login`
2. Select a repository at `/repos`
3. Run a scan from `/repo`
4. Approve a proposal to create a GitLab issue

## Build

```bash
npm ci
npm run build
```

`package-lock.json` is committed — `npm ci` works from a clean clone. The worker Docker image runs `npm ci` from the lockfile only (no local artifacts required).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:worker` | Start scan worker locally |
| `npm run build` | Production build (web) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data |
