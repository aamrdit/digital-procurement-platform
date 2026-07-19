# Backend Schema Document
## AI Procurement Intelligence Platform — Database, Auth, RLS, API

| | |
|---|---|
| **Document status** | Draft v1.0 — for review, not approved |
| **Companion to** | PRD v1.0 · App Flow v1.0 · Tech Stack v1.0 · Content Guidelines v1.0 |
| **Date** | 18/07/2026 |
| **Target platform** | Supabase Postgres 17, EU (London) · per Tech Stack §3 |
| **Audience** | Claude Code (primary implementer) and human engineers |

---

## 1. How Claude Code Must Use This Document

1. **DDL is the contract.** Tables, columns, constraints, and policies here are implemented exactly. Renames, type changes, or "improvements" require human approval.
2. **Migrations only** — every schema change is a SQL file in `supabase/migrations/`, applied in the order given in §13. No dashboard edits (Tech Stack §9).
3. **RLS is the security boundary, the API is the workflow boundary.** Never bypass either: no `service_role` in a code path that acts on behalf of a user (§7.4), no client-side write to any table (§11.1).
4. Anything not specified: STOP and ask. In particular, never invent a new table, column, or policy to work around a constraint.

## 2. Decisions Summary (the 20 answers)

| # | Decision |
|---|---|
| 1 | Single Supabase project; shared tables; isolation by `org_id` + RLS on every table. |
| 2 | One org containing sites; `sites.legal_entity` optional text label. Org hierarchy is a v2 migration if ever needed. **Resolves PRD open question Q4.** |
| 3 | `user_roles` join table — users can hold multiple roles (PM + OA). |
| 4 | Vendors never enter `auth.users`. Vendor portal access = scoped tokens (§7.3); all vendor data access is server-mediated. |
| 5 | Department Head scope = their sites **AND** their departments (intersection). |
| 6 | Finance Approver sees: approvals routed to them, contracts (read), and events that have ever entered approval (read). |
| 7 | Commercial masking for DHs = per-event toggle (`events.mask_commercial_for_dh`, default true), enforced at the API/view layer (§8.6), not column RLS. |
| 8 | `vendors.global_vendor_id uuid NULL` reserved now; unused until Phase 2 dedup. |
| 9 | One private storage bucket `documents`; path convention + storage policies (§10). |
| 10 | Extraction = EAV rows (`extracted_fields`); confirmed values are **promoted to real columns** on `contracts` at award/import time, where date/value queries live. |
| 11 | Every AI output row records `model_id` + `prompt_version`. Mandatory, NOT NULL. |
| 12 | One Edge Function worker per job type: `extract-document`, `propose-scores`, `dispatch-notifications`. |
| 13 | Audit = row-level triggers (class `mutation`) + explicit semantic writes from API routes (class `action`), one table. |
| 14 | Scoring/compliance snapshots = JSONB on the event row, written by `open_event()` (§9.4). |
| 15 | Retention: `retention_policies` table + `apply_retention()` function exist in v1; executed manually, pg_cron wiring is Phase 2. |
| 16 | Magic links = token **history** table; issuing a new token revokes prior ones; every access logged. |
| 17 | RPC-ish resource endpoints; ~30 specced in §11 + pattern rulebook for the rest. |
| 18 | Client reads may hit Postgres directly through RLS; **all writes go through Nitro routes**. |
| 19 | Realtime limited to `jobs` and `notifications`. |
| 20 | Full SQL DDL + full SQL policies for core tables, explicit pattern for the rest. |

## 3. Architecture Overview

```
Browser (internal user, SSO session)
  ├── READS ────────────────► Postgres (anon key + RLS)      [Q18]
  └── WRITES ──► Nitro /api/* ──► Postgres (user-scoped client, RLS still on)
                     │
                     ├── semantic audit writes
                     ├── zod validation, state machines
                     └── enqueue jobs ──► pgmq ──► Edge Function workers
                                                     └── Gemini (ai-service)
Vendor browser (no auth user)
  └── ALL access ──► Nitro /api/vendor/* ──► token check (§7.3) ──► service_role, scoped queries
```

Two Postgres access modes from Nitro:
- **User-scoped client** (default): forwards the caller's JWT; RLS applies. Used for every internal-user action.
- **`service_role` client** (exceptional): job workers, audit trigger support, vendor-portal routes (after token validation), system alert generation. Each use is enumerated in this document; no others permitted.

## 4. Entity-Relationship Overview

```
orgs ─┬─ sites ──────────────┐
      ├─ departments         │
      ├─ profiles ─ user_roles / user_site_scopes / user_department_scopes
      ├─ vendors ─┬─ vendor_contacts
      │           ├─ vendor_category_links ── vendor_categories (org taxonomy)
      │           ├─ vendor_compliance_documents ── compliance_document_types
      │           └─ vendor_access_tokens
      ├─ compliance_rule_sets ── compliance_rules
      ├─ scoring_templates ── scoring_criteria
      ├─ requirements ──(0..1)── events
      ├─ events ─┬─ event_sites (join to sites)
      │          ├─ event_invitations ── vendors
      │          ├─ vendor_submissions ─┬─ documents
      │          │                      ├─ extracted_fields
      │          │                      └─ criterion_scores
      │          ├─ event_comments
      │          └─ approval_requests ── approval_steps
      ├─ contracts ─┬─ contract_sites
      │             └─ alerts
      ├─ approval_thresholds
      ├─ notifications
      ├─ jobs
      ├─ retention_policies
      └─ audit_entries (append-only)
```

## 5. Conventions

- **IDs:** `uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Tenancy:** every table has `org_id uuid NOT NULL REFERENCES orgs(id)` (except `orgs` itself and `audit_entries` child rows which still carry it). All composite indexes lead with `org_id`.
- **Timestamps:** `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (touch trigger §9.1). Display formatting (DD/MM/YYYY) is a frontend concern; storage is UTC.
- **Statuses:** `text` + `CHECK` constraints, never Postgres enums (enums resist migration). Status values match App Flow/Content Guidelines exactly.
- **Archive-everything:** `archived_at timestamptz NULL` instead of DELETE (App Flow §3.5). Hard DELETE is revoked from application roles on all tables except where noted.
- **Money:** `numeric(14,2)` + `currency char(3) NOT NULL DEFAULT 'GBP'`. Indicative GBP conversion computed at display time, never stored as fact.
- **Naming:** snake_case; join tables `a_b_links` or `a_b_scopes`; code entity names per Content Guidelines §9.2 (`vendor`, `event` — UI translation happens in the frontend).

---

## 6. Full DDL

> Ordered for dependency-safe migration (§13). `-- RLS: <pattern>` comments reference §8 patterns.

### 6.1 Identity & tenancy

```sql
-- 001_orgs.sql
CREATE TABLE orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_path text,
  default_currency char(3) NOT NULL DEFAULT 'GBP',
  settings jsonb NOT NULL DEFAULT '{}',        -- notification defaults, etc. (ADM-09)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,
  country char(2) NOT NULL DEFAULT 'GB',
  currency char(3) NOT NULL DEFAULT 'GBP',
  legal_entity text,                            -- Decision #2 (PRD Q4)
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,                           -- Kitchen, Bar, Housekeeping… (F1.6)
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- profiles mirrors auth.users 1:1 for internal users only (Decision #4)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id),
  full_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','active','deactivated')),
  email_preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE TABLE user_roles (                        -- Decision #3
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id),
  role text NOT NULL CHECK (role IN
    ('procurement_manager','department_head','finance_approver','org_admin')),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE user_site_scopes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id),
  site_id uuid NOT NULL REFERENCES sites(id),
  PRIMARY KEY (user_id, site_id)
);

CREATE TABLE user_department_scopes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id),
  department_id uuid NOT NULL REFERENCES departments(id),
  PRIMARY KEY (user_id, department_id)
);
```

Scope semantics: PMs, FAs, and OAs are org-wide by role; `user_site_scopes` / `user_department_scopes` bind **Department Heads** (Decision #5: a DH sees records matching at least one of their sites AND at least one of their departments). A PM row in `user_site_scopes` is permitted and acts as a *default filter preference*, never a security boundary.

### 6.2 Vendors & compliance

```sql
-- 002_vendors.sql
CREATE TABLE vendor_categories (                 -- org-editable taxonomy (F2.1)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,      -- seeded hospitality set
  archived_at timestamptz,
  UNIQUE (org_id, name)
);

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  legal_name text NOT NULL,
  trading_name text,
  registration_number text,
  country char(2) NOT NULL DEFAULT 'GB',
  status text NOT NULL DEFAULT 'prospective' CHECK (status IN
    ('prospective','under_evaluation','approved','active','suspended','archived')),
  suspension_reason text,
  compliance_rollup text NOT NULL DEFAULT 'at_risk' CHECK (compliance_rollup IN
    ('compliant','at_risk','non_compliant')),     -- maintained by trigger §9.3
  global_vendor_id uuid,                          -- Decision #8, reserved
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendors_org_status_idx ON vendors (org_id, status);
CREATE INDEX vendors_org_name_trgm ON vendors USING gin (legal_name gin_trgm_ops); -- F2.3 search

CREATE TABLE vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vendor_category_links (
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  category_id uuid NOT NULL REFERENCES vendor_categories(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  PRIMARY KEY (vendor_id, category_id)
);

CREATE TABLE vendor_site_links (                  -- "sites served"
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  site_id uuid NOT NULL REFERENCES sites(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  PRIMARY KEY (vendor_id, site_id)
);

CREATE TABLE compliance_document_types (          -- hospitality taxonomy (F7.2), org-editable
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,                             -- 'Public liability insurance', 'HACCP documentation'…
  requires_expiry boolean NOT NULL DEFAULT true,
  vendor_guidance text,                           -- shown in VP-06
  is_system boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  UNIQUE (org_id, name)
);

CREATE TABLE compliance_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,
  category_id uuid REFERENCES vendor_categories(id),  -- auto-suggestion key (EVT-W3)
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  rule_set_id uuid NOT NULL REFERENCES compliance_rule_sets(id) ON DELETE CASCADE,
  document_type_id uuid NOT NULL REFERENCES compliance_document_types(id),
  is_mandatory boolean NOT NULL DEFAULT true,     -- mandatory vs advisory (F7.1)
  max_age_months int,                             -- validity rule
  UNIQUE (rule_set_id, document_type_id)
);

CREATE TABLE vendor_compliance_documents (        -- vendor-level, lives beyond events (F2.2)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  document_type_id uuid NOT NULL REFERENCES compliance_document_types(id),
  storage_path text,                              -- NULL while 'missing'
  status text NOT NULL DEFAULT 'missing' CHECK (status IN
    ('missing','submitted','verified','expired')),-- 'expiring' derived from expires_on
  expires_on date,                                -- self-declared (VP-06), confirmed at verify
  self_declared_expires_on date,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, document_type_id)
);
CREATE INDEX vcd_expiry_idx ON vendor_compliance_documents (org_id, expires_on)
  WHERE status IN ('submitted','verified');       -- alert scans (§9.5)
```
### 6.3 Requirements, templates & events

```sql
-- 003_evaluation.sql
CREATE TABLE scoring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,
  category_id uuid REFERENCES vendor_categories(id),
  is_system boolean NOT NULL DEFAULT false,       -- 4 shipped templates (F6.1)
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE scoring_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  template_id uuid NOT NULL REFERENCES scoring_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scoring_guidance text,
  weighting numeric(5,2) NOT NULL CHECK (weighting > 0),
  position int NOT NULL DEFAULT 0
);
-- weightings-total-100 enforced at API layer + open_event() (§9.4), not per-row

CREATE TABLE requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES vendor_categories(id),
  department_id uuid REFERENCES departments(id),
  estimated_annual_value numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'GBP',
  needed_by date,
  status text NOT NULL DEFAULT 'raised' CHECK (status IN ('raised','converted','declined')),
  decline_reason text,
  raised_by uuid NOT NULL REFERENCES profiles(id),
  event_id uuid,                                   -- FK added after events exists
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requirement_sites (
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  PRIMARY KEY (requirement_id, site_id)
);

CREATE TABLE events (                              -- UI: "evaluation"
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES vendor_categories(id),
  requirement_id uuid REFERENCES requirements(id),
  department_id uuid REFERENCES departments(id),   -- for DH scoping (Decision #5)
  estimated_value numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','open','under_evaluation','shortlisted','in_approval','awarded','closed_no_award')),
  submission_deadline timestamptz,
  deadline_timezone text NOT NULL DEFAULT 'Europe/London',
  reminder_offsets int[] NOT NULL DEFAULT '{7,3,1}',        -- days before deadline (F3.5)
  scoring_snapshot jsonb,                          -- Decision #14, written by open_event()
  compliance_snapshot jsonb,
  questionnaire jsonb NOT NULL DEFAULT '[]',       -- W4 builder output
  mask_commercial_for_dh boolean NOT NULL DEFAULT true,     -- Decision #7 (F8.2)
  owner_id uuid NOT NULL REFERENCES profiles(id),
  awarded_vendor_id uuid REFERENCES vendors(id),
  opened_at timestamptz, awarded_at timestamptz, closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE requirements ADD CONSTRAINT requirements_event_fk
  FOREIGN KEY (event_id) REFERENCES events(id);
CREATE INDEX events_org_status_idx ON events (org_id, status);

CREATE TABLE event_sites (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  PRIMARY KEY (event_id, site_id)
);

CREATE TABLE event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  invited_contact_id uuid REFERENCES vendor_contacts(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  last_reminder_at timestamptz,
  withdrawn_at timestamptz,
  UNIQUE (event_id, vendor_id)
);

CREATE TABLE vendor_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','submitted','reopened','withdrawn')),
  extraction_status text NOT NULL DEFAULT 'queued' CHECK (extraction_status IN
    ('queued','processing','ready','failed_manual','reviewed')),  -- EVT-03 chips
  vendor_status text NOT NULL DEFAULT 'received' CHECK (vendor_status IN
    ('received','under_evaluation','shortlisted','unsuccessful','awarded')), -- VP-08 (F4.4)
  questionnaire_answers jsonb NOT NULL DEFAULT '{}',
  declaration_accepted_at timestamptz,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, vendor_id)
);

CREATE TABLE documents (                            -- all uploaded files (submission + contract + compliance)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  submission_id uuid REFERENCES vendor_submissions(id),
  contract_id uuid,                                 -- FK added in 004
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size <= 52428800),   -- 50 MB (F4.2)
  uploaded_by_kind text NOT NULL CHECK (uploaded_by_kind IN ('internal','vendor')),
  uploaded_by uuid,                                 -- profiles.id when internal
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE extracted_fields (                     -- Decision #10: EAV
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  submission_id uuid NOT NULL REFERENCES vendor_submissions(id),
  document_id uuid REFERENCES documents(id),
  field_key text NOT NULL,                          -- 'payment_terms','delivery_days',… (F5.1)
  field_group text NOT NULL DEFAULT 'commercial' CHECK (field_group IN
    ('commercial','delivery','legal','certifications')),      -- EVT-04 grouping; drives masking §8.6
  value_json jsonb,                                 -- typed value {type,value,unit?}
  confidence text CHECK (confidence IN ('high','medium','low')),  -- NULL = manual entry
  source_page int,
  source_excerpt text,                              -- highlight anchor (F5.3)
  status text NOT NULL DEFAULT 'unconfirmed' CHECK (status IN
    ('unconfirmed','confirmed','failed')),          -- 'failed' = GLOB-E-AI-P per-field
  confirmed_by uuid REFERENCES profiles(id),
  confirmed_at timestamptz,
  model_id text,  prompt_version text,              -- Decision #11; NULL only when manual
  CHECK (confidence IS NOT NULL OR (model_id IS NULL AND prompt_version IS NULL)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, field_key)
);

CREATE TABLE criterion_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  submission_id uuid NOT NULL REFERENCES vendor_submissions(id),
  criterion_key text NOT NULL,                      -- key within scoring_snapshot
  ai_score numeric(4,1) CHECK (ai_score BETWEEN 0 AND 10),
  ai_rationale text,
  model_id text, prompt_version text,               -- Decision #11
  confirmed_score numeric(4,1) CHECK (confirmed_score BETWEEN 0 AND 10),
  override_reason text,                             -- required by API when differing (F6.4)
  confirmed_by uuid REFERENCES profiles(id),
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, criterion_key)
);

CREATE TABLE event_comments (                       -- DH comments & endorsements (F6.6)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  submission_id uuid REFERENCES vendor_submissions(id),
  requirement_id uuid REFERENCES requirements(id),  -- also serves REQ-02 thread
  author_id uuid NOT NULL REFERENCES profiles(id),
  body text NOT NULL,
  is_endorsement boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 6.4 Approvals, contracts, alerts

```sql
-- 004_approvals_contracts.sql
CREATE TABLE approval_thresholds (                  -- ADM-08 (F9.1)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  max_value numeric(14,2),                          -- NULL = no upper bound
  step_roles text[] NOT NULL,                       -- e.g. '{procurement_manager,finance_approver}'
  reminder_after_days int NOT NULL DEFAULT 3,
  position int NOT NULL
);

CREATE TABLE approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  recommended_vendor_id uuid NOT NULL REFERENCES vendors(id),
  package jsonb NOT NULL,                           -- report snapshot + key terms (F9.2)
  route_snapshot jsonb NOT NULL,                    -- thresholds frozen at submission (ADM-08 in-flight rule)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','approved','rejected','changes_requested','withdrawn')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  request_id uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  position int NOT NULL,
  assigned_role text NOT NULL,
  assigned_user_id uuid REFERENCES profiles(id),    -- resolved assignee
  delegated_to uuid REFERENCES profiles(id),        -- F9.5
  decision text CHECK (decision IN ('approved','rejected','changes_requested')),
  comment text,                                     -- mandatory for reject/changes (API-enforced)
  decided_at timestamptz,
  UNIQUE (request_id, position)
);

CREATE TABLE contracts (                            -- Decision #10: confirmed values live here as real columns
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  event_id uuid REFERENCES events(id),              -- NULL for legacy imports (F10.1)
  name text NOT NULL,
  category_id uuid REFERENCES vendor_categories(id),
  value_annual numeric(14,2),
  currency char(3) NOT NULL DEFAULT 'GBP',
  starts_on date, ends_on date,
  notice_period_days int,
  notice_deadline date GENERATED ALWAYS AS
    (ends_on - COALESCE(notice_period_days,0)) STORED,       -- the binding date (F10.3)
  renewal_type text NOT NULL DEFAULT 'fixed' CHECK (renewal_type IN
    ('fixed','auto_renew','rolling')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','active','in_renewal','expired','terminated')),  -- 'expiring' derived
  termination_reason text,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  key_terms jsonb NOT NULL DEFAULT '{}',            -- confirmed extraction promotion
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documents ADD CONSTRAINT documents_contract_fk
  FOREIGN KEY (contract_id) REFERENCES contracts(id);
CREATE INDEX contracts_notice_idx ON contracts (org_id, notice_deadline)
  WHERE status IN ('active','in_renewal');

CREATE TABLE contract_sites (
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id),
  org_id uuid NOT NULL REFERENCES orgs(id),
  PRIMARY KEY (contract_id, site_id)
);

CREATE TABLE alerts (                               -- renewal + compliance expiry schedule (§9.5)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  kind text NOT NULL CHECK (kind IN ('contract_notice','compliance_expiry')),
  contract_id uuid REFERENCES contracts(id),
  compliance_document_id uuid REFERENCES vendor_compliance_documents(id),
  offset_days int NOT NULL,                         -- 120/90/60/30 · 90/60/30
  due_on date NOT NULL,
  sent_at timestamptz,
  UNIQUE (kind, contract_id, compliance_document_id, offset_days)
);
```

### 6.5 Access tokens, jobs, notifications, audit, retention

```sql
-- 005_platform.sql
CREATE TABLE vendor_access_tokens (                 -- Decision #16: history table
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  event_id uuid REFERENCES events(id),              -- NULL = compliance-upload scope (VND-02 "Request from vendor")
  contact_id uuid REFERENCES vendor_contacts(id),
  token_hash text NOT NULL UNIQUE,                  -- SHA-256; raw token only in the email
  purpose text NOT NULL DEFAULT 'submission' CHECK (purpose IN
    ('submission','compliance_upload')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,                           -- set when a newer token is issued
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vendor_access_log (                    -- App Flow Q16: forwarding allowed, logged
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  token_id uuid NOT NULL REFERENCES vendor_access_tokens(id),
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text, user_agent text
);

CREATE TABLE jobs (                                 -- UI mirror of pgmq (Tech Stack §8)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  kind text NOT NULL CHECK (kind IN ('extract_document','propose_scores','dispatch_notification')),
  submission_id uuid REFERENCES vendor_submissions(id),
  document_id uuid REFERENCES documents(id),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN
    ('queued','processing','ready','failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_submission_idx ON jobs (submission_id);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  class text NOT NULL CHECK (class IN ('action','warning','info')),  -- App Flow §3.6
  title text NOT NULL,
  deep_link text NOT NULL,                          -- App Flow §2.4
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, read_at, created_at DESC);

CREATE TABLE audit_entries (                        -- Decision #13; append-only (F12)
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid NOT NULL,
  class text NOT NULL CHECK (class IN ('mutation','action','auth','vendor_access')),
  actor_id uuid,                                    -- NULL for system/vendor
  actor_kind text NOT NULL DEFAULT 'user' CHECK (actor_kind IN ('user','vendor','system')),
  action text NOT NULL,                             -- 'events.stage_changed', 'scores.overridden'…
  entity_table text, entity_id uuid,
  before jsonb, after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE UPDATE, DELETE ON audit_entries FROM authenticated, anon, service_role; -- append-only

CREATE TABLE retention_policies (                   -- Decision #15 (N7)
  org_id uuid PRIMARY KEY REFERENCES orgs(id),
  contract_years int NOT NULL DEFAULT 7,
  unsuccessful_submission_years int NOT NULL DEFAULT 2
);
```
---

## 7. Authentication & Authorisation Flows

### 7.1 Internal user sign-in (F1.4)
1. AUTH-01 → Supabase Auth OIDC (Google Workspace / Microsoft Entra) or email+password (+ mandatory TOTP MFA, enforced at sign-in policy level).
2. On first accepted invitation (AUTH-02): Nitro `POST /api/auth/accept-invite` creates the `profiles` row, `user_roles`, and scopes from the invitation payload, and stamps `org_id` into `auth.users.raw_app_meta_data` — this is what RLS reads (§8.1). `app_metadata` is server-writable only; users cannot self-modify it.
3. Session: `@nuxtjs/supabase` SSR cookies. Every Nitro route re-derives the user server-side; role claims are **looked up, never trusted from the client**.
4. Deactivation (ADM-02): sets `profiles.status='deactivated'` AND calls Supabase admin API to revoke sessions — immediate revocation per F1.5. RLS helper `is_active_user()` gates every policy, so even a lingering token reads nothing.

### 7.2 Role resolution
Roles and scopes are database rows (`user_roles`, `user_*_scopes`), resolved by the SECURITY DEFINER helpers in §8.1 on each query. No role information lives in the JWT except `org_id` — roles change take effect on the next query, no re-login needed.

### 7.3 Vendor magic-link flow (F4.1, Decision #4/#16)
1. Invitation/re-request → Nitro generates 32-byte random token; stores SHA-256 in `vendor_access_tokens`; **revokes prior active tokens** for the same vendor+event; emails raw token link (`{VENDOR_BASE_URL}/e/{token}`).
2. Every vendor request hits `/api/vendor/*`: Nitro hashes the presented token, looks up an unexpired, unrevoked row, writes `vendor_access_log`, then performs the operation with the `service_role` client **hard-scoped in code to that token's `vendor_id` (+ `event_id` when purpose = submission)**. No vendor query may take an id from the request body as its scope — scope comes from the token row only.
3. Expiry: tokens live 30 days, sliding — VP-08 revisits re-issue transparently. Expired → VP-E1 self-service re-request (rate-limited: 3/hour/contact).
4. Vendors therefore have **zero Postgres presence**: no auth user, no RLS role. The entire vendor surface is these routes.

### 7.4 service_role usage — the complete legal list
Edge Function workers (jobs) · vendor portal routes (§7.3) · alert generation (§9.5) · invitation acceptance (§7.1.2) · retention execution (§9.6). Any other use is a defect.

---

## 8. Row-Level Security

RLS is ENABLEd and FORCEd on **every** table in §6. Client reads use these policies directly (Decision #18); writes also pass through them (Nitro forwards the user JWT).

### 8.1 Helper functions (one migration, `010_rls_helpers.sql`)

```sql
CREATE SCHEMA IF NOT EXISTS authz;

CREATE FUNCTION authz.org_id() RETURNS uuid
LANGUAGE sql STABLE AS
$$ SELECT (auth.jwt()->'app_metadata'->>'org_id')::uuid $$;

CREATE FUNCTION authz.is_active_user() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM profiles
   WHERE id = auth.uid() AND status = 'active') $$;

CREATE FUNCTION authz.has_role(r text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM user_roles
   WHERE user_id = auth.uid() AND role = r) $$;

CREATE FUNCTION authz.my_site_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT site_id FROM user_site_scopes WHERE user_id = auth.uid() $$;

CREATE FUNCTION authz.my_department_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT department_id FROM user_department_scopes WHERE user_id = auth.uid() $$;

-- Decision #5: DH sees an event iff site-match AND department-match
CREATE FUNCTION authz.dh_can_see_event(e_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (
     SELECT 1 FROM events ev
     WHERE ev.id = e_id
       AND ev.department_id IN (SELECT authz.my_department_ids())
       AND EXISTS (SELECT 1 FROM event_sites es
                   WHERE es.event_id = e_id
                     AND es.site_id IN (SELECT authz.my_site_ids())) ) $$;

-- Decision #6: FA read access to events that have ever entered approval
CREATE FUNCTION authz.fa_can_see_event(e_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM approval_requests WHERE event_id = e_id) $$;
```

### 8.2 The four policy patterns

| Pattern | Definition | Applied to |
|---|---|---|
| **P1 org-member read** | `org_id = authz.org_id() AND authz.is_active_user()` | reference data: sites, departments, vendor_categories, compliance_document_types, scoring_templates(+criteria), compliance_rule_sets(+rules), approval_thresholds, profiles (name/role columns via view) |
| **P2 role-gated read** | P1 AND role/scope predicate | events & children, vendors, contracts, requirements |
| **P3 writes = PM/OA** | P1 AND `(authz.has_role('procurement_manager') OR authz.has_role('org_admin'))` — plus API state machines | most INSERT/UPDATE |
| **P4 self-only** | `user_id = auth.uid()` | notifications, email_preferences |

### 8.3 Core policies in full (representative — Claude Code replicates the pattern)

```sql
-- events -----------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

CREATE POLICY events_select ON events FOR SELECT USING (
  org_id = authz.org_id() AND authz.is_active_user() AND (
       authz.has_role('procurement_manager')
    OR authz.has_role('org_admin')
    OR (authz.has_role('department_head') AND authz.dh_can_see_event(id))
    OR (authz.has_role('finance_approver') AND authz.fa_can_see_event(id))
  ));

CREATE POLICY events_insert ON events FOR INSERT WITH CHECK (
  org_id = authz.org_id() AND authz.is_active_user()
  AND (authz.has_role('procurement_manager') OR authz.has_role('org_admin')));

CREATE POLICY events_update ON events FOR UPDATE USING (
  org_id = authz.org_id() AND authz.is_active_user()
  AND (authz.has_role('procurement_manager') OR authz.has_role('org_admin')))
  WITH CHECK (org_id = authz.org_id());
-- no DELETE policy: hard delete is impossible for app roles (archive-everything)

-- vendor_submissions: visibility follows the parent event ------------------
CREATE POLICY submissions_select ON vendor_submissions FOR SELECT USING (
  org_id = authz.org_id() AND authz.is_active_user() AND EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id));   -- events RLS applies inside

-- vendors ------------------------------------------------------------------
CREATE POLICY vendors_select ON vendors FOR SELECT USING (
  org_id = authz.org_id() AND authz.is_active_user() AND (
       authz.has_role('procurement_manager') OR authz.has_role('org_admin')
    OR authz.has_role('finance_approver')                       -- read-only
    OR (authz.has_role('department_head') AND EXISTS (          -- scoped read (App Flow §2.2)
          SELECT 1 FROM vendor_site_links vsl
          WHERE vsl.vendor_id = id
            AND vsl.site_id IN (SELECT authz.my_site_ids())))
  ));

-- contracts ------------------------------------------------------------------
CREATE POLICY contracts_select ON contracts FOR SELECT USING (
  org_id = authz.org_id() AND authz.is_active_user() AND (
       authz.has_role('procurement_manager') OR authz.has_role('org_admin')
    OR authz.has_role('finance_approver')));

-- approval_steps: assignee (or delegate) can decide their own step -----------
CREATE POLICY approval_steps_update ON approval_steps FOR UPDATE USING (
  org_id = authz.org_id() AND authz.is_active_user()
  AND (assigned_user_id = auth.uid() OR delegated_to = auth.uid())
  AND decision IS NULL);

-- audit_entries: OA read-only ------------------------------------------------
CREATE POLICY audit_select ON audit_entries FOR SELECT USING (
  org_id = authz.org_id() AND authz.has_role('org_admin'));
-- inserts occur via SECURITY DEFINER trigger function only (§9.2)
```

Remaining tables map to patterns: child tables (`extracted_fields`, `criterion_scores`, `documents`, `event_comments`, `event_invitations`) inherit visibility by EXISTS-joining their parent (as `vendor_submissions` above); `requirements` = P2 with raiser-can-always-see (`raised_by = auth.uid()`); admin config tables = P1 read / OA-only write; `jobs` = P2 via submission parent; `vendor_access_tokens`/`vendor_access_log` = OA + PM read only, no client writes.

### 8.4 Realtime
Publications limited to `jobs` and `notifications` (Decision #19); Realtime authorisation enforces the same RLS policies. Clients subscribe filtered: `jobs` by `submission_id` (event screens), `notifications` by `user_id`.

### 8.5 Storage policies (§10)
No client-side storage writes at all: uploads and signed-URL issuance go through Nitro (validation, size, MIME per F4.2). Storage RLS denies `anon`/`authenticated` on the bucket entirely; server issues 10-minute signed URLs after an RLS-checked lookup of the owning `documents` row.

### 8.6 Commercial masking (Decision #7)
DH reads of extraction data go through view `extracted_fields_dh`:

```sql
CREATE VIEW extracted_fields_dh WITH (security_invoker = true) AS
SELECT ef.* FROM extracted_fields ef
JOIN events e ON e.id = (SELECT event_id FROM vendor_submissions s WHERE s.id = ef.submission_id)
WHERE NOT (e.mask_commercial_for_dh AND ef.field_group = 'commercial');
```

The frontend (per App Flow: DHs never enter EVT-04) reads scores + this view only; comparison-report exports for DHs are generated server-side from the same rule.

---

## 9. Database Functions & Triggers

### 9.1 `touch_updated_at()` — standard BEFORE UPDATE trigger on every table with `updated_at`.

### 9.2 Audit (Decision #13)
`audit.log_mutation()` — AFTER INSERT/UPDATE trigger (SECURITY DEFINER) on: events, vendor_submissions, extracted_fields, criterion_scores, approval_requests, approval_steps, contracts, vendors, vendor_compliance_documents, profiles, user_roles — writes class `mutation` with `before`/`after` diffs (changed keys only). Semantic entries (class `action`: `events.stage_changed`, `scores.overridden`, `events.deadline_decision`, `auth.*`) are written explicitly by Nitro routes via `audit.log_action(...)` RPC. Vendor portal access writes class `vendor_access`.

### 9.3 Rollup triggers
- `vendor_compliance_documents` AFTER change → recompute `vendors.compliance_rollup`: `non_compliant` if any mandatory doc (per the vendor's categories' rule sets) is missing/expired; `at_risk` if any expires ≤60 days or advisory gaps; else `compliant`. (F7.4; never blocks anything — F7.6 lives in the app, not the DB.)
- `jobs` AFTER UPDATE → when all `extract_document` jobs for a submission are terminal, set `vendor_submissions.extraction_status` (`ready` / `failed_manual`), and enqueue `dispatch_notification` ("n of m submissions ready", App Flow Q15).

### 9.4 `open_event(event_id)` — SECURITY DEFINER RPC, called by `POST /api/events/:id/open`
Validates: status=draft, deadline future, ≥1 invitation, weightings total exactly 100. Writes `scoring_snapshot` + `compliance_snapshot` (Decision #14), sets status='open', stamps `opened_at`, enqueues invitation notifications. The snapshot is the only thing evaluation reads from that moment on — template edits never touch in-flight events (PRD §10).

### 9.5 `generate_alerts()` — nightly pg_cron (03:00 Europe/London)
Materialises `alerts` rows: contract offsets 120/90/60/30 days before `notice_deadline` (F10.3 — notice deadline, not end date, is the anchor); compliance offsets 90/60/30 before `expires_on`. A second job `send_due_alerts()` (hourly) marks `sent_at`, creates `notifications` + vendor emails. Idempotent by the UNIQUE constraint.
Also: `send_deadline_reminders()` per `events.reminder_offsets` to non-submitted invitees (F3.5).

### 9.6 `apply_retention(org_id)` — exists in v1, manually invoked (Decision #15)
Archives (sets `archived_at`) unsuccessful submissions older than policy; contract purge is archive-only in v1 — physical deletion deferred to a supervised Phase 2 process.

---

## 10. Storage Layout

Bucket `documents` (private). Path convention:
```
{org_id}/vendors/{vendor_id}/compliance/{document_id}-{filename}
{org_id}/events/{event_id}/submissions/{submission_id}/{document_id}-{filename}
{org_id}/contracts/{contract_id}/{document_id}-{filename}
{org_id}/org/logo.{ext}
```
Rules: `documents` table row is created **before** upload (server issues the signed upload URL against that path); orphan sweep job weekly; paths never contain user-supplied strings except a sanitised filename suffix.

---

## 11. API Surface (Nitro `server/api/`)

### 11.1 Rulebook (Decisions #17/#18)
- Reads: client → Postgres direct (RLS) for lists/details; **exceptions** that must use endpoints: anything masked (§8.6), comparison exports, audit log.
- Writes: exclusively endpoints. Every endpoint: zod-validate → authorise (re-check role even though RLS also applies) → state-machine guard → mutate → `audit.log_action` where semantic → respond typed.
- Transitions are verbs: `POST /api/{resource}/{id}/{verb}`. Errors: `{ error: { code, message } }`, messages per Content Guidelines §10.2.

### 11.2 Key endpoints (the ~30)

| Method & path | Auth | Purpose |
|---|---|---|
| POST /api/auth/accept-invite | invite token | Create profile, roles, scopes (§7.1) |
| POST /api/orgs/import-vendors | OA/PM | CSV import: validate → report → commit (F2.5) |
| POST /api/vendors | PM/OA | Create (duplicate check F2.4) |
| POST /api/vendors/:id/archive · /suspend · /restore | PM/OA | Status transitions (typed-confirm supplied client-side) |
| POST /api/vendors/:id/request-document | PM | Issue compliance_upload token + email (VND-02) |
| POST /api/compliance-documents/:id/verify | PM | Confirm expiry date (F7.3) |
| POST /api/requirements · /:id/decline | DH/PM · PM | Raise / decline with reason |
| POST /api/events | PM | Create draft (wizard W1) |
| PATCH /api/events/:id | PM | Draft edits (W1–W5 autosave) |
| POST /api/events/:id/invite | PM | Add vendors, issue tokens (F3.3) |
| POST /api/events/:id/open | PM | → `open_event()` (§9.4) |
| POST /api/events/:id/deadline-decision | PM | J7: proceed / extend / chase (audited) |
| POST /api/events/:id/close-no-award | PM | Typed-confirm transition |
| POST /api/submissions/:id/fields/:key/confirm · /edit | PM | Atomic field actions (EVT-04) |
| POST /api/submissions/:id/mark-reviewed | PM | Requires 100% confirmed or override reason |
| POST /api/submissions/:id/retry-extraction | PM | Re-enqueue; never overwrites manual values (J8) |
| POST /api/submissions/:id/scores/:key/confirm | PM | Score confirm/override (reason req. if differing) |
| POST /api/events/:id/report/export | PM/DH | Server-side PDF/XLSX, masking applied (F8.3) |
| POST /api/events/:id/approvals | PM | Create request; route from thresholds → `route_snapshot` |
| POST /api/approval-steps/:id/decide | assignee | approve/reject/changes (+comment rule F9.3) |
| POST /api/approval-steps/:id/delegate | assignee | Date-ranged delegation (F9.5) |
| POST /api/contracts | PM | Direct/legacy creation (F10.1) |
| POST /api/contracts/:id/start-reevaluation | PM | Pre-filled event (F10.4) |
| POST /api/contracts/:id/mark-renewal · /terminate | PM | Status transitions |
| GET  /api/audit | OA | Filtered audit reads + CSV (ADM-10) |
| POST /api/admin/users · /:id/deactivate | OA | Invites; revocation (§7.1.4) |
| **Vendor portal (token auth §7.3):** | | |
| GET  /api/vendor/context | token | Resolve token → event, steps, saved draft (VP-01/08) |
| PATCH /api/vendor/submission | token | Step saves + autosave (VP-03…07) |
| POST /api/vendor/submission/upload-url · /submit | token | Signed upload; final submit (enqueues extraction) |
| POST /api/vendor/request-link | public, rate-limited | Self-service re-issue (VP-E1) |

## 12. Migration Order
`000_extensions` (pgcrypto, pg_trgm, pgmq, pg_cron) → `001_orgs` → `002_vendors` → `003_evaluation` → `004_approvals_contracts` → `005_platform` → `010_rls_helpers` → `011_rls_policies` → `020_functions_triggers` → `021_cron` → `030_seed_system_data` (4 scoring templates, hospitality compliance taxonomy, vendor categories). Types regenerated (`supabase gen types`) in every schema PR (Tech Stack §9).

## 13. Open Items
1. MFA enforcement mechanics for password users — Supabase auth-hook configuration to verify at build time.
2. pg_trgm search vs. websearch tsvector if vendor lists exceed ~50k rows — revisit at scale.
3. Phase 2 reserved, not built: `global_vendor_id` dedup, org hierarchy, retention automation, external risk-feed tables.

---

*End of document. AI-assisted draft — review RLS policies with an engineer before production; run the §8 policies against a seeded branch database with one test user per role as the acceptance gate.*
