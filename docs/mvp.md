# Warden MVP — Ruthless 2–3 Week Scope

**Hackathon:** [Rapid Agent](https://rapid-agent.devpost.com/) (GCP Agent Builder + Gemini).

**Judging bar:** One repo, one scan, one approval, one real GitLab issue — everything else is noise.

**Time budget assumption:** 1–2 builders, ~60–80 focused hours each. If solo, cut another 30%.

See also: [architecture.md](./architecture.md), [decisions.md](./decisions.md).

---

## 1. Core user journey

The only path that matters:

```text
Land → Connect GitLab (PAT) → Pick 1 repo → Run Scan
  → See findings + 1–3 proposed actions
  → Open proposal → Approve
  → Warden creates GitLab issue
  → Activity feed + audit show what happened
```

**Not in journey:** signup flows, teams, schedules, MRs, health trends, multi-repo dashboards, policies, notifications.

**Actor:** Single demo user (you). No roles, no invite flow.

---

## 2. Demo flow (3 minutes, scripted)

| Time | Screen | What you say |
|------|--------|----------------|
| 0:00 | Problem | “Repos accumulate debt; nobody files issues. Warden watches GitLab and proposes fixes—you approve.” |
| 0:20 | Connect | Show GitLab connected (pre-connected is fine). |
| 0:40 | Repo | Open **seed repo** with intentional debt. Click **Run scan**. |
| 1:00 | Scan running | Progress: “Gathering context via GitLab MCP…” (show audit line with tool name). |
| 1:30 | Results | 5–8 findings, sorted by severity. Highlight **one** with file:line evidence. |
| 2:00 | Proposal | Open top proposal: title, summary, linked findings. |
| 2:20 | Approve | Click **Approve & create issue** → spinner → success. |
| 2:40 | Proof | Split: Warden activity feed + **live GitLab issue** (new tab). |
| 2:55 | Architecture | 10s: “Next.js on Vercel, agent on GCP Agent Builder + Gemini, GitLab MCP, Postgres audit.” |

**Rehearse 5×.** Live agent on Wi‑Fi is a liability — have a **recorded backup video** and optional “replay last scan” using stored results.

---

## 3. Features that must exist

### Product (UI)

| Feature | Why mandatory |
|---------|----------------|
| GitLab PAT connect (1 instance, gitlab.com) | Proves integration |
| Select **one** monitored repository | Scope lock |
| Manual **Run scan** button | Trigger without cron/webhooks |
| Scan status (queued / running / done / failed) | Shows async architecture |
| Findings list (severity, category, title, evidence link) | Core value |
| **1–3** proposed actions per scan (not 20) | Human-in-the-loop story |
| Proposal detail + **Approve** / Reject | Control narrative |
| Create **GitLab issue** on approve | Only write path judges care about |
| Activity feed (10–20 events) | “History of agent actions” |
| Audit detail for last scan (phase + 2–3 MCP tool calls) | Proves agent + MCP |

### Backend

| Feature | Why mandatory |
|---------|----------------|
| `POST /scans` → enqueue Cloud Run job | Vercel doesn’t run agents |
| Agent Builder + Gemini: structured JSON findings + 1 proposal | Sponsor checkbox |
| GitLab MCP **read** during scan | MCP story |
| GitLab REST **write** on execute (issues) | Reliable; don’t write via MCP in MVP |
| Postgres: `Repository`, `Scan`, `Finding`, `ProposedAction`, `Approval`, `IssueCreationRecord`, `ActivityEvent`, minimal `AgentAction` | Supports journey |
| Idempotency on issue create | Survives double-click in demo |
| Deployed: Vercel + one Cloud Run service + DB | “It’s real” |

### Static layer (non-negotiable for credibility)

Run **before** LLM:

- Files over N lines
- Missing test file next to obvious source files
- Open MR with failed pipeline (MCP)
- Recent commit to default branch without MR (MCP)

Merge static + agent findings in UI. Judges forgive LLM noise if rules are right.

---

## 4. Features that should be removed

| Remove | Reason |
|--------|--------|
| Draft MR creation | High risk, low judge delta vs issue |
| Better Auth / multi-user / workspaces UI | Use env + single seeded `User` |
| Workspace switcher, RBAC | Fake one workspace row |
| Scheduled / webhook scans | Manual only |
| Multi-repo dashboard | One repo in demo |
| `MergeRequestCreationRecord` table usage | Empty until post-MVP |
| Full Prisma schema (canonical finding dedup, partitions, outbox) | `Finding` per scan is enough |
| `RepositoryHealthScore` charts | Fake one number or drop |
| Reject → complex workflows | Reject updates status only |
| Policy packs, custom rules UI | Hardcode thresholds |
| Email / Slack notifications | Zero judge value |
| Finding resolution / suppress / false positive | Post-hackathon |
| Self-hosted GitLab | gitlab.com only |
| Full REST fallback implementation | Stub + README note; fix only if MCP fails rehearsal |
| Agent trace / prompt viewer | Audit summary lines only |
| Search, filters beyond severity | Nice polish, not MVP |
| Cost dashboard | Mention in README only |
| Compare scan-over-scan trends | One scan in demo |
| GCS artifacts | Store small JSON on scan row |
| Framer Motion everywhere | Motion on scan complete + approve success only |

**Database:** Implement ~8 models, not 20. Defer `ScanFinding` junction — findings scoped to `scanId` only.

---

## 5. Five finding categories only

Lock enums. Agent prompt must only emit these:

| # | Category | Detection (MVP) | Example proposal |
|---|----------|-----------------|------------------|
| 1 | **MISSING_TESTS** | Static: `src/foo.ts` without `foo.test.ts` | “Add unit tests for `foo.ts`” |
| 2 | **MAINTAINABILITY** | Static: file > 400 lines, high complexity heuristic | “Split `utils.ts`” |
| 3 | **TECHNICAL_DEBT** | Agent + TODO/FIXME density | “Track debt: 12 TODOs in `api/`” |
| 4 | **RISKY_CHANGE** | MCP: recent commits on default branch, large diff | “Require MR for direct pushes” |
| 5 | **CI_CD** | MCP: latest pipeline failed or missing on open MR | “Fix failing pipeline on !42” |

**No SECURITY category in MVP** — false positives and scope creep. Mention as roadmap in README.

**Caps:**

- Max **12 findings** per scan (6 static + 6 agent)
- Max **3 proposals** per scan

---

## 6. GitLab MCP features — maximum judging value

Use **few tools, call them visibly** in audit UI.

| Priority | MCP capability | Judge payoff |
|----------|----------------|--------------|
| P0 | `get_project` / project metadata | “Connected to real GitLab” |
| P0 | `list_merge_requests` (open, recent) | EM-like context |
| P0 | `get_pipeline` / pipeline status for default branch or MR | CI_CD findings |
| P0 | `list_commits` or recent commits on default branch | RISKY_CHANGE |
| P1 | `get_file` (2–3 files max, agent-chosen) | Evidence depth |
| P1 | `list_issues` (open count / labels) | Context in proposal text |

**Skip for MVP:** wiki, releases, milestones, search_code across whole repo, create_issue via MCP, 50+ community tools.

**Demo line:** “Warden called `list_merge_requests` and `get_pipeline` before Gemini analyzed.”

**Write path:** REST `POST /projects/:id/issues` in executor — judges care that an issue exists, not that MCP wrote it.

---

## 7. What to implement first

### Week 1 — “Issue appears in GitLab”

1. Monorepo scaffold: Next.js + Prisma + Postgres (Neon).
2. `Repository` + PAT in env/Secret Manager (skip connect UI day 1 — hardcode project ID).
3. Cloud Run worker: **hardcoded** scan returns 3 static findings → insert DB.
4. Minimal UI: repo page + findings list.
5. REST issue create on button click (no agent yet).

**Exit criterion:** Click button → issue in GitLab. Everything else hangs off this.

### Week 2 — “Agent + MCP”

6. Agent Builder integration: prompt → JSON findings + 1 proposal.
7. GitLab MCP read adapter (4 P0 tools above).
8. Wire scan job: MCP context → agent → persist.
9. Proposals + Approve → executor → `IssueCreationRecord` + `ActivityEvent`.
10. Audit log UI (5–10 `AgentAction` rows per scan).

**Exit criterion:** Full journey on seed repo, rehearsed once.

### Week 3 — “Judge-ready”

11. Connect PAT UI (simple form).
12. Scan progress states + error state.
13. Activity feed page.
14. Polish + README architecture diagram + **demo video**.
15. Freeze seed repo; run 3 stable scans; keep best IDs for demo.

**Do not start week 3 UI polish until week 2 exit criterion passes.**

---

## 8. What can be faked in demo data

| Fake freely | How |
|-------------|-----|
| Health score | Static “72/100” on repo card |
| Multi-workspace | Single row in DB |
| User account | “Demo User” hardcoded |
| Historical scans | Seed 1–2 completed scans in SQL |
| Activity feed backfill | Insert 15 `ActivityEvent` rows |
| Finding count badges on dashboard | Static if needed |
| Agent “thinking” delay | 3–5s progress bar (real scan may be 30–90s) |
| Some findings on backup path | If live agent fails, load `scanId` from last successful run (“Replay scan”) |
| Token counts / cost | Plausible numbers in audit metadata |
| Priority score formula | `severity * 10 + isNew * 5` — don’t explain |

| Do **not** fake | Why |
|-----------------|-----|
| GitLab issue URL after approve | Judges will click |
| MCP tool names in audit | Easy to spot in recording |
| “Create issue” API call | Must be real at least once on video |
| Sponsor stack claims | Must be true in code path |

**Best hack:** Seed repo `warden-demo/debt-lab` (or similar) with known smells; agent + static both fire reliably.

---

## 9. What will impress judges the most

Ranked by ROI (effort vs score):

| Rank | Impression | Why |
|------|------------|-----|
| 1 | **Live approve → real GitLab issue** in 10s | Only proof of end-to-end + human control |
| 2 | **Audit line: “MCP: list_merge_requests”** before finding | GitLab + agent integration visible |
| 3 | **Evidence: `path:line`** clickable to GitLab | Trust > vague AI text |
| 4 | **Structured architecture README** (one diagram) | Staff-level clarity |
| 5 | **Graceful failure** (“Scan failed — showing rule-based findings”) | Maturity |
| 6 | **90s video** with same flow as live demo | Judges watch video first |
| 7 | Named stack: Agent Builder, Gemini, MCP, Vercel, Cloud Run | Sponsor alignment |

**Won’t impress:** 15 features, dark mode, heavy animations, “replaced your EM” copy, autonomous merges, MR drafts, health trend charts with fake data.

**One-liner for submission:**

> Warden is a human-in-the-loop agent that reads your GitLab repo via MCP, surfaces five types of engineering risk, and opens issues only after you approve.

---

## Definition of done (binary checklist)

- [ ] One GitLab project connected
- [ ] One manual scan completes end-to-end
- [ ] ≥5 findings across the 5 categories (mix static + agent)
- [ ] ≥1 proposal approvable
- [ ] ≥1 GitLab issue created from approval (real URL)
- [ ] Activity feed shows scan → proposal → approve → issue
- [ ] Audit shows ≥2 MCP tool invocations
- [ ] Deployed public URL + 3-min video
- [ ] README lists GCP + Gemini + GitLab MCP

If any item slips past week 2, **cut agent findings** before cutting issue creation.

---

## Final verdict

The architecture supports a platform. The MVP is a **single-scene play**: connect → scan → approve → issue.

**2–3 weeks is enough** only if week 1’s “issue button” ships by day 5 and everything else is decoration.

**Kill list priority:** MRs, auth, health charts, multi-repo, webhooks, full schema, security category, MCP write paths.
