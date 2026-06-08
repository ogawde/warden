# Warden — Implementation Plan (Hackathon Mode)

Solo developer · 2–3 weeks · Goal: **working demo** (approve → real GitLab issue) before polish.

Aligned with: [architecture.md](./architecture.md), [decisions.md](./decisions.md), [mvp.md](./mvp.md), [agent-design.md](./agent-design.md), [simplified-schema.md](./simplified-schema.md).

---

## North star

| Checkpoint | Target |
|------------|--------|
| **Day 5 exit** | Button → GitLab issue exists (REST only, mocked scan data) |
| **Day 12 exit** | Full scan → findings → approve → issue (static + MCP + Agent Builder) |
| **Day 18–21 exit** | Deployed URL + frozen seed repo + 3-min video |

If behind schedule: cut Agent Builder depth before cutting issue creation or MCP audit lines.

---

## 1. Exact build order

Build in this sequence — each step unlocks the next.

| Order | Deliverable | Depends on |
|-------|-------------|------------|
| 1 | Monorepo + Next.js app shell + env layout | — |
| 2 | Postgres (Neon) + **minimal Prisma schema** + seed (`User`, `Repository`) | 1 |
| 3 | GitLab REST client (read project + **create issue**) | 1 |
| 4 | `POST /api/proposals/:id/execute` → real GitLab issue + `IssueCreation` row | 2, 3 |
| 5 | Minimal UI: repo page + “Create test issue” / execute proposal | 4 |
| 6 | **Mock scan worker** → inserts `Scan`, `Finding[]`, `ProposedAction[]` | 2 |
| 7 | UI: Run scan → findings list → proposal detail | 6 |
| 8 | Approve flow → `Approval` + execute → issue | 4, 7 |
| 9 | `ActivityEvent` writes on key actions + feed page | 8 |
| 10 | **Vercel deploy (preview)** — mock scans acceptable | 8, 9 |
| 11 | **Cloud Run deploy** — mock worker acceptable | 6, 10 |
| 12 | **Static analyzers** in worker (missing tests, large files) | 6 |
| 13 | **GitLab REST reads** in worker (MRs, pipeline, commits) — MCP later | 3, 12 |
| 14 | Cloud Run worker + `POST /api/scans` enqueue (wired to deployed worker) | 6, 13 |
| 15 | **GitLab MCP adapter** (orchestrator-owned, 4 P0 tools) replaces/supplements REST reads | 13, 14 |
| 16 | **Agent Builder** (Gemini JSON) wired into worker | 14, 15 |
| 17 | Scan progress UI + audit panel (`Scan.mcpAudit` + feed) | 15, 16 |
| 18 | Connect PAT UI (optional if env-based works) | 3 |
| 19 | Degraded path + replay last scan | 16 |
| 20 | Demo seed repo + rehearsal + video | all |

**Never invert:** Agent Builder before issue REST works; MCP before mock scan works; polish UI before end-to-end path works.

---

## 2. Folder structure

Keep flat enough for one person — monorepo optional but recommended.

```text
warden/
├── apps/
│   └── web/                          # Next.js 15 App Router (Vercel)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # redirect → /repo
│       │   ├── repo/
│       │   │   └── page.tsx          # dashboard: repo + last scan
│       │   ├── scans/
│       │   │   └── [scanId]/
│       │   │       ├── page.tsx      # findings + proposals + audit
│       │   │       └── proposals/[id]/page.tsx
│       │   ├── activity/
│       │   │   └── page.tsx
│       │   └── api/
│       │       ├── scans/
│       │       │   ├── route.ts      # POST create, GET list
│       │       │   └── [scanId]/route.ts
│       │       ├── proposals/
│       │       │   └── [id]/
│       │       │       ├── approve/route.ts
│       │       │       ├── reject/route.ts
│       │       │       └── execute/route.ts
│       │       ├── activity/route.ts
│       │       └── health/route.ts
│       ├── components/
│       │   ├── ui/                   # shadcn
│       │   ├── findings-list.tsx
│       │   ├── proposal-card.tsx
│       │   ├── scan-status.tsx
│       │   ├── activity-feed.tsx
│       │   └── audit-panel.tsx
│       └── lib/
│           ├── db.ts                 # Prisma client singleton
│           └── api/                  # typed fetch helpers
│
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── package.json
│   └── contracts/
│       ├── src/
│       │   ├── agent-output.ts     # Zod: findings + proposals
│       │   ├── analysis-context.ts
│       │   └── enums.ts
│       └── package.json
│
├── services/
│   └── worker/                       # Cloud Run scan + execute
│       ├── src/
│       │   ├── index.ts              # HTTP: /run-scan, /health
│       │   ├── scan-pipeline.ts      # orchestrate phases
│       │   ├── static/               # missing tests, large files, todos
│       │   ├── gitlab/
│       │   │   ├── rest-client.ts    # read + create issue
│       │   │   └── mcp-adapter.ts    # P0 tools → AnalysisContext
│       │   ├── agent/
│       │   │   ├── client.ts         # Agent Builder / Gemini
│       │   │   └── prompts.ts        # warden-mvp-1.0
│       │   └── persist.ts            # Prisma writes
│       ├── Dockerfile
│       └── package.json
│
├── docs/
├── scripts/
│   ├── seed-demo.sql                 # optional backup
│   └── replay-scan.ts                # load last good scan
├── .env.example
├── package.json                      # pnpm workspaces root
├── turbo.json                        # optional
└── README.md
```

**Defer:** `packages/gitlab-port` as separate package until REST + MCP duplicate code; start with `services/worker/src/gitlab/`.

---

## Demo Repository Strategy

The project should use a **controlled GitLab repository** for demonstrations (e.g. `warden-demo/debt-lab`).

The repository should intentionally contain:

1. **Missing tests**
   - `src/auth.ts`
   - `src/payment.ts`

2. **Maintainability issue**
   - `src/utils.ts` larger than 700 lines

3. **Technical debt**
   - Multiple `TODO`, `FIXME`, `HACK` comments

4. **CI/CD issue**
   - Intentionally broken pipeline

5. **Risky change**
   - Direct commit to `main` branch

Controlled demo data increases **reliability and consistency** of demonstrations: static rules, MCP reads, and the agent all have predictable signals to hit the five MVP finding categories. Rehearse only against this repo after day 14; freeze its contents before submission.

---

## 3. Milestones

| ID | Milestone | Exit criteria | Target |
|----|-----------|---------------|--------|
| **M0** | Dev environment | `pnpm dev` runs; DB connects; seed user + repo | Day 2 |
| **M1** | **Issue spike** | REST creates issue; `IssueCreation` in DB | Day 5 |
| **M2** | **Mock demo path** | Run scan (mock) → findings → approve → issue | Day 8 |
| **M3** | **Real worker** | Cloud Run completes scan with static + REST GitLab | Day 11 |
| **M4** | **Agent + MCP** | Live scan uses MCP audit + Gemini findings | Day 14 |
| **M5** | **Deployed demo** | Public Vercel + Cloud Run; one full rehearsal | Day 17 |
| **M6** | **Submission-ready** | Video + README + frozen seed repo | Day 18–21 |

---

## 4. Day-by-day roadmap

Assumes ~6–8 focused hours/day. **3-week** path below; **2-week** = compress days 15–21 into 10–14 (skip PAT UI, minimal motion).

### Week 1 — Vertical slice (no agent, no MCP)

| Day | Focus | Outcomes |
|-----|--------|----------|
| **1** | Scaffold | pnpm monorepo, Next.js, Tailwind, shadcn init, `packages/contracts` stubs, `.env.example` |
| **2** | Database | **Generate Prisma schema** (8 models), migrate, seed `User` + `Repository`, `lib/db.ts` |
| **3** | GitLab REST write | `createIssue()` with PAT from env; manual script or API route test |
| **4** | Execute API + DB | `execute` route: `Approval` check, `IssueCreation`, idempotency, `ActivityEvent` |
| **5** | **M1** UI spike | Repo page; hardcoded `ProposedAction` in seed; Approve → issue link works |
| **6** | Mock scan API | `POST /api/scans` inserts `Scan` + mock `Finding`/`ProposedAction` (JSON fixture) |
| **7** | **M2** UI path | Scan detail page, findings list, proposal approve; feed page (basic) |
| **7–8** | **First Vercel deploy** | Preview URL; `DATABASE_URL` + `GITLAB_PAT` in Vercel env; mock scans OK end-to-end |

### Week 2 — Worker, static rules, MCP, agent

| Day | Focus | Outcomes |
|-----|--------|----------|
| **8** | Static analyzers + Vercel verify | Worker function locally; confirm preview deploy with mock scan path |
| **9** | GitLab REST reads + **first Cloud Run deploy** | MRs, pipeline, commits; Dockerfile + `/run-scan` (mock handler OK); `WORKER_URL` in Vercel |
| **10** | Wire worker to scan API | Webhook secret; `POST /api/scans` → deployed worker; poll `Scan.status` |
| **11** | **M3** Wire scan | Persist static findings from real worker against demo repo |
| **12** | **GitLab MCP** | MCP HTTP client in worker; 4 P0 tools; populate `Scan.mcpAudit` + context |
| **13** | **Agent Builder** | GCP project, agent config, JSON schema output, validate with Zod |
| **14** | **M4** Full pipeline | MCP → context → Gemini → persist; degraded static fallback |

### Week 3 — Deploy, polish, freeze

| Day | Focus | Outcomes |
|-----|--------|----------|
| **15** | Audit UI | Audit panel from `mcpAudit` + `AGENT_TOOL_CALLED` events |
| **16** | Deploy hardening | Env parity (Vercel ↔ Cloud Run ↔ Neon); redeploy if needed |
| **17** | **M5** Production rehearsal | Demo repo; 3 live scans on **deployed** stack; fix flaky categories |
| **18** | Hardening | Replay scan, error states, reject flow |
| **19** | Demo assets | README diagram, sponsor checklist, 3-min video |
| **20** | Buffer | Bug fixes only |
| **21** | **M6** Submit | Devpost, final video, tag release |

---

## 5. What should be built first

Priority stack (do not skip):

1. **GitLab REST `create_issue`** — proves hackathon write path (`decisions.md`).
2. **Prisma + seed** — one user, one repo, one proposal row.
3. **Approve + execute API** — human-in-the-loop core.
4. **Minimal UI** showing issue URL after execute.
5. **Mock scan** inserting findings/proposals — unblocks UI without agent.
6. **Static rules** — reliable MISSING_TESTS / MAINTAINABILITY for judges.
7. **Cloud Run worker** — async scan credibility.
8. **GitLab MCP reads** — visible in audit.
9. **Agent Builder** — enriches findings, not the only source of truth.
10. **Activity feed + audit panel** — demo polish.
11. **Connect PAT UI** — only if env vars are awkward for judges.

---

## 6. What should be mocked first

| Mock | When | Replace when |
|------|------|----------------|
| **Scan worker output** | Day 6–7 | Day 11 (real worker on deployed Cloud Run) |
| **Findings JSON fixture** | Day 6 | Day 14 (agent output) |
| **Proposed actions (1–3)** | Day 6 | Day 14 |
| **`AnalysisContext`** | Day 7–10 | Day 12 (MCP) |
| **Agent/Gemini response** | Day 7–13 | Day 13–14 |
| **MCP tool results** | Day 7–11 | Day 12 (use REST read mock with same shape) |
| **Activity feed backfill** | Day 7 demo | Real events from day 8+ |
| **Health score “72”** | Anytime in UI | Never in MVP DB |
| **Scan progress timing** | UI 3–5s animation | Real poll `Scan.status` |
| **Connect GitLab page** | Use `.env` `GITLAB_PAT` + `PROJECT_ID` | Day 18 optional form |

**Do not mock:** GitLab issue URL after execute, MCP tool names shown in audit (must be real once MCP ships), “uses Gemini” claim without at least one successful agent run recorded.

**Replay strategy:** After first good scan (day 14+), save `scanId` for demo fallback (`mvp.md`).

---

## 7. When Agent Builder should be integrated

| Phase | When | Scope |
|-------|------|--------|
| **Not before** | Day 13 | Issue path + mock/static scan must work |
| **Integrate** | **Day 13–14** | Single completion: `AnalysisContext` in → findings + ≤3 proposals out |
| **Config** | Day 13 AM | GCP Agent Builder app, Gemini model, JSON response schema matching `contracts` |
| **Prompt freeze** | Day 14 EOD | `warden-mvp-1.0` — no prompt edits after day 17 except emergency |
| **Fallback** | Day 14+ | `Scan.agentDegraded=true`; static-only findings + 1 template proposal from orchestrator |

**Why late:** Agent is slow, flaky, and sponsor-optional for *demo* if static + MCP audit prove integration; issue creation proves control.

**Minimum viable agent:** 1 proposal + 3–6 agent findings; static supplies the rest to hit 5 categories.

---

## 8. When GitLab MCP should be integrated

| Phase | When | Scope |
|-------|------|--------|
| **First** | Day 3–9 | **GitLab REST** for reads (same `AnalysisContext` shape) |
| **MCP integrate** | **Day 12** | After worker runs static + REST end-to-end |
| **P0 tools** | Day 12 | project, list MRs, pipeline (default), list commits |
| **P1 tools** | Day 12–13 | pipeline per failed MR (≤2), `get_file` (≤3) if time |
| **Audit** | Day 12+ | Each call → `Scan.mcpAudit` + `ActivityEvent(AGENT_TOOL_CALLED)` |
| **Never in MVP** | — | MCP writes, search_code, wiki |

**Why after REST:** REST is easier to debug solo; MCP is judge marketing — swap adapter behind `buildAnalysisContext()` without changing agent contract (`agent-design.md`).

**Why before Agent:** Agent input must include real MR/pipeline/commit facts to limit hallucinations.

---

## 9. When Prisma schema should be generated

| When | Action |
|------|--------|
| **Day 2 (morning)** | Generate `schema.prisma` from `simplified-schema.md` — all 8 models + enums |
| **Day 2 (afternoon)** | First migration + `seed.ts` (1 user, 1 repo) |
| **Day 5** | No schema change — use seed/hardcoded proposal for execute spike |
| **Day 6–7** | No schema change — mock scan uses existing tables |
| **Day 8+** | **Freeze schema** — only add fields if blocking; no new tables |

**Rules:**

- Do not generate schema on day 1 (avoid modeling before spike).
- Do not expand to production 18-model schema during hackathon.
- If you need a field (e.g. `metadata` on `IssueCreation`), one migration max after day 10.

---

## 10. When deployment should happen

Early deployment reduces integration risk and exposes environment/configuration issues sooner.

| Environment | When | What |
|-------------|------|------|
| **Local dev** | Days 1–6 | Next.js + Neon; worker via `curl localhost:8080` until Cloud Run exists |
| **DB hosted** | **Day 2** | Neon Postgres (production DB from start — avoids migration drift) |
| **Vercel preview** | **Day 7–8** (first deploy) | `apps/web`; mock scans acceptable; validate `DATABASE_URL`, `GITLAB_PAT`, API routes |
| **Cloud Run** | **Day 8–9** (first deploy) | Worker image + `/run-scan` (mock handler OK); set `WORKER_URL` + `WORKER_SECRET` in Vercel |
| **Env config** | Day 7–9 | `GITLAB_PAT`, `DATABASE_URL`, `WORKER_SECRET` via environment variables (see PAT storage below) |
| **GCP agent creds** | Day 13+ | Gemini / Agent Builder credentials on Cloud Run only |
| **Production rehearsal** | **Day 17–18** | Final week: full pipeline on deployed stack against demo repo |
| **Freeze deploys** | **Day 19** | Video uses tagged commit; no risky merges |

Mock scans and stub workers are **acceptable** for first Vercel and Cloud Run deploys — goal is to prove Vercel ↔ Neon ↔ Cloud Run wiring before agent/MCP complexity.

**Do not deploy Agent Builder on Vercel** — agent runs only in Cloud Run worker (`architecture.md`).

### GitLab PAT storage

| Phase | Approach |
|-------|----------|
| **MVP (hackathon)** | GitLab PAT in **environment variables** (`GITLAB_PAT` locally, Vercel env, Cloud Run env) |
| **Post-hackathon** | Migrate PAT storage to **Google Secret Manager**; `Repository.tokenSecretRef` can point to secrets then |

Do not block hackathon progress on Secret Manager setup.

---

## Risk budget (solo)

| Risk | Mitigation |
|------|------------|
| Agent timeout | Static fallback + replay scan |
| MCP beta/tier | REST read adapter same interface |
| Cloud Run cold start | Keep min instances 0; pre-warm before demo |
| Prisma on Vercel | Neon pooler or Prisma Accelerate |
| Scope creep | `decisions.md` removed list is non-negotiable |

---

## Daily “done” checks

- Can I create a GitLab issue from the app?
- Can I complete a scan (mock or real) and see findings?
- Can I approve and see a new issue URL?
- Does the feed show the last 10 events?
- If agent is down, does static scan still demo?

---

## 2-week compressed schedule

| Window | Focus |
|--------|--------|
| Days 1–5 | Same as Week 1 → **M2** by day 5 |
| Days 6–9 | Worker + static + MCP + Agent; **Vercel day 7–8, Cloud Run day 8–9** |
| Days 10–12 | Production rehearsal + video + freeze |

**Cut:** PAT UI, reject polish, Framer Motion, second proposal theme.

---

## Quick reference

| # | Topic | Answer |
|---|--------|--------|
| 5 | Build first | GitLab issue REST → Prisma seed → execute API → mock scan UI |
| 6 | Mock first | Scan findings, agent output, MCP (REST-shaped mock), feed backfill |
| 7 | Agent Builder | **Day 13–14**, after worker + MCP context |
| 8 | GitLab MCP | **Day 12**, after REST reads; REST first day 9 |
| 9 | Prisma schema | **Day 2**, then freeze |
| 10 | Deployment | DB day 2; **Vercel day 7–8**; **Cloud Run day 8–9**; production rehearsal day 17–18; freeze day 19 |

---

# Architecture Freeze

After implementation begins:

- No new database tables.
- No Draft Merge Requests.
- No multi-repository support.
- No Better Auth integration.
- No scheduled scans.
- No webhook scans.
- No security scanning.
- No health trend analytics.

Any new ideas must be added to a **future roadmap** and not implemented during the hackathon.
