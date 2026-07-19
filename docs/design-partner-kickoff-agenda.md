# Design Partner Kickoff — AI Procurement Intelligence Platform

**Purpose:** Align on pilot scope, validate hospitality-specific assumptions in PRD v1.0, and resolve the open questions that block build milestone M0.
**Duration:** 90 minutes
**Attendees (suggested):** Product lead · Engineering lead · Design partner: Head of Procurement, a Finance Approver, one Department Head (ideally F&B), and Legal/Data Protection contact
**Pre-read:** PRD v1.0 (circulate ≥3 working days before; §1–6 minimum)

---

## Agenda

### 1. Framing & pilot goals — 10 min
- The one metric that defines pilot success: **evaluation cycle time cut ≥50% vs your current baseline.**
- Agree how baseline will be measured (last 3–5 completed RFP cycles: dates from first response received → approved shortlist).
- Pilot shape: duration, number of live evaluation events, named users per role.

### 2. Walk the workflow (validate, don't demo) — 25 min
Trace one *real, recent* sourcing event end-to-end against PRD modules F3–F10:
- Who raised it, who evaluated, who approved, where the documents lived, what went wrong.
- Checkpoints:
  - Do the five roles map cleanly to your team? Any missing role (e.g. Legal review step)?
  - Does the single-chain approval with GBP thresholds (F9.1) match reality? What are your actual threshold values?
  - Which parts of the current process must the platform *not* disturb?

### 3. Hospitality assumptions stress-test — 20 min
Decisions needed on the PRD's open questions:

| # | Question (PRD §15) | Decision needed |
|---|---|---|
| Q3 | Wine & spirits allocation buying — is direct contract entry (F10.1) enough for v1, or is a "negotiated award" event type required? | MVP scope call |
| Q4 | Multi-entity structure (separate legal entities per country/site): one org with sites, or parent/child orgs? | Blocks data model (M0) |
| Q2 | Unsuccessful-vendor feedback: product feature, manual process, or out of scope? | Scope + legal wording |
| — | Vendor category taxonomy (F2.1) and compliance document taxonomy (F7.2): what's missing for your operation? (e.g. spa/wellness suppliers, entertainment, art) | Config validation |

### 4. Documents & the golden test set — 15 min
- Request: a representative sample of historical procurement documents (proposals, contracts, certificates) to build the extraction accuracy test corpus (PRD AI-7).
- Agree: anonymisation approach, volume (target 50–100 documents from this partner), format mix (incl. scanned docs), and who authorises release.
- **Action owner needed** for a document-sharing agreement (PRD Q1).

### 5. Data protection & security — 10 min
- Confirm UK/EU data residency requirement and DPA process.
- Walk through the no-training guarantee (AI-6) and human-in-the-loop principle (AI-1) — these are usually the two questions Legal asks first.
- Flag: any vendor personal data shared for the pilot should be business-contact data only; personal data used in new ways may need a privacy review on the partner's side too.

### 6. Logistics & next steps — 10 min
- Pilot commercial terms (discount vs case-study rights and feedback commitment).
- Cadence: fortnightly product feedback session; named contacts each side.
- Success review date set now (end of pilot).

---

## Decisions to leave the room with

1. Baseline measurement method and the target cycle-time number.
2. Q4 answered: org/entity structure (blocks M0 — hard deadline).
3. Q3 answered: wine & spirits event handling for v1.
4. Document-sharing agreement owner and date.
5. Actual approval thresholds (GBP) for workflow configuration.
6. Pilot start date and named users per role.

## Follow-up actions template

| Action | Owner | Due (DD/MM/YYYY) |
|---|---|---|
| Circulate PRD feedback consolidated | Product | |
| Draft document-sharing agreement | Partner legal | |
| Provide last 3–5 RFP cycle dates for baseline | Partner procurement | |
| Confirm entity structure decision in PRD | Product + Eng | |

---

*Draft for internal planning — commercial and legal terms to be verified with the relevant teams before any external commitment.*
