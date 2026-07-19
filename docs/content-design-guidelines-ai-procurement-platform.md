# Content & Design Guidelines
## AI Procurement Intelligence Platform — Design System & Copy Standards

| | |
|---|---|
| **Document status** | Draft v1.0 — for review, not approved |
| **Companion to** | PRD v1.0 · App Flow v1.0 · Tech Stack v1.0 (18/07/2026) |
| **Date** | 18/07/2026 |
| **Audience** | Claude Code (primary implementer) and human designers/engineers |
| **Contrast verification** | Every text/background pair in §3 was computationally verified against WCAG 2.1 AA on 18/07/2026 |

---

## 1. How Claude Code Must Use This Document

1. **Zero design decisions are delegated to the implementer.** If a value, colour, label, or behaviour is not specified here, in the App Flow doc, or the PRD — STOP and ask. Do not invent, approximate, or "match the vibe".
2. **Tokens only.** No raw hex values, px sizes, or font names in component code. Everything references the `@theme` tokens in §3 via Tailwind utilities or CSS variables.
3. **Copy is spec.** Microcopy patterns in §9–10 are templates with rules, not suggestions. Generated strings must follow the formulas and the terminology table (§9.2) exactly.
4. **PrimeVue components are restyled via the preset (§6), never per-instance.** No inline style overrides, no one-off class hacks on library components.
5. The **Do-Not list (§12)** has the same force as the Tech Stack prohibited list.

## 2. Decisions Summary (the 14 answers)

| # | Decision |
|---|---|
| 1 | One document: design tokens + components + layout + voice/copy. |
| 2 | Neutral standalone product identity defined here from scratch. No Soho House brand assets — different legal and positioning animal. Logo is a slot (§5.1) pending brand work. |
| 3 | Aesthetic: **warm professional** — enterprise restraint on warm stone neutrals with a single deep-evergreen accent. Rationale: the competitor set (Coupa, Zip, Levelpath) is uniformly cold SaaS blue; a warm, hospitality-adjacent palette differentiates without sacrificing seriousness, and suits the vertical. |
| 4 | Dark mode: **Phase 2.** Tokens are structured semantically so dark values can be added without component changes; only light ships in v1. |
| 5 | Typography: **Inter** (single typeface, open licence, variable font, self-hosted). Tabular numerals mandatory in data contexts. |
| 6 | Density: **compact data, comfortable input** — tables/lists compact by default; forms and vendor portal comfortable. |
| 7 | Status colours: traffic-light semantics + info blue + neutral grey. All pairs AA-verified. |
| 8 | PrimeVue theming: **light-touch** — Aura preset + `definePreset` token mapping. Distinctiveness comes from palette/type/spacing, not component surgery. |
| 9 | Layout constants locked in §4 with exact pixel values. |
| 10 | Voice: plain-spoken, confident, lightly warm. **Vendor-facing register is more formal.** |
| 11 | Terminology: UI says **"supplier"** (UK hospitality speech); code/API/docs keep `vendor` (matches PRD/App Flow/schema). UI says **"evaluation"**; code keeps `event`. Full mapping §9.2. |
| 12 | Errors: direct and instructional. Apology only for genuine system fault. Light wit permitted **only** in internal empty states — never vendor-facing, never in errors or compliance contexts. |
| 13 | Maximum literalness: copy-paste-ready `@theme` block, exact values, per-state component specs. |
| 14 | WCAG 2.1 AA is structural: only the verified pairs in §3.3 may be used for text. |

---

## 3. Design Tokens

### 3.1 The `@theme` block (copy verbatim into `app/assets/css/main.css`)

```css
@import "tailwindcss";

@theme {
  /* ---------- Neutrals (warm stone) ---------- */
  --color-app-bg: #FBFAF7;          /* app background */
  --color-surface: #FFFFFF;         /* cards, panels, table rows */
  --color-surface-subtle: #F5F3EF;  /* section fills, table header, hover rows */
  --color-surface-sunken: #EFECE6;  /* wells, code, drop zones */
  --color-border: #E9E6DF;          /* decorative borders, dividers */
  --color-border-strong: #8F897C;   /* input borders (AA 3:1 verified) */
  --color-text: #26231E;            /* primary text */
  --color-text-secondary: #6B665D;  /* secondary text (AA verified) */
  --color-text-placeholder: #716C61;/* placeholders (AA verified) */
  --color-text-disabled: #A29D91;   /* disabled (WCAG-exempt) */
  --color-text-inverse: #FFFFFF;

  /* ---------- Primary (evergreen) ---------- */
  --color-primary: #0E6B5C;         /* actions, links, focus, selected */
  --color-primary-hover: #0B5649;
  --color-primary-active: #094439;
  --color-primary-subtle: #E8F2F0;  /* selected row bg, subtle fills */
  --color-primary-border: #B7D6D0;

  /* ---------- Status ---------- */
  --color-success: #166A2E;  --color-success-bg: #E7F4EA;  --color-success-border: #BCE0C6;
  --color-warning: #7A5200;  --color-warning-bg: #FBF0DC;  --color-warning-border: #EBD5A8;
  --color-danger:  #A83226;  --color-danger-bg:  #FBE9E7;  --color-danger-border:  #F0C4BF;
  --color-danger-solid: #B5382B;    /* destructive buttons, error text on white */
  --color-info:    #1C5DB8;  --color-info-bg:    #E7EFFB;  --color-info-border:    #C2D6F2;
  --color-neutral-chip: #6B665D; --color-neutral-chip-bg: #F0EEE8; --color-neutral-chip-border: #DDD9CF;

  /* ---------- Typography ---------- */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --text-xs: 0.75rem;    --text-xs--line-height: 1rem;      /* 12/16 */
  --text-sm: 0.8125rem;  --text-sm--line-height: 1.25rem;   /* 13/20 */
  --text-base: 0.875rem; --text-base--line-height: 1.375rem;/* 14/22 — app default */
  --text-md: 1rem;       --text-md--line-height: 1.5rem;    /* 16/24 — vendor portal default */
  --text-lg: 1.125rem;   --text-lg--line-height: 1.625rem;  /* 18/26 */
  --text-xl: 1.375rem;   --text-xl--line-height: 1.75rem;   /* 22/28 — page titles */
  --text-2xl: 1.75rem;   --text-2xl--line-height: 2.25rem;  /* 28/36 — dashboard greeting */

  /* ---------- Spacing (4px base) ---------- */
  --spacing: 0.25rem;   /* Tailwind scale: 1=4px 2=8px 3=12px 4=16px 6=24px 8=32px 12=48px */

  /* ---------- Radius ---------- */
  --radius-sm: 4px;     /* chips, inputs' inner elements */
  --radius-md: 6px;     /* buttons, inputs */
  --radius-lg: 10px;    /* cards, panels */
  --radius-xl: 14px;    /* modals */
  --radius-full: 9999px;/* pills, avatars */

  /* ---------- Shadows ---------- */
  --shadow-card: 0 1px 2px rgb(38 35 30 / 0.06), 0 1px 3px rgb(38 35 30 / 0.08);
  --shadow-overlay: 0 4px 12px rgb(38 35 30 / 0.10), 0 12px 32px rgb(38 35 30 / 0.14);

  /* ---------- Motion ---------- */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 120ms;    /* hovers, toggles */
  --duration-base: 200ms;    /* dropdowns, tabs */
  --duration-slow: 300ms;    /* modals, drawers */
}
```

### 3.2 Z-index scale (fixed)

`sticky table header 10 · sidebar 20 · app header 30 · dropdown 40 · toast 50 · modal backdrop 60 · modal 70 · tooltip 80`. No other values permitted.

### 3.3 AA-verified pairs (the only legal text/background combinations)

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| text `#26231E` | app-bg `#FBFAF7` | 15.00 | body text |
| text-secondary `#6B665D` | surface `#FFFFFF` | 5.70 | secondary text |
| text-secondary | surface-subtle `#F5F3EF` | 5.14 | table headers |
| primary `#0E6B5C` | surface | 6.41 | links, focus ring (3:1 UI ✓) |
| text-inverse | primary | 6.41 | primary button label |
| text-inverse | primary-hover `#0B5649` | 8.60 | hover state |
| success `#166A2E` | success-bg / surface | 5.91 / 6.70 | success chips & text |
| warning `#7A5200` | warning-bg / surface | 6.13 / 6.92 | warning chips & text |
| danger `#A83226` | danger-bg | 5.69 | danger chips |
| danger-solid `#B5382B` | surface | 5.89 | error text, destructive buttons |
| info `#1C5DB8` | info-bg / surface | 5.48 / 6.35 | info chips & text |
| border-strong `#8F897C` | surface / surface-subtle | 3.48 / 3.14 | input borders (3:1 UI) |
| text-placeholder `#716C61` | surface | 5.22 | placeholders |
| text-inverse | text `#26231E` | 15.65 | tooltips |

Any new colour combination must be contrast-computed and added here before use.

---

## 4. Layout System

### 4.1 Locked constants

| Constant | Value |
|---|---|
| Sidebar expanded / collapsed | **260px / 64px** |
| App header height | **56px** |
| Vendor portal header | **64px**, content max-width **720px**, centred |
| Detail-page content max-width | **1200px**, centred, `px-6` |
| List/table pages | full-width within shell, `px-6`, no max-width |
| Modal widths | sm **440px** · md **640px** · lg **880px** |
| Right context panel (where App Flow specifies) | **360px** |
| Breakpoints | Tailwind defaults: sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536 |
| Table → card collapse | below **768px** (App Flow §3.8) |
| Minimum touch target | **40×40px** (44×44 in vendor portal) |

### 4.2 Page templates (every screen uses exactly one)

| Template | Structure | Used by |
|---|---|---|
| **T1 List** | Title row (title left, primary button right, 56px) → filter bar (48px, site tags + filters + search) → DataTable → pagination | EVT-01, VND-01, CON-01, REQ-01, ADM-02/04/06/10 |
| **T2 Detail** | Breadcrumb → title block (name, status chip, site tags, meta line) → tab bar → tab content (max 1200px) | EVT-02…10, VND-02, CON-02, REQ-02 |
| **T3 Wizard** | Left progress rail (240px, steps with state icons) → step content (max 720px) → sticky footer (Back left; Save draft + Continue right) | EVT-W1…W6 |
| **T4 Workspace** | Full-bleed split: document viewer 55% / fields panel 45%, draggable divider (min 30% either side), own header with back-to-event anchor + progress | EVT-04, EVT-05 |
| **T5 Vendor portal** | Centred 720px column, vertical stepper above content on mobile, sticky footer with step actions | VP-01…08 |
| **T6 Auth/system** | Centred card 400px on app-bg | AUTH-*, GLOB-E403/404 |
| **T7 Dashboard** | Greeting row → responsive card grid (12-col, cards span 4/6/12) | DASH-01, ACT-01, ADM-01 |

### 4.3 Density rules

- **Tables (compact):** row height 40px; cell `px-3 py-2`; text-sm; header text-xs uppercase tracking-wide text-secondary on surface-subtle.
- **Forms (comfortable):** input height 40px (44px vendor portal); label above input, `mb-1.5`, text-sm font-medium; field gap `space-y-5`; helper/error text-xs below.
- **Cards:** padding `p-5`; card gap `gap-4`.
- **Detail meta:** definition rows `py-2.5`, label 200px text-secondary, value fills.
---

## 5. Identity

### 5.1 Product identity
- Working wordmark: the product name set in Inter SemiBold, `--color-text`, with "AI" never visually emphasised (the intelligence is a feature, not the brand). Logo is a **32×32 slot** in the sidebar header pending brand work — until then, a rounded-square monogram tile: primary background, white initial.
- Customer white-labelling (F4.6): vendor portal header shows the **customer's** name/logo (from ADM-09), never ours prominently; our identity appears only as "Powered by {product}" text-xs text-secondary in the portal footer.

### 5.2 Imagery & decoration
- **No illustrations, no stock photography, no emoji in UI copy.** The interface is typographic. Empty states are text + button only (App Flow §3.2).
- Charts (chart.js) use: primary, info, then `#8A7B52 · #4E7D8C · #9C5F54` for series 3–5; gridlines `--color-border`; no gradients, no 3D.

---

## 6. PrimeVue Preset (light-touch)

One preset file `app/theme/preset.ts` via `definePreset(Aura, …)` mapping semantic tokens: `primitive.primary → evergreen scale`, `surface → stone scale`, radius `md`, focus ring `2px solid --color-primary, offset 2px`. **All PrimeVue styling flows through this preset. Per-instance overrides are prohibited.** Components used and their variants are specified in §7; PrimeVue components not listed there require approval before use.

---

## 7. Component Specifications

### 7.1 Buttons

| Variant | Fill | Text | Border | Hover | Use |
|---|---|---|---|---|---|
| Primary | primary | inverse | none | primary-hover | One per view maximum — the main action |
| Secondary | surface | text | border-strong | surface-subtle | Everything else |
| Ghost | transparent | text-secondary | none | surface-subtle | Table row actions, icon buttons |
| Destructive | danger-solid | inverse | none | darken 8% | Typed-confirmation modals only — never in toolbars |
| Link | transparent | primary | none | underline | Inline navigation |

- Sizes: **md 36px** height `px-4` text-sm (default) · sm 30px `px-3` text-xs (table rows) · lg 44px `px-5` text-md (vendor portal, auth).
- States: focus = 2px primary ring, 2px offset · disabled = 50% opacity + `cursor-not-allowed` (never remove from DOM) · **loading = spinner replaces label, width preserved, button disabled** — every async action must use loading state.
- Icon buttons: 36×36, ghost, tooltip mandatory (aria-label = tooltip text).

### 7.2 Status chips (the complete legal mapping — no other status colours permitted)

Chip anatomy: radius-full, `px-2.5 py-0.5`, text-xs font-medium, colored bg + border + text per §3.1 trios.

| Domain | Status → colour |
|---|---|
| Evaluation stage | Draft → neutral · Open for submissions → info · Under evaluation → info · Shortlisted → primary-subtle w/ primary text · In approval → warning · **Awarded → success** · Closed–no award → neutral |
| Extraction | Queued → neutral · Processing → info (with 12px spinner) · Ready → success · **Failed–manual → warning** (not danger — it's a workable state, App Flow GLOB-E-AI) · Reviewed → primary-subtle |
| Confidence (AI fields) | High → success · Medium → warning · Low → danger. Always chip + word, never colour alone. |
| Compliance (document) | Verified → success · Submitted → info · Expiring ≤60d → warning · Missing → neutral · **Expired → danger** |
| Compliance (supplier roll-up) | Compliant → success · At risk → warning · Non-compliant → danger |
| Contract | Draft → neutral · Active → success · Expiring ≤90d → warning · In renewal → info · Expired → danger · Terminated → neutral |
| Supplier status | Prospective → neutral · Under evaluation → info · Approved → primary-subtle · Active → success · Suspended → warning · Archived → neutral |
| Approval | Pending → warning · Approved → success · Rejected → danger · Changes requested → info |
| Submission (vendor-facing) | Received → info · Under evaluation → info · Shortlisted → primary-subtle · Unsuccessful → neutral (**never danger** — respect, §10.4) · Awarded → success |

### 7.3 Forms & inputs

- Text/select/date inputs: 40px, radius-md, border-strong 1px, surface bg; focus swaps border to primary + ring; error swaps to danger-solid border + text-xs danger-solid message below (message replaces helper text, never stacks).
- Labels: sentence case, no colons, required fields marked `*` in danger-solid — but prefer marking *optional* fields "(optional)" when most fields are required (vendor portal rule).
- Validation timing: on blur, then on change once a field has erred. Never on first keystroke.
- Date inputs display and parse **DD/MM/YYYY**; calendar popover weeks start Monday.
- Currency inputs: prefix "£" (or event currency symbol), thousands separators live, 2dp on blur.
- File upload (VP-05/06, EVT-04): drop zone surface-sunken dashed border-strong radius-lg, `p-8`; per-file row with name, size, progress bar (primary), and per-file error in danger-solid (GLOB-E-UPL — one file's failure never styles the zone red).

### 7.4 DataTable (PrimeVue) rules

Compact density (§4.3) · sortable headers show direction caret only when active · row hover surface-subtle · row click navigates (whole row clickable, cursor-pointer) with actions column excluded · selected row primary-subtle · sticky header on scroll · pagination "Showing 1–50 of 312" left, pager right, 50/page fixed · loading = 8 skeleton rows (§7.8) · column minimums: status 120px, dates 110px, actions 96px right-aligned.

### 7.5 Modals & confirmations (App Flow §3.5 tiers)

- Simple confirm: sm modal — title (question form), one sentence body, Cancel (secondary) + confirm (primary or destructive). Focus lands on **Cancel**.
- Typed confirmation: md modal — consequence list (plain sentences, not bullets of doom), input labelled `Type ARCHIVE to confirm` (verb matches action, uppercase), destructive button disabled until exact match.
- All modals: radius-xl, shadow-overlay, backdrop `rgb(38 35 30 / 0.4)`, close on Esc and backdrop click **except** typed confirmations (explicit Cancel only).

### 7.6 Toasts & banners

- Toast: top-right, 360px, auto-dismiss 5s (errors 8s, or sticky with dismiss if action required), max 3 stacked, icon + text-sm + optional single action link.
- Page banners (deadline passed, expired contract, offline): full-width within content, radius-lg, status trio colours, icon left, actions right. The J7 deadline banner: warning trio, three **equal secondary buttons** (no primary — no default, per App Flow Q17).

### 7.7 Navigation components

- Sidebar: app-bg, 1px border right; items 40px, radius-md, text-sm; active = primary-subtle bg + primary text + 3px primary left bar; icons 18px primeicons; collapsed shows icons + tooltips; section order fixed per App Flow §2.2.
- Breadcrumbs: text-sm text-secondary, "/" separators, current page text font-medium non-link; middle truncation below lg breakpoint (App Flow §2.3).
- Tabs: underline style — 2px primary underline on active, text-secondary → text on hover; never pill tabs.
- Stepper (wizard/vendor): number circles 28px — completed = primary fill white check · current = primary border primary text · future = border-strong text-secondary; connector line border colour, primary when completed.

### 7.8 Skeletons & loading

Skeleton blocks: surface-sunken, radius-sm, shimmer animation 1.5s ease-in-out infinite (opacity 0.6→1); shapes match the real layout (rows in tables, cards on dashboards). **Full-page spinners are prohibited** except the SSO redirect (AUTH-01, App Flow exception).

### 7.9 Confidence & score displays

- Extracted field row (EVT-04): value text-base · confidence chip right · source-link icon (pi-search) ghost button · unconfirmed = 8px amber dot left of value + surface-subtle row bg · confirmed = subtle green check, row bg surface. Low-confidence group pinned top under header "Needs attention ({n})".
- Scores: 0–10 shown as number + 60px horizontal bar (primary fill on surface-sunken track); AI-proposed value in text-secondary italic beside confirmed value when overridden ("7 *(AI: 9)*"); composite score text-xl font-semibold tabular.

---

## 8. Data Display Rules

| Data | Rule | Example |
|---|---|---|
| Dates | DD/MM/YYYY everywhere; append time as HH:mm (24h) only where App Flow specifies (deadlines) | 03/09/2026 · 03/09/2026 17:00 |
| Relative time | Only in activity feeds/notifications, ≤7 days, then absolute | "2 h ago" → "11/07/2026" |
| Deadlines | Countdown chips <7 days: "3 days left" (warning ≤3, danger ≤1) | |
| Currency | £ symbol, thousands commas, 2dp; non-GBP: "€12,400.00 *(≈ £10,650 indicative)*" — the word *indicative* is mandatory (PRD N16) | £1,250.00 |
| Numbers in tables | `font-variant-numeric: tabular-nums`, right-aligned | |
| Percentages | 0dp unless <1% | 92% |
| File sizes | 1dp, B/KB/MB | 3.2 MB |
| Truncation | Single-line ellipsis + title tooltip; supplier names never truncate below 16 chars | |
| Empty values | "—" (em dash), never blank, never "N/A", never "null" | |

---

## 9. Voice & Terminology

### 9.1 Voice principles

1. **Plain-spoken:** shortest correct sentence wins. "Deadline passed" not "The submission deadline has now elapsed."
2. **Confident, not bossy:** state facts and next steps; don't scold. Active voice; second person for the user's actions, "we" only for genuine system actions.
3. **Lightly warm — in the right rooms.** Internal empty states may carry gentle wit ("Nothing needs your attention. Enjoy it while it lasts."). Vendor-facing surfaces, errors, compliance, and anything about money: straight face, always.
4. **Honest about AI:** AI output is always labelled as such ("AI-drafted — review before use"). Never present AI content as verified fact; never anthropomorphise ("the AI thinks…" is banned — say "suggested" / "extracted").
5. British English throughout (organise, colour, whilst → avoid "whilst" anyway — plain-spoken).

### 9.2 Terminology table (UI label vs code name — binding)

| UI says | Code/API/docs say | Never say in UI |
|---|---|---|
| **Supplier** | `vendor` | Vendor (except legal/contract text) |
| **Evaluation** | `event` | Event, RFP event |
| Requirement | `requirement` | Request, intake |
| Submission | `submission` | Bid, proposal (as the container) |
| Response deadline | `deadline` | Due date, cutoff |
| Compliance document | `compliance_document` | Cert (except in labels like "certificate" where it is one) |
| Notice deadline | `notice_deadline` | Notice period end |
| Site | `site` | Location, venue, House |
| Approve / Reject / Request changes | — | Sign off, decline, push back |
| Archive | `archive` | Delete (nothing is deleted — App Flow §3.5) |
| Score | `score` | Rating, grade |
| Awarded / Unsuccessful | — | Winner / Loser, Rejected (for suppliers) |

Navigation labels (updates App Flow names for display): **Dashboard · My actions · Requirements · Evaluations · Suppliers · Contracts · Admin.**

### 9.3 Capitalisation & punctuation

- **Sentence case everywhere:** buttons, titles, labels, tabs, nav ("My actions", "Add supplier"). ALL-CAPS only in table headers (via CSS, text-xs tracking-wide) and typed-confirmation keywords.
- No full stops in labels, buttons, chips, or single-sentence helper text; full stops in multi-sentence body copy.
- No exclamation marks anywhere in the product. One question mark maximum per screen.
- Numerals for all numbers ("3 suppliers", not "three").

---

## 10. Microcopy Patterns (formulas + worked examples)

### 10.1 Buttons — verb first, object explicit

`[Verb] [object]` — "Add supplier", "Open for submissions", "Export XLSX", "Start re-evaluation". Never "Submit", "OK", "Yes", "Click here". Confirmation buttons repeat the verb ("Archive supplier", not "Confirm").

### 10.2 Errors — What happened · Why (if useful) · What to do

- Formula: `{What happened}. {How to fix or what happens next}.` No error codes user-facing; no blame; no "oops".
- "Sorry" is reserved for faults that are **ours**: "Something went wrong on our side. Your work is saved — try again in a moment."
- Worked set:
  - Upload too large → "This file is over 50 MB. Compress it or split it into parts, then upload again."
  - Wrong format → "Only PDF, Word (DOCX) and Excel (XLSX) files can be uploaded."
  - Magic link expired → "This link has expired. Enter your email and we'll send a new one." (button: "Email me a new link")
  - Extraction failed → "We couldn't read this document automatically. You can enter the details manually, or retry." (buttons: "Enter manually" · "Retry extraction")
  - Permission denied → "You don't have access to this page. You can see evaluations for your assigned sites — contact your admin if you need more."
  - Offline → "You're offline. Changes will be saved when your connection returns."
  - Weighting invalid → "Weightings must add up to 100%. They currently total {n}%."

### 10.3 Empty states (App Flow §3.2 variants — templates)

- Never-had-data: `{One line: what this page will show and the value}.` + primary CTA. E.g. Contracts: "Contracts you award or import are tracked here, with alerts before every notice deadline." → [Add a contract]
- Filtered-to-nothing: "No results for these filters." → [Clear filters]
- No-access: see permission-denied pattern above.
- Wit budget: internal only, one per screen, never about money/compliance/suppliers' outcomes.

### 10.4 Vendor-facing register (more formal — the rules)

- No contractions in outcome and compliance messages ("Your submission has not been successful" — not "hasn't").
- Outcome copy (Unsuccessful): "Thank you for your submission. On this occasion, {customer} has decided not to proceed with your proposal. Your details remain on file for future opportunities." — neutral chip, no red, no scores, no reasons (PRD open Q2 pending).
- Every vendor screen states who to contact: "{customer contact} — {email}".
- Deadline references always include date, time, and timezone: "by 17:00 (UK time) on 03/09/2026".

### 10.5 Notifications & emails

- In-app: `{What happened} — {object}` ≤90 chars: "4 of 9 submissions ready for review — Autumn F&B sourcing".
- Email subjects: `{Action/status}: {object}` — "Approval requested: Linen services, est. £84,000/yr". Body: one-sentence context, one detail block, one button (the deep link, App Flow §2.4). No marketing footers.

### 10.6 AI labelling strings (fixed)

- Unconfirmed field tooltip: "Extracted by AI — confirm or edit before it's used in reports."
- Summary block header: "AI-drafted summary — edit before export."
- Score rationale prefix: "Suggested score based on: {evidence list}."

### 10.7 Banned words & phrases

`Oops · Whoops · leverage · utilise · seamless(ly) · simply/just (before an instruction) · please note · kindly · robust · cutting-edge · AI-powered (in UI copy) · invalid (about user input — describe the fix instead) · Are you sure? (state consequences instead) · N/A · click here · vendor (in UI) · delete (in UI)`

---

## 11. Accessibility Rules (structural)

1. Text colours only from §3.3 pairs. New combinations must be contrast-computed first.
2. Focus visible on every interactive element: 2px primary ring, 2px offset — never `outline: none` without replacement.
3. Colour never carries meaning alone: every status chip includes its word; confidence includes the word; charts include labels/legends.
4. All icon-only buttons have `aria-label`; all inputs have programmatic labels; error messages linked via `aria-describedby`; toasts announced via `aria-live="polite"` (errors `assertive`).
5. Full keyboard support: tables row-navigable, modals focus-trapped with return focus, wizard steps reachable, Esc closes overlays (except typed confirmations).
6. `prefers-reduced-motion`: all animation durations drop to 0ms except opacity fades at 100ms.
7. Touch targets ≥40px (44px vendor portal); DD/MM/YYYY dates get `<time datetime="…">` ISO attributes.

---

## 12. Do-Not List (same force as Tech Stack §14)

- No raw hex/px/font values in components — tokens only.
- No new colours, spacing values, radii, shadows, or z-indices without adding them to §3 first.
- No per-instance PrimeVue style overrides; no second component library.
- No illustrations, stock photos, emoji, or decorative icons in UI copy.
- No full-page spinners (SSO redirect excepted). No blocking progress screens (App Flow §3.3).
- No ALL-CAPS labels or Title Case Buttons; sentence case per §9.3.
- No red styling on vendor "Unsuccessful" states; no humour in vendor-facing, error, or compliance copy.
- No "vendor", "delete", "event" (as UI nouns), or any §10.7 banned word in user-facing strings.
- No unlabelled AI output — every AI-generated value/summary carries its §10.6 label.
- No design decisions: if it's not specified here / App Flow / PRD, ask.

---

## 13. Worked Example — Suppliers list (T1), fully resolved

Header: "Suppliers" (text-xl font-semibold) left; [Import CSV] (secondary) + [Add supplier] (primary) right. Filter bar: site-context tags, category multi-select, status select, compliance select, search input (placeholder "Search suppliers"). DataTable (compact): Name (min 220px) · Categories (chips, max 2 + "+3") · Sites · Status (chip per §7.2) · Compliance (roll-up chip) · Active contracts (tabular, right) · Actions (ghost kebab). Row click → VND-02. Empty (never-had-data): "Import your existing supplier list to get compliance tracking from day one." → [Import CSV] + [Add manually] (secondary). Loading: 8 skeleton rows. Pagination: "Showing 1–50 of 312".

---

*End of document. AI-assisted draft — contrast values computationally verified 18/07/2026; review with a designer before this becomes the build contract, and re-run contrast checks on any palette change.*
