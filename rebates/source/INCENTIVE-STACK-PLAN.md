# Incentive Stack Plan — every dollar mechanism, every jurisdiction, benchmarked against the top 20

**Date:** 2026-09-22 · **Owner:** Dan · **Status:** Phase 0 running
**Builds on:** `UTILITY-REBATE-MASTER-PLAN.md` (51-jurisdiction utility rebate layer, verified July 2026), `REBATE-AUTOMATION-SOFTWARE-SPEC.md`, `COMPETITIVE-LANDSCAPE-TOP-20.md`
**Trigger:** Peak Energy / PG&E Measured Savings offer (Sept 14, 2026) and Maxari TX-PACE deals showed the routing table has no slot for a third-party aggregator archetype and no financing layer at all. The competitive doc's §4 gap list is, mechanism by mechanism, the same finding.

---

## 1. What this adds

The July research answered one question: *"Which utility will reimburse the customer for our measures, and how do we file?"* Three archetypes (deemed, custom M&V, midstream), one payer (utility), one recipient (customer).

This plan maps **every** mechanism that moves money on a commercial efficiency project, per jurisdiction, and records for each: who pays, who receives, what it stacks with, and what it takes for Energy Plus to use it. Then it lays the top 20 competitors over the same grid so the parity gaps are explicit.

| Layer | What it is | Status today |
|---|---|---|
| **Utility incentive, archetypes A/B/C** | Deemed / custom M&V / midstream rebates | **Done** — `rebate-data/` (51 jurisdictions, 200 programs) |
| **Utility incentive, archetype D** — *new* | Third-party aggregator / pay-for-performance / NMEC. A non-utility implementer enrolls sites, savings are measured at the meter, incentive is paid to the aggregator or its assignee on performance; customer may pay nothing | Not modeled. Peak Energy/PG&E is row 1 |
| **Financing** — *new* | C-PACE, on-bill financing/repayment, green banks, state revolving loan funds, ESA/EaaS legal standing, public-sector ESPC enabling law | Not modeled. Maxari TX-PACE is row 1 |
| **Tax** — *new* | Federal (179D post-OBBBA, 48E, MACRS/bonus), state credits and deductions, sales-tax and property-tax exemptions | Federal status scattered across GTM plan and solar-thermal tree; no state layer |
| **Grants** — *new* | USDA REAP, DOE/EPA, state energy office, municipal | REAP noted only for AK |
| **Demand-response / flexibility revenue** — *new* | ISO/RTO and utility DR programs that pay the customer; the Voltus/CPower/Enel X business | Not modeled; named as a competitor gap |
| **Compliance drivers** — *new* | Building performance standards and benchmarking mandates (NYC LL97, Boston BERDO, DC BEPS, Denver, WA CBPS, etc.) — not incentives, but the reason a building owner buys | Not modeled |
| **Packaging structures** — *new* | ESPC, ESA, EaaS subscription, guaranteed savings, lease, shared savings — and whether each is legally and practically available per state | Competitor doc names them; no per-state availability |

## 2. Archetype D — definition for the routing table

**D. Third-party aggregator / pay-for-performance / NMEC.** The utility (or PUC) funds a program delivered by a non-utility implementer. The implementer recruits customers, installs or subcontracts measures, and is paid by the utility on *measured* savings — normalized metered energy consumption (NMEC) at the site or population level, or IPMVP Option C — typically over 1–2 years. The customer's application disappears; the implementer's contract with the program replaces it. Cost can sit with the customer, the implementer, or a manufacturer (Tri-S in the Peak Energy case).

Why it matters for us: it is the only archetype that lets CryoGenX4 earn an incentive without a TRM listing and without a per-site utility engineering review, and it is the archetype the master plan's own CryoGenX4 strategy pointed at ("build the IPMVP Option B evidence file toward emerging-technology submissions"). It also carries the competitor gap the doc calls "we file for the same rebates on the client's behalf, but we are not the program."

Fields specific to D: `implementer_or_aggregator`, `mv_basis` (site NMEC / population NMEC / IPMVP C / other), `min_savings_threshold`, `incentive_recipient`, `assignment_permitted`, `payment_basis` ($/kWh measured, term), `enrollment_path` (how a contractor or manufacturer gets under an existing implementer vs. becomes one).

## 3. Data model

New folder `Ops/incentive-stack/`. Nothing in `Ops/rebate-data/` changes; it remains the verified utility A/B/C layer and is referenced, not duplicated.

### 3.1 `mechanisms.csv` — the long table (one row per mechanism instance per jurisdiction; federal rows use `abbrev = US`)

```
state, abbrev, level, layer, mechanism_type, program_name, administrator, implementer_or_aggregator,
archetype, cost_bearer, incentive_recipient, eligible_our_measures, value_or_rate, value_basis,
min_threshold, stackable_with_utility_rebate, customer_type, sector_limits, how_to_access, timeline,
program_cycle, status, verified_on, confidence, source_urls, notes
```

Controlled vocabularies:
- `level`: federal · state · utility · municipal · iso_rto
- `layer`: utility_incentive · aggregator_p4p · financing · tax · grant · dr_revenue · compliance_driver · packaging
- `mechanism_type`: deemed_rebate · custom_rebate · midstream · nmec_p4p · third_party_implementer · cpace · on_bill · green_bank_loan · state_loan_fund · tax_deduction · tax_credit · sales_tax_exemption · property_tax_exemption · accelerated_depreciation · federal_grant · state_grant · muni_grant · demand_response · capacity_market · bps_mandate · benchmarking_mandate · esa_legal_status · espc_enabling
- `archetype`: A · B · C · D · n/a
- `cost_bearer`: customer · third_party · utility · shared
- `incentive_recipient`: customer · contractor_assignable · aggregator · equipment_owner · n/a
- `eligible_our_measures`: pipe-separated from {optimizer, cryogenx4, rtu_replacement, solar_thermal, thermal_barrier, controls_general, any_ee}
- `stackable_with_utility_rebate`: yes · no · conditional · unknown
- `status`: active · pilot · sunset:<date> · pending · terminated
- `confidence`: high · med · low

### 3.2 `financing-by-state.csv` — one row per jurisdiction (denormalized for reading)

```
state, abbrev, cpace_enabling_statute, cpace_statute_year, cpace_active, cpace_administrators,
cpace_coverage, cpace_min_project, cpace_hvac_controls_eligible, cpace_retrofit_eligible,
on_bill_programs, green_bank, state_loan_fund, esa_eaas_legal_note, espc_public_sector_enabling,
verified_on, confidence, sources
```

### 3.3 `federal-mechanisms.csv` — not per state

```
mechanism, statute_or_program, status_2026_09, key_dates, value, eligible_our_measures,
sector, stackable_with_utility_rebate, action_for_ep, verified_on, sources
```

### 3.4 `competitor-mechanism-matrix.csv` — competitor × mechanism

Rows: the 20 from `COMPETITIVE-LANDSCAPE-TOP-20.md`, plus `Energy Plus — today` and `Energy Plus — target`.
Columns (each cell Y / N / partial, with a paired `<col>_evidence` column holding a one-line note + URL):

```
espc, esa_pay_for_performance, eaas_subscription, guaranteed_savings, equipment_lease, zero_capex_offer,
captive_or_committed_capital, cpace_origination, utility_program_implementer, nmec_aggregator,
rebate_filing_on_behalf, dr_revenue_share, tax_benefit_monetization, securitization, self_perform_install,
telemetry_layer, own_case_studies
```

### 3.5 `parity-gaps.md` — the deliverable Dan asked for

For each mechanism where any competitor is Y and Energy Plus is N or partial: which competitors, what it takes (partner / enrollment / capital / legal), which jurisdictions it unlocks, and a recommended route. This is the "minimally able to do everything our competitors can do" table.

## 4. Research protocol (per jurisdiction deep sweep)

Same discipline as July: primary sources, no guessed numbers, "not published" recorded, every row sourced, adversarial second pass.

Source order per state:
1. DSIRE state page, commercial filter, incentive types: loan, PACE, grant, tax credit, tax deduction, sales/property tax exemption, performance-based
2. PACENation state page + program administrator sites
3. State energy office and any green bank / revolving loan fund
4. PUC/PSC dockets and utility pages for third-party implementer, NMEC, pay-for-performance, measured-savings programs
5. ISO/RTO (PJM, MISO, ERCOT, CAISO, NYISO, ISO-NE, SPP) and utility DR programs open to C&I
6. IMT building performance standards map + state/city benchmarking ordinances
7. Top three municipal utilities or cities by commercial load
8. State statute on ESA / third-party sale of energy services and public-sector ESPC

Output per state: rows in `mechanisms.csv` format, one `financing-by-state.csv` row, a 6–10 line state summary, and unresolved items.

Verification: a second agent per state attempts to disprove each row against the cited source; corrections logged to `incentive-stack/corrections.txt` as old → new → source, matching `rebate-data/corrections.txt`.

## 5. Phases

| Phase | Scope | Gate | Est. |
|---|---|---|---|
| **P0 — jurisdiction-independent** *(running now)* | This plan; federal layer; competitor matrix; archetype-D national screen; C-PACE / green-bank / on-bill national skeleton; BPS national screen | none | 5 sweeps, ~1–1.5M tokens |
| **P1 — deep sweeps, priority states** | Tier 1 + live-deal states: NC, SC, OR, WI, IL, ID, UT, WY, OK, HI, AZ, CA, TX, FL, NJ, NY (16) + verify | P0 skeletons loaded | 16 × (sweep + verify) |
| **P2 — deep sweeps, remaining 35** + verify | P1 method proven | 35 × (sweep + verify) |
| **P3 — calibrate and publish** | Cross-state calibration, completeness audit, `parity-gaps.md`, master-plan addendum (archetype D, financing, DR, compliance), software-spec update (D + financing in the data model; eligibility matcher returns the full stack with stackability), dashboard rebuild | P2 | 3–4 agents |

**Sizing rule (learned in P0):** each research agent has a hard cap of ~200 WebSearch calls and many utility/program sites bot-block WebFetch. A 14-state regional agent exhausted its budget on 5 states. Deep sweeps must be **≤3 jurisdictions per agent**, with PUC/PSC docket search pages as the fallback when marketing sites return 403. Agents must not sub-delegate; nested orchestration burned ~100k tokens per layer and saturated the 20-agent concurrency cap. States that cannot be screened are recorded `not_screened`, never `not_found`.

P1+P2 is 51 sweeps + 51 verifications, the same shape as July. Rough order: 15–25M tokens on Sonnet with live web research. Recommended vehicle: a pipelined workflow (each state's verification starts as soon as its sweep finishes); needs Dan's explicit opt-in per policy. Fallback: Agent fan-out in batches of 8–10.

## 6. What changes downstream when this lands

- **Master plan:** new §4b archetype D strategy; new §4c financing (C-PACE stacks on top of rebates and is the answer to "zero down" until the SPV has a capital partner); new §4d DR revenue as a customer-side line; compliance-driver states move up a tier because the buyer has a deadline.
- **Software spec:** archetype D added; `financing-by-state` joined into the eligibility matcher; proposal shows *rebate + financing + tax + DR* as a stack with stackability rules; P1 gate expands.
- **Sales language:** "rebate line" becomes "incentive stack line."
- **Peak Energy:** becomes the first archetype-D row with a real counterparty; Dan's three open questions (M&V method, timeline, territory boundary) map directly to the D fields.

## 7. Open items for Dan

1. Execution vehicle for P1/P2 — workflow (opt-in) vs. Agent batches.
2. Priority-state list for P1 — confirm the 16 or swap.
3. Residential in scope? July covered it; this plan is commercial-only unless told otherwise.
4. Canada — the calc folder has a Canada scaffold; out of scope here unless requested.
