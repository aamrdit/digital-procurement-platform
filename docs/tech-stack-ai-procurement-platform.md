# Tech Stack Document
## AI Procurement Intelligence Platform — Locked Dependencies & Architecture

| | |
|---|---|
| **Document status** | Draft v1.0 — for review, not approved |
| **Companion to** | PRD v1.0 · App Flow v1.0 (18/07/2026) |
| **Date** | 18/07/2026 |
| **Audience** | Claude Code (primary build agent) and human engineers |
| **Verification** | Every version below was verified against the live npm registry / official release channels on 18/07/2026 |

---

## 1. How Claude Code Must Use This Document

1. **Versions are LAW.** Install the exact versions in §3. No caret (`^`), no tilde (`~`), no `latest` tags, no silent upgrades. If a version conflict arises, STOP and surface it — do not resolve by upgrading.
2. **The Prohibited list (§14) is absolute.** Do not introduce any library, pattern, or version listed there, even if it appears in training data as a common pairing.
3. **Adding any dependency not in this document requires explicit human approval.** Propose it with rationale; do not install first.
4. `pnpm-lock.yaml` is committed and authoritative. `pnpm install --frozen-lockfile` in CI.
5. When generating code, prefer the idioms of the pinned major versions (e.g. Nuxt 4 directory conventions, Tailwind 4 CSS-first config, Zod 4 API) — not older patterns from earlier majors.

---

## 2. Stack Summary & Decision Rationale

| Layer | Choice | Why (one line) |
|---|---|---|
| Framework | **Nuxt 4** (Vue 3) | The Vue meta-framework: file-based routing, server routes (Nitro) for secret-bearing API calls, first-class Vercel preset. ("App Router" is Next.js terminology — Nuxt is the Vue equivalent.) |
| Database + Auth + Storage | **Supabase** (Postgres, RLS, Auth, Storage, Queues, Edge Functions) | One platform for data, row-level security, SSO auth, document storage, and background jobs. EU-hosted. |
| Hosting | **Vercel** (Pro plan assumed) | Native Nuxt support, EU regions, preview deployments. |
| AI | **Google Gemini API** via `@google/genai` | Native PDF/scanned-document multimodality removes the OCR dependency entirely; GA models only. |
| UI | **Tailwind CSS 4 + PrimeVue 4** | PrimeVue's enterprise DataTable is the workhorse for this table-heavy app; deliberately on the mature 4.x line, not the days-old 5.0. |
| Language | **TypeScript 5.9 (strict)** | Deliberately NOT TypeScript 7 — too new for full ecosystem support; maximum Claude Code familiarity is on 5.x. |

All choices satisfy the constraint: established libraries (>2 years old, >10k GitHub stars) unless no well-established alternative exists in this stack's ecosystem (exceptions noted inline: Nuxt/PrimeVue first-party modules and the official Google SDK, which are the canonical choices for their platforms).

---

## 3. Master Version Lock Table

**Runtime & package management**

| Dependency | Exact version | Notes |
|---|---|---|
| Node.js | **24.18.0** | Active LTS line (EOL 30/04/2028). Enforced via `.nvmrc` + `engines`. |
| pnpm | **11.14.0** | Enforced via `packageManager` field (Corepack). npm/yarn prohibited. |
| TypeScript | **5.9.3** | Strict mode. TS 7.x prohibited (§14). |

**Framework & state**

| Dependency | Exact version |
|---|---|
| nuxt | **4.4.8** |
| vue | **3.5.40** |
| vue-router | **5.2.0** |
| pinia | **4.0.2** |
| @pinia/nuxt | **1.0.1** |

**UI**

| Dependency | Exact version | Notes |
|---|---|---|
| tailwindcss | **4.3.3** | CSS-first config (`@theme` in CSS); no `tailwind.config.js` content array. |
| @tailwindcss/vite | **4.3.3** | The Tailwind 4 integration path for Nuxt (added as a Vite plugin in `nuxt.config.ts`). Do NOT use `@nuxtjs/tailwindcss` (Tailwind 3-era module). |
| primevue | **4.5.5** | Pinned to mature 4.x. PrimeVue 5.0.0 exists but is newly released — prohibited (§14). |
| @primevue/nuxt-module | **4.5.5** | Must match primevue minor. |
| @primevue/themes | **4.5.4** | Aura preset as base theme. |
| primeicons | **8.0.0** | |

**Data, auth & backend**

| Dependency | Exact version | Notes |
|---|---|---|
| @nuxtjs/supabase | **2.0.9** | Manages `@supabase/ssr` internally (its own dependency, `^0.10.x`) — do not add `@supabase/ssr` separately. |
| @supabase/supabase-js | **2.110.7** | Pinned explicitly (satisfies the module's `^2.106.0` requirement). |
| zod | **4.4.3** | All API input/output validation. Zod 4 API idioms. |
| nodemailer | **9.0.3** | Transactional email over SMTP; provider (e.g. Postmark) is infrastructure config, not a dependency. |

**AI**

| Dependency | Exact version | Notes |
|---|---|---|
| @google/genai | **2.12.0** | The official unified Google Gen AI SDK. Do NOT use the deprecated `@google/generative-ai`. |

**Documents, charts & utilities**

| Dependency | Exact version | Notes |
|---|---|---|
| pdfjs-dist | **6.1.200** | Document viewer (EVT-04 split view) incl. text-layer highlighting. |
| chart.js | **4.5.1** | Dashboard visualisations. |
| vue-chartjs | **5.3.4** | Vue wrapper for chart.js. |
| @vueuse/core | **14.3.0** | Composition utilities. |
| @vueuse/nuxt | **14.3.0** | |
| date-fns | **4.4.0** | All date logic; DD/MM/YYYY display formatting. moment.js prohibited. |
| vee-validate | **4.15.1** | Form validation (pairs with zod via `@vee-validate/zod` at the same 4.15.1). |

**Testing & quality (devDependencies)**

| Dependency | Exact version | Notes |
|---|---|---|
| vitest | **4.1.10** | Unit + component tests. |
| @nuxt/test-utils | **4.0.3** | Nuxt-aware test environment. |
| @vue/test-utils | **2.4.11** | |
| happy-dom | **20.10.6** | Test DOM environment. |
| @playwright/test | **1.61.1** | E2E — in scope for the golden path (J2) and vendor submission (J3) only in v1. |
| eslint | **9.39.5** | Deliberately 9.x, not 10.x (§14). |
| @nuxt/eslint | **1.16.0** | Flat config; supports ESLint 9. |
| eslint-config-prettier | **10.1.8** | |
| prettier | **3.9.5** | |

**Platform services (not npm — versions/config pinned here)**

| Service | Pin | Notes |
|---|---|---|
| Supabase Postgres | **17** (project default) | EU region: **eu-west-2 (London)** per N2. |
| Supabase Auth | Platform-managed | Google + Microsoft Entra SSO (F1.4). SAML SSO requires a paid Supabase plan — flagged as a plan dependency. |
| Supabase Storage | Platform-managed | All vendor documents; private buckets only; access via signed URLs with RLS-checked issuance. |
| Supabase Queues (pgmq) + pg_cron | Platform extensions | Background job backbone (§8). |
| Supabase Edge Functions | Deno runtime (platform-managed) | Long-running extraction workers. |
| Vercel | Pro plan | Region: **lhr1 (London)** primary. Nitro preset: `vercel`. |
| Gemini API | Models pinned in §7 | EU data-processing configuration required — compliance checkpoint before GA (PRD N1/N2). |

---

## 4. Runtime & Tooling Configuration

- **`.nvmrc`:** `24.18.0`
- **`package.json`:**
  - `"packageManager": "pnpm@11.14.0"`
  - `"engines": { "node": "24.18.0", "pnpm": "11.14.0" }`
  - All dependency versions written exactly (no range operators). CI runs `pnpm install --frozen-lockfile`.
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. Nuxt-generated tsconfig extended, never replaced.
- **ESLint:** flat config via `@nuxt/eslint`; `eslint-config-prettier` last in the chain. Prettier owns formatting; ESLint owns correctness. No style rules in ESLint.

## 5. Framework Architecture (Nuxt 4)

- **Single codebase, single Vercel deployment** (Q3 decision). Route groups separate the shells:
  - `app/pages/(internal)/…` → internal app (sidebar shell layout)
  - `app/pages/vendor/…` → vendor portal (minimal shell layout)
  - Middleware enforces shell boundaries server-side (App Flow §2.1; PRD N4) — route middleware + server-side session checks on every API route. Vendor sessions can never resolve internal routes.
- **Rendering mode:** SSR enabled (default). Internal app pages may opt into client-only rendering where SSR adds nothing (e.g. EVT-04 workspace); vendor portal and auth pages stay SSR for first-paint speed.
- **Server routes (Nitro, `server/api/…`):** ALL secret-bearing calls live here — Gemini calls, Supabase `service_role` operations, email sending. **No AI or admin-privileged call is ever made from the browser.**
- **State:** Pinia stores per domain (`useEventStore`, `useVendorStore`, …). Server state fetched via Nuxt's `useFetch`/`$fetch` (built on ofetch — axios prohibited).
- **Key directories:**

```
app/
  assets/css/main.css        # Tailwind 4 @theme tokens
  components/                # PascalCase, domain-grouped
  composables/
  layouts/  internal.vue · vendor.vue · auth.vue
  middleware/                # auth, role-scope, shell-boundary
  pages/
server/
  api/                       # Nitro routes (zod-validated)
  utils/ai/                  # ai-service abstraction (§7)
  utils/db/                  # supabase server clients
shared/
  types/                     # DB + domain types (generated + hand-written)
  schemas/                   # zod schemas shared client/server
supabase/
  migrations/                # SQL migrations (source of truth for schema)
  functions/                 # Edge Functions (extraction worker)
tests/  unit/ · e2e/
```

## 6. UI Layer Rules

- **Tailwind 4:** design tokens in `main.css` under `@theme`; utility-first; no CSS modules, no styled-components equivalents, no runtime CSS-in-JS.
- **PrimeVue 4:** the component vocabulary — DataTable (all list screens), Dialog, Stepper (event wizard, vendor submission), Toast, ConfirmDialog (§3.5 App Flow confirmation tiers), Menu, Badge/Tag (status chips), FileUpload (customised for GLOB-E-UPL per-file errors). Theme: Aura preset restyled with brand tokens via the PrimeVue 4 `definePreset` API.
- **One component library.** Do not mix in Nuxt UI, Vuetify, shadcn-vue, Element Plus, or headless duplicates of things PrimeVue provides.
- Icons: primeicons only.
## 7. AI Layer

### 7.1 Models (pinned — no aliases)

| Task class | Model ID (exact) | Rationale |
|---|---|---|
| Extraction, scoring, compliance checks, comparison summaries | **`gemini-3.5-flash`** | GA since 19/05/2026; frontier-class document/agentic performance at Flash pricing; 1M-token context comfortably fits a full submission set. |
| Lightweight tasks (classification, short summaries, notification copy) | **`gemini-3.1-flash-lite`** | Cheapest current-generation tier for high-volume, low-stakes calls. |

Rules:
- **Never** use rolling aliases (`gemini-flash-latest`, `-preview` models) in any environment including dev — silent model drift invalidates the golden test set (PRD AI-7).
- `thinking_level` is set explicitly per task type (Gemini 3.5 API): `"high"` for extraction and scoring, `"minimal"` for lightweight tasks. Never rely on the default.
- Model IDs live in one config file (`server/utils/ai/models.ts`). Changing a model = a PR that re-runs the golden test set.

### 7.2 The abstraction layer (PRD AI-5)

- All Gemini access goes through `server/utils/ai/` — an internal `ai-service` module exposing task-shaped functions (`extractTerms()`, `proposeScores()`, `checkCompliance()`, `summariseComparison()`), each returning zod-validated structured output.
- The module wraps `@google/genai` 2.12.0. Nothing outside `server/utils/ai/` imports the SDK. Gemini is the launch *provider*, not the *architecture* — swapping providers touches one directory.
- Structured output: Gemini JSON mode with response schemas mirrored by zod parsing on receipt. A response that fails schema validation is a failed extraction (GLOB-E-AI path), never a silently-accepted malformed one.
- **Data boundaries (PRD AI-6):** documents are sent per-request only; no fine-tuning, no cross-org context. EU data-processing configuration for the Gemini API is a **pre-GA compliance checkpoint** — verify Google's current data-residency terms against PRD N1/N2 before launch.

### 7.3 Documents & OCR

- **No OCR dependency.** Gemini processes PDFs (native and scanned) and images directly (Q6 decision). Tesseract and all OCR libraries are prohibited (§14).
- Upload flow: browser → Nitro route (validates type/size per F4.2) → Supabase Storage (private bucket) → job enqueued (§8). Files are streamed to Gemini from the server via the SDK's file API; raw documents never transit the browser-to-Gemini path.
- Frontend viewing: `pdfjs-dist` renders documents in EVT-04 with text-layer coordinates used for source-passage highlighting (F5.3).

## 8. Background Jobs (the 10-minute extraction problem)

Vercel functions are not the place for long-running AI work. Architecture (Q2 decision, designed to Pro-tier limits):

1. **Enqueue:** upload completion inserts one job **per document** (chunked — not per submission) into Supabase Queues (pgmq), plus a `jobs` table row for observable status.
2. **Process:** a Supabase Edge Function worker, invoked on schedule by pg_cron (and optionally on-demand via webhook after enqueue), pulls jobs, calls the ai-service extraction path, writes `extracted_fields` rows with confidence values.
3. **Progress:** workers update `jobs.status` (`queued → processing → ready | failed`) per document; submission-level status is derived. The EVT-03 status chips subscribe via **Supabase Realtime** — no polling.
4. **Completion:** when all documents in a submission resolve, a notification row is created (in-app) and email dispatched ("4 of 9 submissions ready for review" — App Flow Q15).
5. **Failure:** per-document retry (max 3, exponential backoff); terminal failure → `Failed–Manual` state (GLOB-E-AI). Retries never overwrite human-entered values (J8 rule).

This satisfies PRD N10 (≤10 min per 100-page set) via parallel per-document jobs, with zero long-running Vercel functions.

## 9. Database Conventions (Supabase Postgres 17)

- **Migrations are the source of truth:** SQL files in `supabase/migrations/`, applied via Supabase CLI; no dashboard-only schema changes.
- **RLS on every table, no exceptions.** Policies encode the role/site/department scoping (PRD F1.2–F1.3, App Flow §2.2). The `service_role` key exists only in server env and only for system operations (job workers, audit writes).
- **Type safety:** `supabase gen types typescript` output committed to `shared/types/database.ts`; regenerated in the same PR as any migration.
- Core entities per PRD §10; append-only `audit_entries` (inserts via trigger + server routes; UPDATE/DELETE revoked at the grant level).
- Template/rule-set **snapshots** stored as versioned JSONB on the event row at open time (PRD §10 snapshot model).

## 10. Auth Model

- Supabase Auth: OIDC for Google Workspace + Microsoft Entra (F1.4); email+password fallback with MFA (TOTP) enforced for non-SSO users.
- **Vendor magic links (F4.1):** implemented as scoped, single-purpose tokens in our own `vendor_access_tokens` table (hashed, expiring, event+vendor scoped) — NOT Supabase's generic magic-link auth, which would create full user accounts vendors must never have. Access is logged per App Flow Q16 (forwarding allowed, recorded).
- Sessions: `@nuxtjs/supabase` SSR cookie handling; server routes re-verify on every request (never trust client-asserted role).

## 11. Environment Variables (complete set)

| Variable | Scope | Purpose |
|---|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | public | Client SDK |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Workers, audit, admin ops |
| `GEMINI_API_KEY` | server only | ai-service |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | server only | nodemailer |
| `EMAIL_FROM` | server only | Sender identity |
| `APP_BASE_URL` / `VENDOR_BASE_URL` | public | Deep links, magic links |
| `NUXT_SESSION_PASSWORD` | server only | Session encryption |

Rules: no secret ever prefixed `NUXT_PUBLIC_`; `.env.example` committed; real values in Vercel/Supabase env stores only.

## 12. Testing & Quality Gates

- **Unit/component:** Vitest + @nuxt/test-utils + happy-dom. Coverage gate: ai-service parsing, zod schemas, RLS-adjacent server routes, scoring maths (weighting totals).
- **E2E (Playwright):** two flows only in v1 — golden path J2 (requirement → award) and vendor submission J3, both against a seeded Supabase branch database.
- **Golden test set (PRD AI-7):** a Vitest-driven harness scoring extraction accuracy against the labelled corpus; runs on any change to `server/utils/ai/` or model config; regression >2% blocks merge.
- CI order: typecheck → lint → unit → build → E2E (main branch) → golden set (on ai paths).

## 13. Hosting & Deployment (Vercel)

- Nitro preset `vercel`; primary region `lhr1` (London). Preview deployments per PR with a Supabase branch database.
- Production protections: `main` branch only, required CI green, environment-variable promotion via Vercel envs (no secrets in repo).
- Cron-style needs (reminder schedules T-7/3/1, expiry alerts 120/90/60/30) run on **pg_cron in Supabase**, not Vercel crons — alerts are data-driven and belong beside the data.

## 14. PROHIBITED — Do Not Use (Claude Code: treat as hard constraints)

| Prohibited | Use instead | Why |
|---|---|---|
| TypeScript 7.x | TypeScript 5.9.3 | Brand-new major; ecosystem/tooling not fully aligned |
| ESLint 10.x | ESLint 9.39.5 | Same reason |
| PrimeVue 5.x / @primevue/nuxt-module 5.x | 4.5.5 line | Released days ago; unproven |
| `@nuxtjs/tailwindcss` module | `@tailwindcss/vite` plugin | Tailwind 3-era module; wrong integration for Tailwind 4 |
| `@google/generative-ai` (deprecated SDK) | `@google/genai` 2.12.0 | Superseded official SDK |
| Rolling model aliases (`gemini-flash-latest`, any `-preview`) | Pinned GA model IDs (§7.1) | Silent model drift breaks the golden test set |
| axios, node-fetch, got | Nuxt `$fetch` / `useFetch` | Built-in, SSR-aware |
| moment.js, dayjs, luxon | date-fns 4.4.0 | One date library |
| Tesseract / any OCR lib | Gemini native document input | Redundant dependency |
| Nuxt UI, Vuetify, Element Plus, shadcn-vue, Quasar | PrimeVue 4 | One component library |
| Supabase generic magic-link auth for vendors | Custom scoped tokens (§10) | Vendors must not become full auth users |
| `localStorage`/`sessionStorage` for auth or drafts | Supabase SSR cookies; DB-backed drafts | Security + App Flow autosave model |
| npm / yarn / bun | pnpm 11.14.0 | One lockfile format |
| Version ranges (`^`, `~`, `>=`, `latest`) | Exact pins | The entire point of this document |
| Prisma, Drizzle, TypeORM | Supabase client + SQL migrations | RLS-first architecture; an ORM obscures policies |
| Redis / BullMQ | Supabase Queues (pgmq) + pg_cron | No extra infrastructure |

## 15. Upgrade Policy

- Dependency review monthly; security patches applied within the pinned major/minor lines via explicit PR (still exact pins).
- Any AI model or prompt change re-runs the golden test set before merge (PRD AI-7).
- Majors quarantined: new majors (e.g. PrimeVue 5, TS 7) are candidates only after ≥3 months of ecosystem maturity and a spike branch.

---

*End of document. AI-assisted draft — versions verified against the npm registry and official release channels on 18/07/2026; re-verify on the day the repository is initialised, and have engineering review before this becomes the build contract.*
