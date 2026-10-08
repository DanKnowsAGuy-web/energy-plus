# Energy Plus — Rebate Automation Software Spec

**Date:** July 19, 2026
**Status:** Build spec, v1. Companion to `UTILITY-REBATE-MASTER-PLAN.md` (state tiering + ops playbook) and `DATA-INTAKE-DECISION-MEMO.md` (bill/HVAC data acquisition).
**Purpose:** Automate the utility-rebate application lifecycle so filing cost per project falls toward zero and time-to-check shrinks, across all 51 jurisdictions — without ever filing a number we can't source.

---

## 1. The core insight the software is built around

Every rebate program in the country, regardless of state, resolves to one of **three application archetypes**:

| Archetype | What it means | Automation ceiling |
|---|---|---|
| **A. Deemed / prescriptive** | Measure is in the TRM or measure database; rebate is a fixed $/unit or $/ton. Application = form + invoice + spec sheet. | **Near-total.** Software fills the form; a human clicks submit. |
| **B. Custom with M&V** | Savings must be calculated (and usually metered) per site; engineering review; pre-approval before install. | **Partial but high-value.** Software generates the savings workbook, M&V plan, and application packet from audit data; the utility's review is the human step. |
| **C. Midstream / instant** | Rebate flows through the distributor or is applied at point of sale; the customer application disappears entirely. | **Total** — the automation is procurement routing, not paperwork. |

So the system is not "51 state integrations." It is **three packet generators plus a routing table** that maps (state, utility territory, measure) → archetype, form set, and rules. The routing table is exactly the dataset the 50-state research produced; it ships as the seed data.

A second structural insight from the GTM plan (§3.2): in custom-program states, **the M&V the rebate requires is the same M&V that powers savings-multiple pricing**. The rebate module therefore doesn't bolt onto the sales pipeline — it *is* the back half of the verification protocol. One dataset feeds proposal, pilot contract, rebate application, and final invoice.

---

## 2. System overview

```
Bill Audit intake app ──┐
(energyplus-audit)      │      ┌─────────────────┐      ┌──────────────────────┐
                        ├────► │  PROJECT RECORD  │ ───► │  REBATE ENGINE        │
Bayou API (bills +      │      │  (one per site)  │      │  1. Eligibility match │
interval data)          │      └─────────────────┘      │  2. Packet generation │
                        │                                │  3. Submission queue  │
LOA / utility portals ──┘                                │  4. Status tracker    │
                                                         └──────────────────────┘
                                                                    │
                              Routing table (51-state dataset) ─────┘
```

### 2.1 Components

**Project Record (extend the existing intake app database).** The intake app already creates one record per lead with bills, nameplate photos, facility type, and address. Extend it with: utility territory (derived, see §3.1), tariff/rate schedule, per-unit measure prescription (optimizer / CryoGenX4 dose / solar thermal / barrier), modeled savings per measure, and M&V readings when they exist. This record is the single source of truth every downstream document reads from.

**Routing table (the 50-state dataset, made operational).** One row per (utility territory × measure class × sector) with: archetype (A/B/C), program name, application method, form/portal pointer, incentive rate or deemed value, pre-approval required (y/n/threshold), trade-ally required, M&V spec (metering days, IPMVP option), payment timeline, program-year window, fund-status notes, source URL, and a `verified_on` date. **Every row carries its source URL — the no-invented-numbers rule is enforced by schema:** a packet generator refuses to emit a dollar figure whose routing-table row lacks a source.

**Eligibility matcher.** Input: project record. Output: the list of applicable programs with estimated rebate $, ranked. Logic: address → utility territory (EIA-861 service-territory data + utility ZIP lookups; the bill itself is the tiebreaker since it names the utility) → routing-table rows for that territory → filter by sector, measure, program-year status → compute estimated rebate from deemed values or rate × modeled kWh. This is also a **sales tool**: it runs at audit time, so the proposal shows "estimated utility rebate: $X–Y" with the program named — grounded, because the number came from the sourced table.

**Packet generators (the heart).**
- *Generator A (deemed):* fills the program's application PDF/portal fields from the project record — customer info from intake, equipment from nameplate extraction, deemed measure IDs from the routing table, invoice and spec sheets attached from the document store. Output: a submission-ready packet for human review and click-to-submit. PDF form-fill for form-based programs; for portal-based programs, a per-portal field map that renders a "copy-paste sheet" in v1 (see §5 on why we don't headless-automate portals).
- *Generator B (custom/M&V):* the big one. Produces (1) the savings calculation workbook in the utility's expected format ($/kWh programs want first-year kWh; the model = cooling-share analysis from the bill + per-measure factors already used in the audit), (2) the M&V plan document instantiated from the EP Verification Protocol (7-day pre/post metering, Fluke/HOBO instrumentation, IPMVP Option B language) with site specifics filled in, (3) the pre-approval application, and (4) after install, the final report merging logger CSV exports into the results template. Cliff's protocol document is the template's authority; the software just instantiates it.
- *Generator C (midstream):* no packet — generates the distributor purchase instruction naming the program SKU/pathway so the discount lands at invoice.

**Submission queue + status tracker.** Kanban states: `eligible → packet_ready → submitted → pre_approved → installed → mv_complete → final_submitted → check_received`. Each transition timestamped; per-program SLA expectations from the routing table drive nudge alerts ("Dominion pre-approval usually 3–5 days; this one is at 12 — call"). Weekly digest to Dan. This is also where the **program-year calendar** lives: alerts when a target state's program year is about to close or fund status goes yellow.

**Document store.** Every generated packet, submitted form, utility correspondence, and check stub attached to the project record. The rebate file *is* the M&V file *is* the case-study raw material.

### 2.2 What explicitly stays human (v1)

- **Final review and the submit click** on every application (accuracy > speed; also several utilities' portals prohibit bots — same posture as the credential-access decision in the intake memo).
- **Trade-ally enrollments** (one-time per program, relationship-bearing — see master plan for the sequence).
- **Utility engineer conversations** on custom pre-approvals.
- Anything requiring a PE stamp or witnessed metering.

---

## 3. Data flows

### 3.1 Address → territory → programs (the automatic lookup)
1. Intake app captures address + utility name (customer-stated) + the bill PDF.
2. Bill extraction (vision model, per the intake memo Phase 2) confirms utility, rate schedule, and 12-month usage/demand.
3. Territory resolver maps to routing-table territory ID. Conflicts (customer said X, bill says Y) surface for review.
4. Eligibility matcher returns programs + estimated rebates → lands directly in the audit readout.

### 3.2 The M&V round-trip (custom states)
Pre-approval packet (Generator B) → utility approval → install → logger data upload (CSV drop into the project record; HOBO/Fluke exports parsed) → final report generated → final submission → payment tracked. The same logger parse feeds the customer-facing savings verification and the pilot contract's success-threshold check. **One metering event, three consumers.**

### 3.3 Residential (secondary track)
Residential is dominated by archetypes A and C — instant rebates, contractor-registered programs, and (rolling out through 2025–26) IRA HOMES/HEAR state programs with their own contractor-registration regimes. v1 scope: the eligibility matcher + routing table cover residential so quotes can name the rebate; packet generation is commercial-first. Revisit when a residential motion exists (currently opportunistic per GTM plan).

---

## 4. Build plan

| Phase | Scope | Effort | Gate |
|---|---|---|---|
| **P0 — Routing table live** | 51-state dataset loaded into the intake app's database (new tables: `territories`, `programs`, `measures`, `program_measures`); admin CRUD; `verified_on` staleness report | Days | none — data exists |
| **P1 — Eligibility matcher in the audit** | Address→territory→programs; estimated rebate line in the audit readout and proposal | ~1 wk | P0 |
| **P2 — Generator B for the beachhead states** | Custom-program packet generator templated on the 2–4 utilities in live-deal states (SC first: Duke, Dominion; then first rollout state) — savings workbook + M&V plan + pre-approval form | 2–3 wks | EP Verification Protocol written down (GTM §6.2 — already a Q3 objective) |
| **P3 — Generator A + tracker** | Deemed-form autofill for tier-1 prescriptive programs; submission queue + SLA nudges + program-year calendar | 2 wks | P1 |
| **P4 — Scale passes** | Per-portal field maps for the top 10 programs by pipeline volume; logger CSV auto-parse; check-received reconciliation | ongoing | volume |

**Platform:** extend the existing Higgsfield-hosted intake app (same D1 database, same admin) rather than standing up a second system — one project record was the point. Notion stays the human-facing mirror via CSV/API push, per the tool-preference decision.

**Staleness discipline:** every routing-table row shows `verified_on`; rows older than 6 months get flagged in admin; program-year rollover (July 1 / Jan 1 for most) triggers a re-verify task on tier-1 states. Rebate data rots — the system must wear its freshness on its sleeve.

---

## 5. Non-goals and risks

- **No headless portal automation in v1.** Utility portals change, some ToS prohibit bots, and a garbage submission burns the trade-ally relationship the whole strategy depends on. Field-mapped copy-paste sheets + human submit gets 90% of the time savings at zero relationship risk. Revisit per-portal API/Green Button availability (Duke NC data-access program late 2026).
- **No rebate-estimate display without a sourced routing-table row.** Enforced in schema, not policy.
- **CryoGenX4 is custom-path in nearly every territory.** The software helps by making custom packets cheap, but the strategic fix is the deemed-listing workstream in the master plan (§ get-our-products-deemed), not software.
- **Fund exhaustion risk:** estimated rebates in proposals always carry the program-year caveat auto-generated from the routing table's budget-cycle field.
