# Cloud Run deployment — Warden worker

Deploy the scan worker (`services/worker`) to Google Cloud Run. The Next.js app on Vercel calls this service via `WORKER_URL` + `WORKER_SECRET`.

**GCP project (example):** `warden-hackathon`  
**Region:** `us-central1`  
**Runtime service account:** `warden-worker@warden-hackathon.iam.gserviceaccount.com`

---

## Production deployment sequence

Run these steps **in order** before serving production traffic.

### Step 1 — Database migrations

Apply committed Prisma migrations to Neon (does not modify schema files):

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST/warden?sslmode=require"
npm ci
npm run db:migrate:deploy
```

### Step 2 — Build and deploy worker

See [§7 Build and deploy](#7-build-and-deploy-exact-commands).

### Step 3 — Configure Vercel

Set all required web env vars (see [§2a Vercel env](#2a-web-vercel--required-environment-variables)). Use the Cloud Run URL from step 2 as `WORKER_URL`.

### Step 4 — Verify end-to-end

Sign in → select repo → run scan → approve proposal → GitLab issue created.

---

## 1. Dockerfile production readiness

### Verified in `services/worker/Dockerfile`

| Check | Status |
|-------|--------|
| Multi-stage build (deps + runner) | OK |
| `git` + `ca-certificates` installed (Debian slim) | OK — required for OAuth `git clone` |
| `NODE_ENV=production` in runner | OK |
| Workspace `npm ci` from committed `package-lock.json` | OK |
| Prisma client generation (`prisma generate`) | OK |
| Demo fixture (`demo/debt-lab`) bundled | OK — fallback for non-OAuth scans |
| `REPO_LOCAL_PATH=/app/demo/debt-lab` in image | OK |
| Listens on `PORT` (default 8080) | OK |
| `/health` endpoint | OK |
| Startup validation: `DATABASE_URL`, `WORKER_SECRET` in production | OK |
| `.dockerignore` excludes local artifacts | OK |

### Scan behavior

- **OAuth scans** (logged-in users): shallow `git clone` of the selected repository to `/tmp/warden/checkouts/<scanId>`.
- **Demo scans** (`triggeredById` null): static analysis on bundled `demo/debt-lab`.

### Known limitations (acceptable for MVP)

- Runtime uses `tsx` (TypeScript direct execution).
- Scan runs synchronously in the worker HTTP handler (Vercel awaits the full response).

---

## 2. Required environment variables

### 2a. Web (Vercel) — required

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | **Yes** | Neon Postgres connection string |
| `SESSION_SECRET` | **Yes** | iron-session cookie encryption (≥32 chars) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public site URL, e.g. `https://your-app.vercel.app` |
| `GITLAB_OAUTH_CLIENT_ID` | **Yes** | GitLab OAuth application ID |
| `GITLAB_OAUTH_CLIENT_SECRET` | **Yes** | GitLab OAuth application secret |
| `GITLAB_OAUTH_SCOPES` | **Yes** | e.g. `read_user read_api api` |
| `TOKEN_ENCRYPTION_KEY` | **Yes** | AES-256-GCM key, base64-encoded 32 bytes |
| `WORKER_URL` | **Yes** | Cloud Run service URL (no trailing slash) |
| `WORKER_SECRET` | **Yes** | Bearer token for `/run-scan` |

**Shared secrets — must match exactly between web and worker:**

| Variable | Web | Worker |
|----------|-----|--------|
| `TOKEN_ENCRYPTION_KEY` | Encrypts OAuth tokens at login | Decrypts tokens during OAuth scans |
| `WORKER_SECRET` | Sent as `Authorization: Bearer` | Validates `/run-scan` requests |

Web fails fast at startup in production if `DATABASE_URL` or `WORKER_SECRET` is missing (`apps/web/instrumentation.ts`).

### 2b. Worker (Cloud Run) — required

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | **Yes** | Same Neon database as Vercel |
| `WORKER_SECRET` | **Yes** | Same value as Vercel `WORKER_SECRET` |
| `TOKEN_ENCRYPTION_KEY` | **Yes** | Same value as Vercel `TOKEN_ENCRYPTION_KEY` |
| `GITLAB_OAUTH_CLIENT_ID` | **Yes** | Same GitLab OAuth app as Vercel |
| `GITLAB_OAUTH_CLIENT_SECRET` | **Yes** | Same GitLab OAuth app as Vercel |
| `GITLAB_PAT` | **Yes** | GitLab PAT for MCP REST config fallback |
| `GITLAB_PROJECT_ID` | **Yes** | Numeric GitLab project ID |

Worker fails fast at startup in production if `DATABASE_URL` or `WORKER_SECRET` is missing (`services/worker/src/load-env.ts`).

### 2c. Worker — recommended (agent + limits)

| Variable | Default | Notes |
|----------|---------|-------|
| `GOOGLE_CLOUD_PROJECT` | — | Vertex AI project ID |
| `GOOGLE_CLOUD_LOCATION` | — | e.g. `us-central1` |
| `VERTEX_GEMINI_MODEL` | `gemini-2.5-flash` | Agent fallback model |
| `GITLAB_BASE_URL` | `https://gitlab.com` | GitLab instance |
| `WARDEN_MAX_FILE_LINES` | `400` | Static scan cap |
| `WARDEN_MAX_FINDINGS` | `12` | Finding merge cap |
| `WARDEN_MAX_REPO_FILES` | `5000` | Repository walk cap |
| `WARDEN_MAX_REPO_SIZE_MB` | `100` | Checkout size cap |
| `WARDEN_MAX_FILE_SIZE_MB` | `2` | Per-file skip threshold |

### 2d. Secret Manager mapping (recommended)

| Env var | Secret name |
|---------|-------------|
| `DATABASE_URL` | `database-url` |
| `WORKER_SECRET` | `worker-secret` |
| `TOKEN_ENCRYPTION_KEY` | `token-encryption-key` |
| `GITLAB_OAUTH_CLIENT_SECRET` | `gitlab-oauth-client-secret` |
| `GITLAB_PAT` | `gitlab-pat` |

Plain env vars: `GITLAB_OAUTH_CLIENT_ID`, `GITLAB_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`.

---

## 3. Required IAM roles

### Runtime service account: `warden-worker@warden-hackathon.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/aiplatform.user` | Call Vertex AI Gemini |
| `roles/secretmanager.secretAccessor` | Mount secrets as env vars |

### Cloud Build service account

| Role | Purpose |
|------|---------|
| `roles/run.admin` | Deploy to Cloud Run |
| `roles/iam.serviceAccountUser` | Act as runtime SA |
| `roles/artifactregistry.writer` | Push images |

### Vercel → Cloud Run

Cloud Run uses `--allow-unauthenticated`. App-level `WORKER_SECRET` protects `/run-scan`.

---

## 4. Secret Manager setup

```bash
export PROJECT_ID="warden-hackathon"

# Neon connection string
echo -n 'postgresql://USER:PASS@HOST/warden?sslmode=require' | \
  gcloud secrets create database-url \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-

# Shared bearer token — use SAME value on Vercel as WORKER_SECRET
openssl rand -base64 32 | tr -d '\n' | \
  gcloud secrets create worker-secret \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-

# OAuth token encryption — use SAME value on Vercel as TOKEN_ENCRYPTION_KEY
openssl rand -base64 32 | tr -d '\n' | \
  gcloud secrets create token-encryption-key \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-

# GitLab OAuth app secret — use SAME value on Vercel as GITLAB_OAUTH_CLIENT_SECRET
echo -n 'YOUR_GITLAB_OAUTH_CLIENT_SECRET' | \
  gcloud secrets create gitlab-oauth-client-secret \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-

# GitLab PAT (if not already created)
echo -n 'glpat-YOUR_TOKEN' | \
  gcloud secrets create gitlab-pat \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-
```

Grant runtime SA access:

```bash
export RUNTIME_SA="warden-worker@${PROJECT_ID}.iam.gserviceaccount.com"

for SECRET in database-url worker-secret token-encryption-key gitlab-oauth-client-secret gitlab-pat; do
  gcloud secrets add-iam-policy-binding "${SECRET}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 5. One-time GCP setup

```bash
export PROJECT_ID="warden-hackathon"
export REGION="us-central1"
export AR_REPO="warden"
export SERVICE_NAME="warden-worker"
export RUNTIME_SA="warden-worker@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "${PROJECT_ID}"

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  --project="${PROJECT_ID}"

gcloud artifacts repositories create "${AR_REPO}" \
  --project="${PROJECT_ID}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Warden container images"
```

---

## 6. Build and deploy (exact commands)

Run from the **repository root**.

```bash
export PROJECT_ID="warden-hackathon"
export REGION="us-central1"
export AR_REPO="warden"
export SERVICE_NAME="warden-worker"
export RUNTIME_SA="warden-worker@${PROJECT_ID}.iam.gserviceaccount.com"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}:$(git rev-parse --short HEAD)"

# Build image (npm ci uses committed package-lock.json — no local artifacts needed)
gcloud builds submit . \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  --file="services/worker/Dockerfile"

# Deploy to Cloud Run
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --service-account="${RUNTIME_SA}" \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=1Gi \
  --timeout=600 \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-secrets="DATABASE_URL=database-url:latest,WORKER_SECRET=worker-secret:latest,TOKEN_ENCRYPTION_KEY=token-encryption-key:latest,GITLAB_OAUTH_CLIENT_SECRET=gitlab-oauth-client-secret:latest,GITLAB_PAT=gitlab-pat:latest" \
  --set-env-vars="GITLAB_OAUTH_CLIENT_ID=YOUR_GITLAB_OAUTH_CLIENT_ID,GITLAB_PROJECT_ID=YOUR_GITLAB_PROJECT_ID,GITLAB_BASE_URL=https://gitlab.com,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION},VERTEX_GEMINI_MODEL=gemini-2.5-flash"
```

Replace `YOUR_GITLAB_OAUTH_CLIENT_ID` and `YOUR_GITLAB_PROJECT_ID`.

### Capture the service URL

```bash
export WORKER_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)')"

echo "${WORKER_URL}"
```

Set on **Vercel**:

- `WORKER_URL` = value above (no trailing slash)
- `WORKER_SECRET` = same value as `worker-secret` in Secret Manager
- `TOKEN_ENCRYPTION_KEY` = same value as `token-encryption-key` in Secret Manager
- All other required Vercel vars from [§2a](#2a-web-vercel--required-environment-variables)

---

## 7. Post-deploy verification

```bash
# Health (no auth)
curl -sS "${WORKER_URL}/health"

# Run-scan without secret (should 401 in production)
curl -sS -X POST "${WORKER_URL}/run-scan" \
  -H "Content-Type: application/json" \
  -d '{"scanId":"test","repositoryId":"test"}'

# Run-scan with secret
export WORKER_SECRET="$(gcloud secrets versions access latest --secret=worker-secret --project=${PROJECT_ID})"
curl -sS -X POST "${WORKER_URL}/run-scan" \
  -H "Authorization: Bearer ${WORKER_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"scanId":"REPLACE_SCAN_ID","repositoryId":"REPLACE_REPO_ID"}'
```

Check logs:

```bash
gcloud run services logs read "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --limit=50
```

---

## 8. Redeploy after code changes

```bash
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}:$(git rev-parse --short HEAD)"

gcloud builds submit . \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  --file="services/worker/Dockerfile"

gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}"
```

Run `npm run db:migrate:deploy` if new migration files were added. Env vars and secrets persist across redeploys.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Worker fails to start | Missing `DATABASE_URL` or `WORKER_SECRET` | Set both in production; check startup logs |
| `401 Unauthorized` on `/run-scan` | `WORKER_SECRET` mismatch | Align Vercel + Secret Manager values exactly |
| OAuth scan fails at credential resolution | `TOKEN_ENCRYPTION_KEY` mismatch | Align Vercel + worker values exactly |
| OAuth scan fails at token refresh | Missing `GITLAB_OAUTH_CLIENT_ID/SECRET` on worker | Add to Cloud Run env/secrets |
| `git clone` failed | `git` not in image | Rebuild with current Dockerfile |
| Prisma connection error | Bad `DATABASE_URL` | Fix Neon secret; use `?sslmode=require` |
| GitLab `401` | Bad `gitlab-pat` or expired OAuth token | Update PAT secret; user re-authenticates |
| Vertex `403` | SA missing `aiplatform.user` | Bind role to runtime SA |
| `npm ci` fails in Cloud Build | `package-lock.json` not in repo | Commit `package-lock.json` (now tracked in git) |
| Schema errors | Migrations not applied | Run `npm run db:migrate:deploy` against Neon |
