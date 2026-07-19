# Implementation Plan
## AI Procurement Intelligence Platform — Sequenced Build Plan for Claude Code

| | |
|---|---|
| **Document status** | Draft v1.0 — for review, not approved |
| **Companion to** | PRD v1.0 · App Flow v1.0 · Tech Stack v1.0 · Content Guidelines v1.0 · Backend Schema v1.0 · design-system-preview.html |
| **Date** | 18/07/2026 |
| **Total steps** | 58, across 14 phases, 4 mandatory human gates |

---

# PART A — CLAUDE.md (copy this section verbatim to the repository root)

## Project
AI Procurement Intelligence Platform — B2B SaaS for hospitality procurement teams. Nuxt 4 + Supabase + Vercel + Gemini. UK/EU-first. British English, DD/MM/YYYY, GBP.

## Document hierarchy & conflict rules
Six governing documents live in `/docs`. On conflict, the more specific document wins for its domain:

1. **Backend Schema** — authoritative for tables, RLS, API shape, auth flows.
2. **Tech Stack** — authoritative for dependencies (EXACT versions, §3), prohibited libraries (§14), architecture rules.
3. **Content & Design Guidelines** — authoritative for every visual token, component spec, and user-facing string pattern. UI terminology: "supplier"/"evaluation" on screen, `vendor`/`event` in code (§9.2).
4. **App Flow** — authoritative for screens, states, journeys, navigation.
5. **PRD** — authoritative for requirements, priorities (M/S/P2), and scope. Anything marked P2 is NOT built now.
6. **Implementation Plan (this file's parent)** — authoritative for sequence and verification.

If two documents genuinely contradict and neither clearly owns the domain: STOP and ask a human. Never resolve by inventing a third option.

## Non-negotiable working rules
- Versions are exact pins (Tech Stack §1). Never upgrade, never add a dependency without approval.
- All writes through Nitro routes; client reads via RLS (Backend Schema §11.1). `service_role` only in the five enumerated uses (Backend Schema §7.4).
- Every migration is a file in `supabase/migrations/`; regenerate types in the same PR.
- Design tokens only — no raw hex/px in components (Guidelines §1.2). Copy follows the microcopy formulas (Guidelines §10).
- Never commit secrets. Steps marked 🔑 require a human to provision environment values first.
- A step is DONE only when its Verify block passes. Failing verification BLOCKS progression — fix before moving on.
- Real personal data never enters the codebase, seeds, or tests — fictional placeholder data only.

## Conventions quick card
pnpm scripts: `dev` · `build` · `typecheck` · `lint` · `test` (vitest) · `test:e2e` (playwright) · `test:rls` · `test:golden` · `db:migrate` · `db:types` · `db:seed`.
Branching: one branch per slice (`slice/06-vendor-portal`), PR → Vercel preview + Supabase branch DB, squash-merge to `main`. Commits: conventional (`feat:`, `fix:`, `chore:`).
Directory layout: Tech Stack §5. Component naming: PascalCase, domain-grouped.

---

# PART B — Plan Overview

## Phase map

| Phase | Name | Steps | Gate |
|---|---|---|---|
| 0 | Initialisation & tooling | 1–5 | |
| 1 | Walking skeleton | 6–8 | |
| 2 | Schema foundation | 9–14 | **G1** after migrations+seed · **G2** after RLS suite |
| 3 | Auth & app shell | 15–19 | |
| 4 | Supplier directory & compliance | 20–24 | |
| 5 | Requirements | 25–26 | |
| 6 | Evaluations: wizard & event shell | 27–30 | |
| 7 | Vendor portal & submissions | 31–35 | |
| 8 | AI extraction pipeline | 36–41 | **G3** before first Gemini call |
| 9 | Scoring | 42–44 | |
| 10 | Comparison & approvals | 45–48 | |
| 11 | Contracts & alerts | 49–52 | |
| 12 | Dashboards, actions & notifications | 53–55 | |
| 13 | Hardening & launch | 56–58 | **G4** before production deploy |

## The four human gates
- **G1 — Schema sign-off** (after step 12): human reviews applied migrations + seeded DB before anything is built on top. Renames after this point are migrations, not edits.
- **G2 — Security sign-off** (after step 14): the RLS test suite is green; human reviews the leak matrix. Nothing user-facing ships before this.
- **G3 — AI cost & data sign-off** (before step 37): human confirms Gemini key, EU data-processing configuration status, and budget caps before the first real API call.
- **G4 — Production go** (before step 58): human reviews the launch checklist, secrets, and runs the E2E suite personally.

## Step format
> **Step N — Title** `[slice branch]`
> **Goal** · **Refs** (doc §) · **Tasks** · **Verify** (blocking) · 🔑 where human secrets/config needed

## Deliberate scope deferrals (build LAST, in step 57 if time allows; otherwise post-pilot)
Approval delegation (F9.5) · vendor-portal white-labelling beyond logo (F4.6) · compare-by-term pivot EVT-05 · CSV import column-mapping polish (basic import ships in step 23) · duplicate detection F2.4 beyond exact-match.

---

# PART C — The Steps

## Phase 0 — Initialisation & tooling

**Step 1 — Repository & toolchain** `[slice/00-init]`
Goal: pinned, reproducible workspace.
Refs: Tech Stack §3–4.
Tasks: git init; `.nvmrc` = 24.18.0; `package.json` with `packageManager: pnpm@11.14.0`, engines, exact-pinned deps from Tech Stack §3 (copy the tables verbatim); `pnpm install`; commit lockfile; `.gitignore` (env files, .nuxt, node_modules); `/docs` folder containing the six governing documents; CLAUDE.md at root (Part A).
Verify: `node -v` = 24.18.0 · `pnpm install --frozen-lockfile` clean · no `^`/`~` anywhere in package.json (`grep -E '"[\^~]' package.json` returns nothing).

**Step 2 — Nuxt 4 scaffold + TypeScript strict**
Tasks: Nuxt 4.4.8 app skeleton per Tech Stack §5 directory layout; `tsconfig` extends Nuxt with `strict: true`, `noUncheckedIndexedAccess: true`; `shared/` and `server/utils/` stubs.
Verify: `pnpm dev` serves; `pnpm typecheck` clean.

**Step 3 — Lint & format**
Tasks: `@nuxt/eslint` flat config; `eslint-config-prettier` last; Prettier config; scripts wired.
Verify: `pnpm lint` clean on scaffold; a deliberately misformatted file fails then fixes.

**Step 4 — Tailwind 4 + design tokens + PrimeVue preset**
Refs: Guidelines §3.1 (verbatim token block), §6; Tech Stack §14 (use `@tailwindcss/vite`, NOT `@nuxtjs/tailwindcss`).
Tasks: `@tailwindcss/vite` in nuxt config; paste the `@theme` block into `app/assets/css/main.css` **unchanged**, including the dark-mode `[data-theme="dark"]` values from design-system-preview.html; PrimeVue 4.5.5 + nuxt module + Aura `definePreset` in `app/theme/preset.ts` mapping tokens; Inter self-hosted.
Verify: a scratch page renders a primary button + status chip matching design-system-preview.html side-by-side in both themes; no raw hex in the scratch component.

**Step 5 — Supabase projects & local stack** 🔑
Tasks: Supabase CLI local stack (`supabase init`, `supabase start`); human creates the production project (EU/London) and provides URL + anon key + service key into `.env` locally and Vercel later; `.env.example` committed; `shared/types/database.ts` generation script wired (`db:types`).
Verify: `supabase status` healthy; app reads local Supabase URL from runtime config.

## Phase 1 — Walking skeleton

**Step 6 — Hello-world through the stack** `[slice/01-skeleton]`
Goal: one page → one Nitro route → one Postgres query, before any real feature.
Tasks: throwaway `health` table via a scratch migration; `GET /api/health` returns row count via user-scoped client pattern (Backend Schema §3); index page renders it.
Verify: browser shows live DB value; `pnpm typecheck && pnpm lint && pnpm test` (one trivial vitest) green.

**Step 7 — Vercel deployment + preview pipeline** 🔑
Refs: Tech Stack §13.
Tasks: human connects repo to Vercel (Pro, lhr1) and sets env vars; Nitro `vercel` preset; PR → preview deployment + Supabase branch DB wiring; CI workflow: typecheck → lint → unit → build on every PR.
Verify: this slice's PR produces a working preview URL showing the health page; CI green.

**Step 8 — Auth smoke test**
Tasks: Supabase Auth email+password enabled locally; minimal AUTH-01 (T6 template, Guidelines §4.2); sign in/out round-trip; SSR session via `@nuxtjs/supabase`.
Verify: sign in → health page shows `auth.uid()`; sign out clears session server-side. Remove scratch `health` artefacts at merge.

## Phase 2 — Schema foundation *(horizontal — the only phase built layer-wise)*

**Step 9 — Extensions + identity migrations** `[slice/02-schema]`
Refs: Backend Schema §6.1, §12.
Tasks: `000_extensions` (pgcrypto, pg_trgm, pgmq, pg_cron) · `001_orgs` exactly as specced; `db:types`.
Verify: `supabase db reset` applies clean; generated types compile.

**Step 10 — Vendor, evaluation, contract, platform migrations**
Refs: Backend Schema §6.2–6.5.
Tasks: `002_vendors` → `005_platform`, verbatim DDL including all CHECKs, generated `notice_deadline` column, indexes, and the `audit_entries` REVOKE.
Verify: reset clean; smoke SQL: insert an org→site→vendor→event chain; `notice_deadline` computes; `byte_size` CHECK rejects a 51 MB value; UPDATE on `audit_entries` as service_role fails.

**Step 11 — Functions & triggers**
Refs: Backend Schema §9.
Tasks: `020_functions_triggers`: `touch_updated_at`, audit trigger + `audit.log_action` RPC, compliance rollup, jobs rollup, `open_event()`, `apply_retention()`; `021_cron` registering `generate_alerts`, `send_due_alerts`, `send_deadline_reminders` (schedules only — senders stubbed until Phase 12).
Verify: unit-style SQL tests (pgTAP or scripted asserts): rollup flips vendor to `non_compliant` when a mandatory doc expires; `open_event()` refuses weightings ≠ 100 and writes both snapshots; audit rows appear on event update.

**Step 12 — Seed: system data + demo org** — then **GATE G1**
Refs: Backend Schema §12 (`030_seed_system_data`); plan decision #9.
Tasks: seed 4 system scoring templates, hospitality compliance taxonomy, vendor categories; `db:seed` script builds the fictional demo org — "Milburn House Group", 3 sites (The Mill House, Harbour Rooms, The Glasshouse), departments, 5 users (one per role + a PM/OA combo), 20 fictional suppliers across categories with mixed compliance states, 2 events (one draft, one open), 3 contracts (one inside notice window). All names fictional; no real people or companies.
Verify: seed idempotent (run twice = no dupes); counts assert. **STOP: human reviews schema + seed before proceeding (G1).**

**Step 13 — RLS helpers & policies**
Refs: Backend Schema §8.1–8.3, 8.6.
Tasks: `010_rls_helpers`, `011_rls_policies` — full SQL for core tables, pattern application to the rest (§8.3 closing paragraph), `extracted_fields_dh` view, ENABLE+FORCE on every table, Realtime publications for `jobs` + `notifications` only.
Verify: reset clean; anon client sees zero rows everywhere.

**Step 14 — RLS test suite** — then **GATE G2**
Refs: Backend Schema closing acceptance gate; Tech Stack §12.
Tasks: `test:rls` vitest suite using one authenticated client per seeded role. Assert the leak matrix: PM sees all org events, zero cross-org rows (create a second minimal org to prove it); DH sees only site∩department events, never `extracted_fields.field_group='commercial'` via the DH view when masked; FA sees only entered-approval events + contracts; deactivated user sees nothing; vendor anon sees nothing; approval step updatable only by assignee.
Verify: suite green in CI. **STOP: human reviews the matrix output (G2).**
## Phase 3 — Auth & app shell *(vertical slices begin)*

**Step 15 — Internal shell: layouts & navigation** `[slice/03-shell]`
Refs: App Flow §2.1–2.3; Guidelines §4.1, §7.7; design-system-preview.html as visual reference.
Tasks: `internal.vue` layout — sidebar (260/64px, nav labels "Dashboard · My actions · Requirements · Evaluations · Suppliers · Contracts · Admin", role-conditional per App Flow §2.2), header (breadcrumbs, search placeholder, bell placeholder, theme toggle, user menu); `vendor.vue` + `auth.vue` layouts; route groups `(internal)` / `vendor`.
Verify: seeded PM sees all sections; seeded DH sees the reduced set; collapsed sidebar shows tooltips; both themes render.

**Step 16 — Auth flows & middleware**
Refs: Backend Schema §7.1–7.2; App Flow AUTH-01/02.
Tasks: full AUTH-01 (SSO buttons stubbed until step 17, password+MFA path live); invite-acceptance route `POST /api/auth/accept-invite` (profile + roles + scopes + `app_metadata.org_id`); route middleware: session required, shell boundary, role-scope guard → GLOB-E403 page; GLOB-E404, GLOB-E-SESS re-auth modal preserving form state.
Verify: invited user completes AUTH-02 → lands DASH placeholder; DH deep-links an out-of-scope event URL → styled 403; deactivating a user kills their session on next request (RLS test extended).

**Step 17 — SSO configuration** 🔑
Tasks: human configures Google + Microsoft Entra OIDC in Supabase (dev + prod apps); wire buttons; document callback URLs in `/docs/runbook.md` (started here).
Verify: SSO round-trip with a test workspace account on preview.

**Step 18 — Admin: users, sites, departments**
Refs: App Flow ADM-01/02/03; Backend Schema §11.2 admin endpoints.
Tasks: Admin hub card grid; ADM-02 user table (invite modal, role+scope editing, deactivate with typed confirmation + reassignment warning stub); ADM-03 two-panel sites/departments with archive guards; all per T1/T2 templates and Guidelines specs.
Verify: invite → accept → new user appears with correct scope; archiving a site with an active event is blocked with the specced message.

**Step 19 — Theme, toasts, confirm service, empty/error state library**
Refs: Guidelines §7.5–7.6, §3.2–3.4; App Flow §3.
Tasks: global toast service (3-stack, timings per spec); ConfirmDialog wrapper implementing both tiers (simple + typed); `EmptyState` component with the three variants; error-page components; skeleton primitives. These become the only permitted primitives for later slices.
Verify: storybook-style `/dev/components` route renders each against design-system-preview.html; typed confirm disables until exact keyword.

## Phase 4 — Supplier directory & compliance

**Step 20 — Suppliers list & detail (Profile tab)** `[slice/04-suppliers]`
Refs: App Flow VND-01/02; Guidelines §13 worked example (implement it literally); Backend Schema vendors DDL + policies.
Tasks: T1 list (filters, trigram search endpoint-backed or direct read, status chips, compliance roll-up chips, archived toggle); VND-02 Profile tab; create/edit via `POST /api/vendors` (+ status transition endpoints with typed confirmations incl. the active-contracts warning).
Verify: seeded suppliers render with correct chips; DH sees only site-linked suppliers, read-only; archive/restore round-trip appears in audit log.

**Step 21 — Compliance taxonomy & rule sets admin**
Refs: App Flow ADM-06/07; Backend Schema compliance tables.
Tasks: rule-set list + editor (document types, mandatory toggle, max-age, vendor guidance); document-type management; snapshot-warning banner.
Verify: creating a rule set for "F&B — Food" and attaching mandatory HACCP appears in the seeded vendor's requirement computation.

**Step 22 — Vendor compliance tab & verification**
Refs: App Flow VND-02 Compliance; Backend Schema §11.2 verify endpoint; F7.3/F7.5.
Tasks: compliance tab rows (status chips incl. derived Expiring ≤60d), `verify` endpoint confirming expiry, "Request from vendor" issuing a `compliance_upload` token + email stub (email sending real in Phase 12; until then, log + copy-link).
Verify: verifying a doc updates rollup via trigger; requesting a doc creates a token row + access-log on use (tested in Phase 7).

**Step 23 — CSV import (basic)**
Refs: F2.5; App Flow VND-01 import flow (basic: fixed template, validation report, no column-mapping UI yet — deferral list).
Tasks: `POST /api/orgs/import-vendors`: template download, upload → zod row validation → downloadable error report → commit valid rows.
Verify: 20-row fixture with 3 bad rows imports 17 + reports 3; re-import is idempotent on registration number.

**Step 24 — Slice E2E + tidy**
Tasks: Playwright: PM creates supplier → uploads nothing → compliance shows Missing → archive with typed confirm. Unit tests for import validation.
Verify: `test:e2e` green on preview.

## Phase 5 — Requirements

**Step 25 — Requirements list, raise, detail** `[slice/05-requirements]`
Refs: App Flow REQ-01/02; F3.1.
Tasks: T1 list scoped by role; raise modal/page (DH+PM); REQ-02 with status tracker component (the six plain-language stages) + comments thread (`event_comments` with `requirement_id`); decline endpoint with reason.
Verify: DH raises → PM notified (in-app stub) → decline shows reason prominently; DH sees only own/in-scope requirements.

**Step 26 — Convert-to-evaluation handoff**
Tasks: "Convert" action pre-filling the (not-yet-built) wizard route with requirement payload; requirement status → `converted` on event creation (wired fully in step 28).
Verify: deferred assertion noted; route contract typed in `shared/schemas`.

## Phase 6 — Evaluations: wizard & event shell

**Step 27 — Wizard W1–W4** `[slice/06-events]`
Refs: App Flow EVT-W1…W4; Guidelines T3 template; Backend Schema events DDL.
Tasks: T3 wizard shell (progress rail, sticky footer, per-step draft PATCH + 30s autosave per Guidelines §3.7); W1 details (requirement pre-fill honoured); W2 template pick + per-event criteria/weighting editing with live 100% total; W3 rule-set suggestion by category + edit; W4 questionnaire builder → `events.questionnaire` JSONB.
Verify: leave mid-wizard → resume from EVT-01 drafts; weighting ≠100 blocks Continue with the specced message.

**Step 28 — Wizard W5–W6 + open_event**
Refs: EVT-W5/W6; Backend Schema §9.4, §11.2 invite/open.
Tasks: W5 vendor picker (directory filter + add-by-email creating prospective vendor) + deadline (timezone-explicit) + reminder preview; W6 review with snapshot-lock warning; `invite` endpoint (invitations + tokens issued, emails stubbed); `open` endpoint → `open_event()`.
Verify: opening writes both snapshots; editing the source template afterwards provably changes nothing in the event (snapshot test); requirement flips to Converted (closing step 26's loop).

**Step 29 — Events list + event detail Overview/Activity**
Refs: EVT-01/02/10; the J7 banner (App Flow Q17) with three equal buttons + `deadline-decision` endpoint.
Tasks: T1 list; EVT-02 status-adaptive overview incl. deadline countdown chips; DH summary variant (headline scores placeholder, comments/endorse panel); EVT-10 activity from audit slice.
Verify: forcing a seeded event past deadline with partial submissions shows the banner; each choice audits with class `action`.

**Step 30 — Submissions tab (pre-AI)**
Refs: EVT-03.
Tasks: per-vendor tracker table (extraction chips will animate in Phase 8 — statically correct now), resend-link action, "notify me when all ready" preference stub.
Verify: invited-not-submitted rows grey with invite status.

## Phase 7 — Vendor portal & submissions

**Step 31 — Token infrastructure & portal shell** `[slice/07-vendor-portal]`
Refs: Backend Schema §7.3, vendor tables; App Flow §5.
Tasks: token issue/hash/revoke/validate utilities + `vendor_access_log` writes; `/api/vendor/context`; VP-01 landing (deadline with timezone, effort estimate), VP-02 identity confirmation with the forwarding notice; VP-E1/E2 including rate-limited self-service re-issue.
Verify: expired token → VP-E1 → re-request → old token revoked, new works; every access logged; token from org A can never read org B (test).

**Step 32 — Submission stepper VP-03/04**
Tasks: T5 template, vertical stepper on mobile; company details pre-fill; questionnaire renderer from event JSONB (required markers, per-question guidance); per-step save + autosave with "Saved ✓".
Verify: mobile viewport (375px) completes both steps; resume mid-draft via same link lands on last step.

**Step 33 — Uploads VP-05/06**
Refs: F4.2; Backend Schema §10, §8.5; Guidelines §7.3 file rows.
Tasks: `documents` row → signed upload URL flow; drop zone with per-file progress/errors (specced copy); VP-06 compliance list from event snapshot with self-declared expiry, mandatory blocking vs advisory badges; compliance_upload-scoped token path reuses this (closing step 22).
Verify: 51 MB file rejected with exact message, batch unaffected; wrong MIME rejected; uploaded file lands at the §10 path convention.

**Step 34 — Review, submit & status page VP-07/08**
Tasks: review summary with incomplete-links; declaration; submit → `submitted`, receipt email stub, extraction jobs enqueued (workers arrive Phase 8 — jobs sit queued); VP-08 status page incl. cross-invitation list, compliance expiry warnings, reopen-edit banner path (`reopened` flow, PM permits via endpoint).
Verify: post-submit the same link renders VP-08; deadline passing mid-draft → preserved read-only banner; PM sees submission appear in EVT-03.

**Step 35 — Slice E2E**
Tasks: Playwright J3: invite → magic link → 5 steps on mobile profile → submit → status page. This becomes one of the two permanent E2E suites (Tech Stack §12).
Verify: green on preview against branch DB.

## Phase 8 — AI extraction pipeline

**GATE G3 — before step 37's first real API call: human provides `GEMINI_API_KEY`, confirms EU data-processing configuration status (Tech Stack §7.2 checkpoint) and a spend cap.** 🔑

**Step 36 — ai-service module + synthetic golden corpus** `[slice/08-extraction]`
Refs: Tech Stack §7; Backend Schema Decision #11; PRD AI-7; plan decision #7.
Tasks: `server/utils/ai/` — models config (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, thinking_level per task), zod response schemas, `extractTerms()` against the F5.1 key-term set with category-aware additions (F5.6); **generate the synthetic corpus**: ~20 fictional hospitality documents (proposals, contracts, certificates — varied layouts, 3 as image-based scans) with ground-truth JSON labels, committed under `tests/golden/`; `test:golden` harness computing field-level accuracy (mocked transport until G3 clears).
Verify: schema-parse failure path returns typed failure (never partial-silent); harness runs against mocks.

**Step 37 — Extraction worker & job flow**
Refs: Tech Stack §8; Backend Schema jobs + §9.3.
Tasks: `extract-document` Edge Function: pgmq pull → storage fetch → Gemini → `extracted_fields` rows (confidence, source refs, model/prompt versions) → jobs status; retry ×3 backoff; terminal failure → `failed_manual`; per-document chunking; enqueue-on-submit wired live.
Verify: seeded submission processes end-to-end locally; a corrupted file lands `failed_manual` without blocking siblings; `test:golden` now runs live — record baseline accuracy (target trajectory ≥90%, PRD AI-4; baseline documented, not gated yet).

**Step 38 — Realtime status chips**
Tasks: EVT-03 chips subscribe to `jobs` (filtered by submission); completion notification row ("n of m ready").
Verify: two browser windows — chips move Queued→Processing→Ready without refresh.

**Step 39 — Evaluation workspace EVT-04**
Refs: App Flow EVT-04 (T4 template); Guidelines §7.9.
Tasks: split view — pdfjs-dist viewer with text-layer highlight jump; fields panel grouped, low-confidence pinned, confidence chips, unconfirmed amber treatment; atomic confirm/edit endpoints; GLOB-E-CONC inline refresh; failed-manual mode (blank enterable fields + retry that never overwrites manual values — J8); mark-reviewed with 100%-or-override rule.
Verify: clicking a source link scrolls+highlights the passage; retry-after-manual test proves no overwrite; DH cannot reach this route (403).

**Step 40 — Vendor-facing progress & PM notification emails (stubs → queue)**
Tasks: `dispatch_notification` worker consuming queued notification jobs into `notifications` rows (email transport still stubbed to log until Phase 12).
Verify: completing all documents for a submission creates the specced notification with deep link.

**Step 41 — Slice E2E extension**
Tasks: extend J3 E2E: after submit, poll to Ready, PM confirms three fields, marks reviewed.
Verify: green; golden baseline re-recorded post any prompt tweak.
## Phase 9 — Scoring

**Step 42 — propose-scores worker** `[slice/09-scoring]`
Refs: F6.3; Tech Stack §7; Backend Schema criterion_scores.
Tasks: `propose-scores` job (enqueued when a submission is marked reviewed): reads confirmed fields + questionnaire + scoring snapshot → per-criterion 0–10 + evidence-citing rationale (model/prompt versions recorded); bias rule enforced in prompt policy (PRD AI-8 — evidence only, never vendor characteristics).
Verify: seeded reviewed submission produces scores with rationales referencing extracted values; golden-style spot assertions on 3 hand-labelled cases.

**Step 43 — Scoring screens EVT-06/07**
Refs: App Flow EVT-06 (criterion-first default), EVT-07; Guidelines §7.9 score displays.
Tasks: criterion rail + cross-vendor table, bulk-confirm with exceptions, override-with-reason endpoint (mandatory when differing, F6.4), live composite ranking sidebar; per-vendor scorecard tab; locked state until extraction reviewed ("scores are only as good as their evidence").
Verify: overriding shows "7 *(AI: 9)*" notation; ranking reorders live; lock releases only after mark-reviewed.

**Step 44 — DH summary view completion + endorsements**
Refs: App Flow EVT-02 DH variant; F6.6; masking Decision #7.
Tasks: DH summary now shows real headline scores; commercial masking honoured end-to-end (view-backed); endorse/comment panel with resolution.
Verify: RLS/masking test — DH with masked event sees no commercial values in any payload (API + direct read); toggling `mask_commercial_for_dh` off reveals them.

## Phase 10 — Comparison & approvals

**Step 45 — Comparison report EVT-08 + exports** `[slice/10-approvals]`
Refs: F8; App Flow EVT-08; Guidelines data rules §8.
Tasks: side-by-side view (column config, 2–10 vendors, sensitive-field masking toggle for DH-shared exports); AI executive summary block (flash-lite, labelled + editable per Guidelines §10.6); server-side PDF + XLSX export stamped with date/event ID + draft watermark when unconfirmed fields included.
Verify: export of a report containing one unconfirmed field carries the watermark; masked export contains zero commercial keys (string-scan the artefact).

**Step 46 — Approval thresholds admin ADM-08**
Refs: F9.1; Backend Schema approval_thresholds.
Tasks: threshold rows editor (GBP bands → role chains), reminder cadence, in-flight typed-confirmation warning.
Verify: editing thresholds with a pending request leaves that request's `route_snapshot` untouched (test).

**Step 47 — Approval flow EVT-09 (desktop + mobile)**
Refs: F9.2–9.4; App Flow EVT-09 + §7.1 mobile variant; Backend Schema approvals DDL/endpoints.
Tasks: create-request (package assembly, route from thresholds); step timeline; decision screen (single screen: recommendation, scores, terms, compliance, docs, three actions with mandatory comments for reject/changes); email deep-link → decision screen (one click TO, never OF, App Flow Q10); mobile sticky action bar layout; reminder job at cadence; on final approval: event → awarded, contract draft created, unsuccessful notifications queued for PM review before send.
Verify: J4 E2E on mobile profile: request-changes with comment → PM revises → approve → contract draft exists; FA who is not the assignee cannot decide (RLS + API test).

**Step 48 — Unsuccessful-vendor outcomes**
Refs: F4.5; Guidelines §10.4 exact copy; App Flow VP-08.
Tasks: PM review-and-send queue for outcome notifications; VP-08 statuses flip (neutral chip, formal register, no reasons).
Verify: vendor status page shows the exact specced copy; awarded vendor sees Awarded.

## Phase 11 — Contracts & alerts

**Step 49 — Contract register & detail** `[slice/11-contracts]`
Refs: F10; App Flow CON-01/02.
Tasks: T1 register (notice-deadline highlighted column, renewal-quarter filter, XLSX export); CON-02 (dates timeline with alert schedule, status transitions with typed-confirm on date edits post-alert); award-created drafts completed here.
Verify: seeded contract inside 30-day notice window renders warning highlight; date edit after an alert fires the typed confirmation.

**Step 50 — Legacy contract import with extraction**
Refs: F10.1; Decision #10 promotion.
Tasks: direct-create flow: upload → extraction job (reusing pipeline) → confirmation screen (same confidence/confirm pattern) → confirmed values promoted to real columns + `key_terms` JSONB.
Verify: fictional legacy PDF round-trips to an Active contract with computed `notice_deadline`.

**Step 51 — Alert engine live**
Refs: F10.3, F7.5; Backend Schema §9.5.
Tasks: activate `generate_alerts` + `send_due_alerts` + `send_deadline_reminders` cron jobs against notifications (email transport arrives next phase); "start re-evaluation" pre-filled wizard hand-off (F10.4).
Verify: time-travel test (adjust seeded dates): 120/90/60/30 rows generated idempotently, anchored on notice_deadline not end date; re-evaluation event pre-fills incumbent + category.

**Step 52 — Slice tests**
Tasks: unit tests for alert generation edge cases (no notice period, rolling contracts); J6 E2E happy path.
Verify: green.

## Phase 12 — Dashboards, actions & notifications

**Step 53 — Email transport live** 🔑 `[slice/12-dashboards]`
Refs: Tech Stack §3 (nodemailer 9.0.3), §11 env vars; App Flow §3.6; Guidelines §10.5 subject/body formulas.
Tasks: human provisions SMTP credentials (provider infra choice documented in runbook); nodemailer service with deliverability logging; wire ALL stubbed sends (invitations, magic links, receipts, reminders, approvals, alerts, outcomes) through the notification queue with per-user email preferences.
Verify: mailhog/local capture shows every template matching the §10.5 formulas with working deep links; unsubscribe/preference honoured.

**Step 54 — Dashboards DASH-01 (all four roles) + notification bell**
Refs: App Flow DASH-01, GLOB-N; F11.1, F11.3.
Tasks: role-adaptive T7 dashboards (PM stage counts, DH tracker cards, FA queue, OA usage + config warnings); cycle-time rolling average; bell dropdown (last 10 → ACT-01 link); Realtime on notifications.
Verify: each seeded role's dashboard matches its App Flow spec; new notification appears in bell without refresh.

**Step 55 — My Actions ACT-01 + first-run checklist ONB-01**
Refs: App Flow ACT-01, ONB-01.
Tasks: sectioned action queue (fixed order per spec) with deep links; OA setup checklist widget (4 items, auto-tick, dismissible, reappears from Admin hub); expired-internal-link landing behaviour (App Flow §2.4).
Verify: fresh org shows checklist progressing as steps complete; every ACT-01 row lands on its exact screen+panel.

## Phase 13 — Hardening & launch

**Step 56 — Full E2E, accessibility & state sweep** `[slice/13-hardening]`
Refs: Tech Stack §12; Guidelines §11; App Flow §8 state matrix.
Tasks: complete J2 golden-path E2E (requirement → award, all roles); axe-core automated pass on core screens + manual keyboard walk (focus visible, modals trapped, Esc rules); state-matrix sweep — script every screen's empty/loading/error/partial states against App Flow §8 and screenshot into `/docs/state-audit/`; `prefers-reduced-motion` check.
Verify: `test:e2e` green (J2 + J3 + J4); zero critical axe violations; state audit reviewed.

**Step 57 — Performance, security review & deferred-scope decision**
Refs: PRD N9–N13; Tech Stack §14; deferral list (Part B).
Tasks: P75 page-load check on seeded data (≤2s interactive, dashboard ≤3s); dependency audit (`pnpm audit` + prohibited-list grep); security checklist: service_role usage grep against the §7.4 legal list, secret scan, rate limits on public endpoints, signed-URL TTLs; human decides which deferral-list items (delegation, white-label, EVT-05, import polish) enter now vs post-pilot.
Verify: checklist file completed and committed; any red items fixed before G4.

**Step 58 — Production launch** — **GATE G4** 🔑
Refs: Tech Stack §13; PRD §13 M4.
Tasks: human reviews launch checklist; production env vars verified (EU regions, Gemini EU config status re-confirmed); production migration run; seed SYSTEM data only (no demo org in prod); DNS + `APP_BASE_URL`/`VENDOR_BASE_URL`; smoke suite against production; monitoring/status page; runbook completed (SSO callbacks, cron schedules, restore procedure per N13); tag `v1.0.0`.
Verify: human runs J2 + J3 E2E personally against production with a pilot-shadow org. **Launch.**

---

## Appendix — Recurring per-step checklist (Claude Code applies silently)
1. Branch named for the slice; PR early for preview.
2. Before UI work in a slice: re-read the relevant App Flow + Guidelines sections.
3. New tables/columns? STOP — schema changes need human approval (Backend Schema §1).
4. Every user-facing string: check Guidelines §9–10 (terminology, formulas, banned words).
5. Every new endpoint: zod in/out, role check, audit where semantic, error shape per §11.1.
6. `pnpm typecheck && pnpm lint && pnpm test` before every commit; slice E2E before merge.
7. Update `/docs/runbook.md` whenever a human-operated procedure is created.

*End of document. AI-assisted draft — review the gate placements and deferral list with the team before build kick-off; re-verify pinned versions (Tech Stack closing note) on day one.*
