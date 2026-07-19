# App Flow Document
## AI Procurement Intelligence Platform — Screens, States & User Journeys

| | |
|---|---|
| **Document status** | Draft v1.0 — for review, not approved |
| **Companion to** | PRD v1.0 (18/07/2026) — requirement IDs (F1.x–F12.x, AI-x, Nx) referenced throughout |
| **Date** | 18/07/2026 |
| **Scope** | MVP screens only; Phase 2 screens noted where they affect v1 layout decisions |

---

## 1. How to Read This Document

- **Screen IDs:** every screen has a stable ID (e.g. `EVT-03`). Journeys reference screens by ID.
- **Notation:** `→` = navigation; `⇢` = system-triggered transition (no user action); `[role]` = visible to that role only.
- **States:** every screen defines up to five states — **Default**, **Empty** (three variants: never-had-data / filtered-to-nothing / no-access), **Loading**, **Error**, **Partial**. Only non-obvious states are written out; anything unlisted follows the global patterns in §3.
- **Roles:** PM = Procurement Manager, DH = Department Head, FA = Finance Approver, OA = Org Admin, V = Vendor.

---

## 2. Application Architecture

### 2.1 Two shells

| Shell | Users | Frame | URL space |
|---|---|---|---|
| **Internal app** | PM, DH, FA, OA | Left sidebar (collapsible to icons) + header | `app.{domain}/…` |
| **Vendor portal** | V | No sidebar; minimal header (customer logo, help link) + stepper | `vendor.{domain}/…` |

The two shells share no navigation chrome. Vendors can never reach an internal URL (server-enforced, N4); internal users can preview the vendor portal via a read-only "View as vendor" mode from an event ([PM/OA] only).

### 2.2 Internal information architecture (sitemap)

```
Dashboard                          DASH-01
My Actions                         ACT-01
Requirements                       REQ-01 (list) → REQ-02 (detail)
Events                             EVT-01 (list)
  └─ Event detail                  EVT-02 (Overview tab)
       ├─ Submissions tab          EVT-03
       │    └─ Evaluation workspace EVT-04 (per vendor)
       │    └─ Compare-by-term     EVT-05
       ├─ Scoring tab              EVT-06 (per criterion) / EVT-07 (per-vendor scorecard)
       ├─ Comparison report        EVT-08
       ├─ Approval tab             EVT-09
       └─ Activity log tab         EVT-10
  └─ New event wizard              EVT-W1…W6
Vendors                            VND-01 (list) → VND-02 (detail: Profile / Compliance / Events / Contracts / Activity tabs)
Contracts                          CON-01 (register) → CON-02 (detail)
Admin [OA]                         ADM-01 (hub)
  ├─ Users & roles                 ADM-02
  ├─ Sites & departments           ADM-03
  ├─ Scoring templates             ADM-04 (list) → ADM-05 (template builder)
  ├─ Compliance rule sets          ADM-06 (list) → ADM-07 (rule editor)
  ├─ Approval workflow             ADM-08
  ├─ Organisation settings         ADM-09
  └─ Audit log                     ADM-10
```

**Role visibility of sidebar items:**

| Section | PM | DH | FA | OA |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| My Actions | ✓ | ✓ | ✓ | ✓ |
| Requirements | ✓ | ✓ (own/scoped) | — | ✓ |
| Events | ✓ | ✓ (scoped, summary view) | ✓ (linked from approvals only) | ✓ |
| Vendors | ✓ | ✓ (scoped, read-only) | ✓ (read-only) | ✓ |
| Contracts | ✓ | — | ✓ (read-only) | ✓ |
| Admin | — | — | — | ✓ |

A user holding multiple roles sees the union of sections.

### 2.3 Header (internal shell)

Left → right: sidebar collapse toggle · breadcrumb trail · **site-context switcher** · global search · notification bell · user menu.

- **Site-context switcher:** multi-select dropdown; default "All sites"; persisted per user across sessions. Governs every list and dashboard; detail pages always show their own site tags regardless of context. Switching context on a detail page keeps the page open but flags if the record is outside the selected context ("Viewing: The Mill House — outside your current site filter").
- **Breadcrumbs:** full trail, industry standard, every level clickable. Deepest path: `Events / Autumn F&B Sourcing / Submissions / Fieldgate Produce Ltd / proposal.pdf`. Breadcrumb truncates middle levels on narrow viewports (`Events / … / Fieldgate Produce Ltd`).
- **Global search (GLOB-S):** typed dropdown, results grouped: Vendors · Events · Contracts (name/title match only in v1, F18 decision). Enter opens full results page. No document full-text search in v1.
- **Notification bell (GLOB-N):** dropdown, last 10 notifications, "View all" → ACT-01. Unread badge count.
- **User menu:** profile, email preferences, sign out; [OA] shortcut to Admin.

### 2.4 URL structure & deep-linking

- Every screen has a stable, shareable URL; notification emails deep-link to the exact screen + focused panel (e.g. `/events/EV-2041/approvals/AP-88` opens EVT-09 with that approval expanded).
- Access-denied on deep link → GLOB-E403 (see §3.4), never a blank page.
- Expired/invalid magic links (internal approval links) → ACT-01 with explanatory toast: "That link has expired — your pending approvals are listed below."

---

## 3. Global Patterns (apply to every screen unless overridden)

### 3.1 Standard page anatomy

List pages: page title + primary action (top right) · filter bar (site tags always shown, plus per-page filters) · table/cards · pagination (50/page). Detail pages: breadcrumb · title block (name, status chip, site tags, key metadata) · tab bar · content · right-hand context panel where specified.

### 3.2 Empty states (three variants everywhere)

| Variant | Pattern | Example copy |
|---|---|---|
| **Never-had-data** | One line of purpose + primary CTA. No illustrations, no videos. | "Contracts you award or import will be tracked here, with renewal alerts." → [Add a contract] |
| **Filtered-to-nothing** | "No results for these filters." + [Clear filters] | — |
| **No-access** | Explain scope, offer a way forward. | "You can see events for your assigned sites and departments. Ask your Org Admin if you need wider access." |

### 3.3 Loading states

- Lists: skeleton rows (never spinners on full pages).
- Detail panels: skeleton blocks per panel; page chrome renders immediately.
- Async AI work: **never blocks navigation** — status chips + notifications (§3.6). No full-screen progress takeover anywhere in the product.

### 3.4 Error states (global catalogue)

| ID | Error | Behaviour |
|---|---|---|
| GLOB-E403 | Permission denied / out-of-scope URL | Friendly page: what happened, what the user *can* access, link to Dashboard. Logged. |
| GLOB-E404 | Record not found / archived | "This record isn't available — it may have been archived." + link to parent list. |
| GLOB-E-NET | Connection lost | Non-blocking banner "You're offline — changes will retry"; forms hold state; retry on reconnect. |
| GLOB-E-SESS | Session expired mid-form | Re-auth modal over the page; **form state preserved** through re-authentication. Never a redirect that loses work. |
| GLOB-E-UPL | Upload failed / too large / wrong format | Inline per-file error with reason and limits (≤50 MB, PDF/DOCX/XLSX); other files in the batch unaffected. |
| GLOB-E-CONC | Concurrent edit conflict | "Updated by {name} just now" — show newest value, offer "Review their change" before overwriting. Last-write-wins with warning. |
| GLOB-E-AI | Extraction failed (AI-9) | Submission drops to "Failed — manual mode": document viewable, all fields manually enterable. Retry button. Workflow never blocked. |
| GLOB-E-AI-P | Partial extraction | Extracted fields shown normally; failed fields flagged "Couldn't extract — enter manually". Never all-or-nothing. |

### 3.5 Confirmations & destruction

- **Archive-everything model:** no user-facing hard delete. "Archive" hides + preserves (restorable ADM-10 / entity lists via "Show archived" filter).
- Routine actions (archive a draft, remove an invited vendor pre-submission): simple confirm dialog.
- Consequential actions: **typed-confirmation modal** stating consequences. The list: close event without award · deactivate a user · archive a vendor with active contracts · re-open a submitted vendor submission · change approval thresholds with approvals in flight.

### 3.6 Notifications

- Channels: in-app (bell + ACT-01) and email (per-user preferences in user menu). Every email deep-links (§2.4).
- Notification classes: Action required (approval, review ready) · Warning (expiry, deadline passed) · Informational (submission received, event opened).

### 3.7 Autosave rules

| Flow | Behaviour |
|---|---|
| Vendor submission (VP-03…07) | Per-step save + 30-second field-level autosave; "Saved ✓" indicator. |
| Event wizard (EVT-W1…W6) | Same as above; draft resumable from EVT-01. |
| Extraction field confirmations (EVT-04) | Instant per-field save (atomic actions). |
| Admin/config screens (ADM-*) | Explicit Save/Cancel + unsaved-changes guard on navigation. |

### 3.8 Mobile

Responsive throughout; **two journeys have explicit mobile layouts** (§7): the Finance approval decision screen (EVT-09 mobile variant) and the vendor submission stepper (VP-03…07). Everything else reflows; tables collapse to cards below 768 px.
---

## 4. Screen Inventory — Internal App

Format per screen: **Purpose · Content · Key actions · States · In/Out navigation.**

### 4.0 Authentication & first-run

**AUTH-01 — Sign in**
- Purpose: entry for internal users.
- Content: org-branded sign-in; SSO buttons (Google, Microsoft — F1.4); email+password fallback with MFA.
- States: error (invalid credentials, MFA failure, deactivated account → "Your access has been removed. Contact your Org Admin."); loading (SSO redirect spinner acceptable here — the one exception).
- Out: → DASH-01 (all roles; Q1 decision — Dashboard for everyone).

**AUTH-02 — Invitation acceptance**
- Purpose: first-time account activation from an OA invite email.
- Content: confirm name, set password (if non-SSO), MFA enrolment.
- Out: → DASH-01, which shows ONB-01 if org setup is incomplete.

**ONB-01 — Setup checklist (dashboard widget, [OA])**
- Purpose: drive org activation (backed by onboarding research: checklist completion correlates strongly with retention).
- Content: 4 items with progress — *Add your sites → Import vendors (CSV) → Review scoring templates → Create your first event*. Each links to the relevant screen; auto-ticks on completion; dismissible; reappears via Admin hub link.
- States: partial (items done out of order — fine, no forced sequence).
- Notes: no demo data anywhere in the product (Q13 decision).

### 4.1 Dashboard

**DASH-01 — Dashboard (role-adaptive)**
- Purpose: default landing for all roles; pipeline visibility (F11.1).
- Content by role:
  - **PM:** active events by stage (kanban-style stage counts, clickable) · pending actions summary (links ACT-01) · compliance alerts (expiring ≤60 days) · contracts expiring ≤90 days · rolling avg cycle time (F11.3).
  - **DH:** my requirements tracker cards (REQ status pipeline) · events in my scope · pending comment requests.
  - **FA:** pending approvals (count + oldest-waiting) · recently approved · contracts expiring ≤90 days (read).
  - **OA:** ONB-01 checklist (until complete) · usage health (active users, events in flight) · config warnings ("2 categories have no compliance rule set").
- States: never-had-data (new org, [PM] view): "Your pipeline will appear here. Start by creating an event or importing your vendor list." + CTAs. Loading: skeleton cards.
- Out: every card deep-links to its filtered list/detail.

### 4.2 My Actions

**ACT-01 — My Actions**
- Purpose: single to-do queue per user (Q20); target of the notification bell "view all".
- Content: sections in fixed order — **Approvals pending [FA/PM]** · **Extractions ready to review [PM]** · **Compliance expiring [PM]** · **Comments awaiting reply [all]** · **Requirements awaiting conversion [PM]**. Each row: title, context (event/vendor/site), age, action button.
- States: empty: "Nothing needs your attention. Enjoy it while it lasts." Filtered by site context like everything else.
- Out: each row → the exact screen + focused panel.

### 4.3 Requirements

**REQ-01 — Requirements list**
- Purpose: intake queue of departmental needs (F3.1).
- Content: table — title, department, site(s), category, est. annual value, needed-by (DD/MM/YYYY), status (Raised / Converted / Declined), raised-by. Filters: status, category, department. Primary action: [+ Raise requirement] ([DH/PM]).
- States: never-had-data ([DH]): "Need a new supplier or contract? Raise a requirement and procurement will take it from here." + CTA.
- Out: row → REQ-02; [PM] row action "Convert to event" → EVT-W1 (pre-filled).

**REQ-02 — Requirement detail**
- Purpose: single requirement + its lifecycle tracker.
- Content: details block · **status tracker** (Raised → Converted to Event → Evaluating → Shortlisted → Approved → Contracted — plain-language, each stage timestamped) · comments thread · linked event (if converted).
- Key actions: [PM] Convert to event / Decline with reason; [DH-owner] edit while status=Raised.
- States: declined state shows reason prominently.
- Out: linked event → EVT-02 ([DH] lands on the summary variant).

### 4.4 Events

**EVT-01 — Events list**
- Purpose: all evaluation events in scope.
- Content: table — title, category, site(s), status chip (Draft / Open / Under Evaluation / Shortlisted / In Approval / Awarded / Closed–No Award), submissions (e.g. "6/9"), deadline, owner. Filters: status, category, owner. Primary action: [+ New event] ([PM]) → EVT-W1. Draft events resumable from here.
- States: never-had-data ([PM]): "Run your first evaluation — upload responses, let the AI extract the terms, and score vendors side by side." + CTA.

**EVT-W1…W6 — New event wizard** ([PM])
Six steps, progress rail with back-navigation, per-step draft save (§3.7). Duplicate-previous-event shortcut on W1.
- **W1 Details:** title, category, site(s), linked requirement (optional), est. value + currency, description.
- **W2 Scoring:** pick template (ADM-04 set) → criteria + weightings editable for this event; weightings must total 100% (inline validation, live total).
- **W3 Compliance:** rule set auto-suggested by category (F7.1), editable per event; mandatory vs advisory toggles.
- **W4 Questionnaire:** structured questions builder (text / choice / number / file); reorder; optional per-question guidance for vendors.
- **W5 Vendors:** pick from directory (filtered by category/site) and/or add by email (auto-creates prospective vendor, F3.3); submission deadline (date + time, timezone-explicit); reminder schedule preview (T-7/3/1).
- **W6 Review & open:** full summary; **template snapshot warning:** "Scoring and compliance rules are locked to this event when you open it." [Open for submissions] → sends invitations ⇢ EVT-02 with success toast.
- States: leaving mid-wizard → draft saved toast; validation errors inline per step; W5 duplicate-vendor warning (F2.4).

**EVT-02 — Event detail · Overview tab**
- Purpose: event home; status-adaptive.
- Content: title block (status chip, deadline countdown, site tags, owner) · stage progress bar · headline numbers (invited / submitted / reviewed / scored) · **status-specific banner** (see Partial states below) · quick links to tabs · [DH] see the *summary variant*: vendor list with headline scores (commercial figures masked per F8.2 config), compliance flags, comment/endorse panel — no extraction workspace access.
- Key actions ([PM]): edit deadline · invite more vendors · move stage (guarded) · [View as vendor] preview · close without award (typed confirmation).
- **Partial state — deadline passed, incomplete submissions (Q17):** banner: "Deadline passed — 4 of 9 vendors submitted." Three equal-weight actions: [Proceed with received] · [Extend deadline] (re-notifies non-submitters) · [Chase individually] (opens per-vendor nudge list). No preselected default; choice recorded in EVT-10.
- States: Draft (checklist of missing setup) · Open (submission tracker prominent) · Under Evaluation (review progress prominent).

**EVT-03 — Submissions tab**
- Purpose: per-vendor submission tracker.
- Content: table — vendor, submitted date, extraction status chip (**Queued / Processing / Ready / Failed–Manual / Reviewed**), questionnaire completeness, compliance snapshot (✓/⚠/✗), reviewer. Non-submitted vendors listed greyed with invite status + [Resend link].
- Key actions: row → EVT-04; bulk [Notify me when all ready].
- States: Processing chips live-update; email + in-app notification on completion ("4 of 9 submissions ready for review") — never blocks (Q15).

**EVT-04 — Evaluation workspace (per vendor)** — *the heart of the product*
- Purpose: review AI-extracted terms against source documents (F5).
- Layout: **split view** — left: document viewer (page thumbnails, zoom, doc switcher for multi-file submissions); right: extracted fields panel.
- Fields panel: grouped by section (Commercial / Delivery / Legal / Certifications); each field shows value · **confidence badge (High/Med/Low)** · source link (click → left pane jumps to page and highlights passage, F5.3) · [Confirm] / [Edit] per field (instant save). **Low-confidence fields pinned to top** in a "Needs attention" group. Unconfirmed fields visually distinct (amber dot) per AI-1.
- Header: vendor name, "12 of 34 fields confirmed" progress, [Mark submission reviewed] (enabled at 100% confirmed or explicit override with reason).
- Key actions: navigate vendor-to-vendor (prev/next arrows preserve tab position); flag field for colleague (creates comment).
- States: **Failed–Manual (GLOB-E-AI):** document viewer fully functional, all fields blank + manually enterable, [Retry extraction] button. **Partial (GLOB-E-AI-P):** failed fields flagged individually. **Concurrent edit (GLOB-E-CONC):** "Confirmed by Priya just now" inline refresh.
- In: EVT-03 row, ACT-01, notification deep-links.

**EVT-05 — Compare-by-term pivot**
- Purpose: one extracted field across all vendors (secondary view, one click from EVT-04 via "Compare" tab toggle).
- Content: term selector (grouped dropdown) → table of vendor | value | confidence | confirmed? | source link. Outliers visually flagged (e.g. payment terms far from median).
- Key actions: confirm/edit inline (same atomic saves).

**EVT-06 — Scoring tab (per criterion — default view)**
- Purpose: score consistency across vendors (Q8 decision: criterion-first).
- Content: criterion selector rail (left, with weighting %) → main table: vendor | AI-proposed score (0–10) + rationale (expandable, cites evidence per F6.3) | confirmed score (editable) | override indicator. Composite ranking sidebar updates live (F6.5).
- Key actions: confirm all AI scores for criterion (bulk, with per-row exceptions) · override with reason (F6.4) · toggle to EVT-07.
- States: scores unavailable until extraction reviewed — locked state explains: "Confirm extracted terms first — scores are only as good as their evidence."
- [DH] sees read-only scores + endorse/comment panel (F6.6).

**EVT-07 — Per-vendor scorecard (secondary view)**
- Content: one vendor, all criteria, radar/table hybrid; same confirm/override controls.

**EVT-08 — Comparison report**
- Purpose: side-by-side output (F8).
- Content: column-per-vendor (2–10): composite + per-criterion scores · key commercial terms · compliance status · reviewer comments. Column config (show/hide fields); **mask sensitive commercial fields** toggle for DH-shared versions (F8.2). AI executive summary block — labelled "AI-drafted — edit before export", editable inline (F8.4).
- Key actions: [Export PDF] / [Export XLSX] — exports stamped with date/time, event ID, and draft watermark where unconfirmed fields included (F8.3) · [Send to approval] → EVT-09 flow.
- States: warning banner if any included field unconfirmed.

**EVT-09 — Approval tab**
- Purpose: run the approval chain (F9).
- Content: recommended vendor(s) selection · approval route preview (auto-computed from value thresholds, ADM-08) · package contents (report snapshot, key terms, compliance status, documents) · step timeline (who, decision, comment, timestamp — F9.3).
- **Approver decision view** (what FA sees via deep link): one screen — recommendation header · score summary · key commercial terms · compliance status · document links · [Approve] [Reject] [Request changes] (comment mandatory for the latter two). Mobile-optimised (§7.1). One click *to* this screen from email, never one-click decisions from the inbox (Q10 decision — audit posture).
- States: awaiting (shows whose court the ball is in + reminder age) · rejected (reason prominent, [Revise & resubmit]) · delegation notice if active (F9.5).
- ⇢ On final approval: event → Awarded; contract record draft created ⇢ CON-02; unsuccessful-vendor notifications queued (PM reviews before send).

**EVT-10 — Activity log tab**
- Purpose: per-event audit slice (F12 filtered to this event).
- Content: chronological — stage changes, field confirmations, score overrides (with reasons), approval decisions, deadline changes, the Q17 partial-deadline choice.
### 4.5 Vendors

**VND-01 — Vendor directory**
- Purpose: system of record (F2).
- Content: table — name, categories, sites served, status chip (Prospective / Under Evaluation / Approved / Active / Suspended / Archived), **compliance roll-up** (Compliant / At Risk / Non-compliant — F7.4), active contracts count. Filters: category, site, status, compliance state; full-text name search (F2.3). Primary actions: [+ Add vendor] · [Import CSV] (F2.5) · "Show archived" toggle.
- States: never-had-data: "Import your existing vendor list to get compliance tracking from day one." + [Import CSV] + [Add manually]. CSV import flow: upload → column mapping screen → validation report (rows OK / rows with issues, downloadable) → confirm import. Duplicate warnings inline (F2.4).
- [DH]: scoped read-only; no add/import.

**VND-02 — Vendor detail** (tabs: Profile / Compliance / Events / Contracts / Activity)
- **Profile:** legal + trading name, reg number, country, categories, contacts, sites served, status control ([PM/OA]; Suspend requires reason).
- **Compliance tab:** required documents by rule set — each row: document type, status chip (Missing / Submitted / Verified / **Expiring ≤60d** / Expired — F2.2), expiry (DD/MM/YYYY), file link, [Verify] action ([PM] confirms AI-read expiry date per F7.3), [Request from vendor] (sends magic-link upload request scoped to that document).
- **Events tab:** participation history with outcomes.
- **Contracts tab:** linked contract records.
- **Activity:** audit slice.
- States: archive with active contracts → typed confirmation ("This vendor has 2 active contracts. Archiving hides them from new events but keeps contracts live.").

### 4.6 Contracts

**CON-01 — Contract register**
- Purpose: F10 lifecycle view.
- Content: table — contract name, vendor, category, site(s), value (currency + GBP indication where non-GBP, marked *indicative*), start / end (DD/MM/YYYY), **notice deadline** (highlighted column — the binding date, F10.3), renewal type, status chip (Draft / Active / Expiring ≤90d / In Renewal / Expired / Terminated), owner. Filters: site, category, owner, status, renewal quarter. [Export XLSX] (F10.5). Primary action: [+ Add contract] (legacy import — upload document ⇢ AI extracts key dates/terms ⇢ confirmation screen, same confidence/confirm pattern as EVT-04).
- States: never-had-data: "Add your existing contracts — the AI will read the key dates and you'll never miss a notice window again." Rows within 30 days of notice deadline get a warning highlight.

**CON-02 — Contract detail**
- Content: key terms block (all AI-extracted values carry the confirmed/unconfirmed pattern) · dates timeline (start / notice deadline / end) with alert schedule shown (120/90/60/30 — F10.3) · linked event + documents · owner · renewal type.
- Key actions: [Start re-evaluation] → EVT-W1 pre-populated with incumbent + category (F10.4) · edit dates (typed confirmation if it changes an alert already sent) · mark In Renewal / Terminated (reason).
- States: Expired without action → red banner + [Start re-evaluation] / [Mark terminated].

### 4.7 Admin ([OA] only — full fidelity per scope decision)

**ADM-01 — Admin hub**
- Content: card grid to ADM-02…10; config-health warnings ("Category 'Laundry & Linen' has no compliance rule set"); link to reopen ONB-01 checklist.

**ADM-02 — Users & roles**
- Content: user table — name, email, role(s), site/department scope, SSO/MFA status, last active, status. Actions: [Invite user] (email + role + scope) · edit scope · deactivate (typed confirmation; immediate revocation per F1.5) · reactivate.
- States: pending invitations section with [Resend]. Deactivating a user with pending approvals → warning + reassignment prompt.

**ADM-03 — Sites & departments**
- Content: two panels. Sites: name, country, currency, status. Departments (F1.6): name, sites where active. Archive-only removal; archiving a site with active events → blocked with explanation.

**ADM-04 — Scoring templates list**
- Content: table — template name, category, criteria count, last edited, used-by (events count). Ships with 4 defaults (F6.1) marked "System-provided — duplicate to edit". [+ New template] / duplicate / archive.
- Note: editing a template **never** changes in-flight events (snapshot model, PRD §10) — banner states this.

**ADM-05 — Template builder**
- Content: criteria list (name, description, weighting %, scoring guidance text) · drag-reorder · live weighting total (must equal 100% to save — inline validation) · preview pane showing what PMs see in W2.
- States: unsaved-changes guard (§3.7); validation error pins offending rows.

**ADM-06 — Compliance rule sets list**
- Content: rule sets by vendor category; document-type coverage summary; hospitality taxonomy pre-loaded (F7.2). [+ New rule set] / duplicate / archive.

**ADM-07 — Rule editor**
- Content: for the category — document-type rows: type (from editable taxonomy), mandatory/advisory toggle, validity rule (expiry required? max age?), vendor-facing guidance text. [+ Add document type] (from taxonomy or create new).
- Snapshot banner as ADM-05.

**ADM-08 — Approval workflow**
- Content: single-chain builder (F9.1): threshold rows — "≤ £10,000 → PM only", "£10,001–£100,000 → + Finance Approver", "> £100,000 → + CFO". Editable thresholds (GBP), step roles, reminder cadence (default 3 days), delegation policy view.
- States: editing thresholds with approvals in flight → typed confirmation ("3 approvals are mid-flight; they keep their original route.").

**ADM-09 — Organisation settings**
- Content: org name + logo (white-labels vendor portal, F4.6) · default currency · data-retention settings (N7) · notification defaults · SSO configuration status.

**ADM-10 — Audit log**
- Content: filterable table (actor, action, entity type, date range) per F12.1; [Export CSV]. Read-only, append-only.

---

## 5. Screen Inventory — Vendor Portal

Design intent: a vendor should complete a submission in one sitting on any device without instructions, and never see anything that isn't theirs (F4.4, N4).

**VP-01 — Invitation landing**
- In: invitation email → magic link (F4.1).
- Content: customer logo + event title, what's being asked (documents, questionnaire, compliance docs), deadline (date + time + timezone), estimated effort, [Start submission].
- States: link expired → VP-E1; link already used → straight to VP-08 (status page); event closed → VP-E2.

**VP-02 — Identity confirmation**
- Content: confirm company name + contact; note: "Forwarded this link to a colleague? That's fine — access is logged." (Q16 decision: forwarding allowed in v1, logged).

**VP-03…07 — Submission stepper (5 steps, F4.2)**
- **VP-03 Company details:** legal name, reg number, contacts. Pre-filled where the customer's directory has data; vendor corrects.
- **VP-04 Questionnaire:** the W4-built questions; required markers; per-question guidance; progress within step.
- **VP-05 Proposal documents:** drag-drop multi-upload (PDF/DOCX/XLSX, ≤50 MB, ≤25 files); per-file status; per-file errors (GLOB-E-UPL) never fail the batch.
- **VP-06 Compliance documents:** required list from the event's rule set — each: type, guidance text, upload slot, **self-declared expiry date** (DD/MM/YYYY) where applicable; mandatory items block submission, advisory items don't (clearly badged).
- **VP-07 Review & submit:** full summary, incomplete items linked, declaration checkbox, [Submit]. ⇢ receipt email (F4.5).
- Autosave: per-step + 30 s (§3.7); "Saved ✓" persistent indicator; returning via the same link resumes at last step.
- States: deadline passes mid-draft → banner "The deadline has passed. Contact {customer contact} if you believe this is in error"; draft preserved read-only. Session expiry: GLOB-E-SESS (magic-link re-auth, state preserved).

**VP-08 — Status page (post-submission)**
- Purpose: the same link, forever their window (Q11).
- Content: submission receipt (timestamp, file list) · status (Received / Under Evaluation / Shortlisted / Unsuccessful / Awarded — F4.4, never competitor info) · **"Your other active invitations from {customer}"** cross-links (Q12) · compliance expiry warnings for their documents (90/60/30 — F7.5) with [Upload replacement] shortcut · edit request state: if PM re-opens (F4.3), banner + [Edit submission] returns to stepper.
- States: Unsuccessful — respectful copy, no scores/reasons in v1 (PRD open question Q2 pending).

**VP-E1 — Link expired** — explanation + [Email me a new link] (self-service re-request, F4.1).
**VP-E2 — Event closed** — explanation + customer contact.

---

## 6. User Journeys (end-to-end)

### J1 — First-run org setup [OA]
AUTH-02 → DASH-01 (+ONB-01) → ADM-03 (sites, departments) → VND-01 (CSV import: upload → map → validate → confirm) → ADM-04/05 (review templates) → ADM-08 (thresholds) → checklist complete ⇢ ONB-01 auto-dismisses.
*Failure paths:* CSV validation issues → downloadable error report, partial import allowed with per-row skip.

### J2 — The golden path: requirement → award [DH, PM, FA]
1. [DH] REQ-01 → Raise requirement → REQ-02 tracker (status: Raised). ⇢ PM notified.
2. [PM] ACT-01 → "Requirements awaiting conversion" → EVT-W1…W6 (pre-filled) → Open. ⇢ invitations sent; REQ-02 tracker: Converted.
3. Vendors submit (J3 runs in parallel). EVT-03 chips move Queued → Processing → Ready (Q15: PM never waits; notified at completion).
4. [PM] EVT-04 per vendor: confirm Low-confidence fields first → Mark reviewed. EVT-05 pivot to sanity-check outliers.
5. [PM] EVT-06 criterion-by-criterion scoring: confirm/override AI scores. [DH] endorses via summary view; comments resolved.
6. [PM] EVT-08 comparison → edit AI summary → Send to approval.
7. [FA] email deep link → EVT-09 decision view (desktop or mobile §7.1) → Approve. ⇢ event Awarded; CON-02 draft created; REQ-02 tracker: Contracted (once contract confirmed).
8. [PM] reviews queued unsuccessful-vendor notifications → send. ⇢ VP-08 statuses update.

### J3 — Vendor submission [V]
Email → VP-01 → VP-02 → VP-03…07 (autosaved; can leave and resume via same link) → Submit → receipt email → VP-08 whenever curiosity strikes.
*Edge:* forwarded link (logged, allowed) · expired link → VP-E1 self-service · deadline passes mid-draft → preserved read-only.

### J4 — Finance approval, mobile [FA]
Push/email on phone → deep link → mobile EVT-09 (§7.1) → reads package, opens one document → Request changes + comment → ⇢ PM notified → PM revises → resubmits → FA approves at desk next morning. Timeline shows both decisions.

### J5 — Compliance expiry [system, V, PM]
⇢ T-90: vendor emailed (VP-08 shortcut to upload). ⇢ T-60: vendor + PM (ACT-01 "Compliance expiring"). ⇢ T-30: both again. ⇢ Expiry: vendor roll-up flips Non-compliant (VND-01 flag, visible in any live event per F7.4 — but never auto-rejects, F7.6). [V] uploads replacement → [PM] verifies new expiry (VND-02 Compliance tab) → roll-up restored.

### J6 — Contract renewal [PM]
⇢ T-120 before **notice deadline**: owner notified → CON-02 → [Start re-evaluation] → EVT-W1 pre-filled with incumbent → J2 from step 2. Or: negotiate directly → update contract dates (typed confirmation) → status Active.

### J7 — Deadline passed, partial submissions [PM]
⇢ Deadline ⇢ EVT-02 banner state (Q17): PM picks Proceed / Extend / Chase → choice logged in EVT-10 → flow continues per choice. Extend re-runs reminder schedule for non-submitters only.

### J8 — Extraction failure recovery [PM]
EVT-03 chip: Failed–Manual ⇢ PM notified → EVT-04 manual mode (document readable, fields enterable) → optional [Retry] → if retry succeeds, manual entries are **never overwritten** (AI values appear as suggestions beside them).

---

## 7. Mobile Flow Definitions (the two that matter)

### 7.1 Approval decision — mobile (EVT-09 variant)
Single-column stack: recommendation header (vendor, value, event) → score summary (composite + top 3 criteria) → key terms (collapsed accordion) → compliance status → documents (open in viewer) → sticky bottom action bar: [Approve] [Reject] [Request changes]. Comment sheet slides up for the latter two. Typed elements minimised; decision confirmable in under a minute without pinch-zooming.

### 7.2 Vendor submission — mobile (VP-03…07)
Stepper becomes a vertical progress list; one step per screen; camera-roll and file-picker upload; per-step save button always visible; review step collapses to expandable sections. Explicit design goal: a small supplier owner completes this from a phone in a delivery van.

---

## 8. State Coverage Matrix (summary)

| Screen | Empty | Loading | Error | Partial |
|---|---|---|---|---|
| DASH-01 | ✓ new-org | skeleton cards | — | per-widget |
| ACT-01 | ✓ "nothing pending" | skeleton rows | — | — |
| REQ-01/02 | ✓ instructive | skeleton | — | declined state |
| EVT-01 | ✓ instructive | skeleton | — | draft rows |
| EVT-W1…6 | — | — | inline validation | per-step drafts |
| EVT-02 | — | skeleton | — | **deadline-passed banner (J7)** |
| EVT-03 | pre-deadline tracker | live chips | Failed–Manual chip | mixed chips |
| EVT-04 | — | field skeletons | GLOB-E-AI / -CONC | GLOB-E-AI-P |
| EVT-06/07 | locked-until-reviewed | skeleton | — | mixed confirmed |
| EVT-08 | <2 vendors → prompt | — | unconfirmed-fields warning | masked variant |
| EVT-09 | no route configured → link ADM-08 | — | delegation notice | awaiting state |
| VND-01/02 | ✓ import CTA | skeleton | CSV validation report | expiring highlights |
| CON-01/02 | ✓ instructive | skeleton | — | expired banner |
| ADM-* | ✓ per screen | — | unsaved guard; in-flight warnings | — |
| VP-01…08 | — | — | VP-E1/E2, GLOB-E-UPL/-SESS | resumed drafts |

---

## 9. Open Items for Design

1. Comparison report (EVT-08) column layout beyond 6 vendors — horizontal scroll vs. vendor picker; prototype both.
2. Site-context switcher behaviour for users scoped to exactly one site — hide entirely, or show locked? (Recommend: show locked, for consistency.)
3. Exact copy voice for vendor-facing rejection states — needs brand/tone input (and interacts with PRD open question Q2 on feedback).
4. Notification digest option (daily summary vs. real-time) — recommend real-time for actions, daily digest option for informational class; confirm with pilot users.
5. Whether EVT-04 document viewer needs annotation (highlight + comment on the document itself) in v1 or Phase 2 — recommend Phase 2.

---

*End of document. AI-assisted draft for internal review — validate flows with pilot users before build; wireframes to follow from this map.*
