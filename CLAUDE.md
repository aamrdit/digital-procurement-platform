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
- Every migration is a file in `supabase/migrations/`, regenerate types in the same PR.
- Design tokens only — no raw hex/px in components (Guidelines §1.2). Copy follows the microcopy formulas (Guidelines §10).
- Never commit secrets. Steps marked 🔑 require a human to provision environment values first.
- A step is DONE only when its Verify block passes. Failing verification BLOCKS progression — fix before moving on.
- Real personal data never enters the codebase, seeds, or tests — fictional placeholder data only.

## Conventions quick card
pnpm scripts: `dev` · `build` · `typecheck` · `lint` · `test` (vitest) · `test:e2e` (playwright) · `test:rls` · `test:golden` · `db:migrate` · `db:types` · `db:seed`.
Branching: one branch per slice (`slice/06-vendor-portal`), PR → Vercel preview + Supabase branch DB, squash-merge to `main`. Commits: conventional (`feat:`, `fix:`, `chore:`).
Directory layout: Tech Stack §5. Component naming: PascalCase, domain-grouped.
