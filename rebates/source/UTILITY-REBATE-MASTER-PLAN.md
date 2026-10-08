# Energy Plus — Utility Rebate Master Plan

**Date:** July 19, 2026
**Companions:** [`rebate-data/rebate-states.csv`](rebate-data/rebate-states.csv) (51 ranked jurisdictions) · [`rebate-data/rebate-programs.csv`](rebate-data/rebate-programs.csv) (200 utility/administrator programs) · [`REBATE-AUTOMATION-SOFTWARE-SPEC.md`](REBATE-AUTOMATION-SOFTWARE-SPEC.md) · live dashboard (hosted artifact, link in session)
**Method:** 51 independent research sweeps (DSIRE → utility program pages → state TRMs), each adversarially fact-checked (36 confirmed clean, 15 corrected), cross-state calibrated, completeness-audited, and patched. Every dollar figure traces to a cited primary document; "not published" is recorded rather than guessed. Value score = 25% deemed-availability for our measures + 25% generosity + 20% ease + 15% speed + 15% stability.

---

## 1. The three findings that shape everything

**1. The country runs on three application archetypes, not 51 systems.** Deemed/prescriptive (form + invoice, near-automatic), custom with M&V (engineering review, pre-approval, metering), and midstream/instant (rebate at the distributor or point of sale). Which archetype our optimizer lands in per territory is the single biggest driver of state value — and it is why the automation problem is tractable (see software spec).

**2. "Advanced Rooftop Controls (ARC)" is our deemed on-ramp — but the measure definition varies, and the definition is everything.** 15 states have a deemed or midstream optimizer path today. In the best ones the measure is rich and clean: Duke NC pays **$159.50–$317/ton**, Focus on Energy (WI) **$125/ton**, ComEd/Ameren (IL) **$100–$300/ton**, Energy Trust (OR) **$200–$300/ton** with an "ARC Lite" tier, wattsmart (UT/WY/ID) **$500–$6,500/unit by tonnage**. But some definitions bundle requirements the optimizer alone doesn't meet — Ameren MO's $1,500/HP measure requires economizer + supply-fan VFD + DCV together. Rule: **qualify the optimizer against each territory's measure spec, not the measure name.** Where it fits ARC/ARC-Lite → automatic money. Where it doesn't → custom, where our metering protocol shines.

**3. In custom states, the rebate's M&V requirement and our sales model are the same machine.** Custom programs pay $0.05–$0.30/kWh of verified first-year savings (NJ's Enhanced Pathway reaches **$2.50/kWh for HVAC** on projects saving ≥200k kWh/yr; Entergy AR pays $0.16–$0.20/kWh), capped at 50–75% of cost — and they demand exactly the metered verification the EP Verification Protocol already performs for pricing and proof (GTM §3.2, §6.2). CryoGenX4 is custom-path in effectively every territory, so the custom lane isn't optional — it's where the additive's rebate money lives.

---

## 2. State tiering

Full ranked table in `rebate-states.csv` and the dashboard; tiers below are strategy, not just score. Commercial track leads (per the 80/20 riders rule); residential rank shown for the future motion.

### Tier 1 — Deemed-fast launch markets (sell here proactively)
Optimizer has a deemed/prescriptive path, difficulty low–medium, top-tier scores. Rebate quotable in the proposal from the routing table, no engineering review on standard projects.

| Rank | State | Score | Why it matters |
|---|---|---|---|
| 1 | **NC** | 87 | Duke deemed ARC $159.50–$317/ton + high-eff unitary; statutory backing; adjacent to home base |
| 9 | **SC** | 74 | **Home base + likely Kite-test state.** Dominion SC / Santee Cooper controls measures $350–$580/system; Duke Carolinas overlap with NC enrollment |
| 3 | **OR** | 78 | Energy Trust ARC $200–300/ton, ARC-Lite fits a controls-only install; HP-RTU replacement deemed $350/ton (Frontier fit); 6–8 wk payment |
| 4 | **WI** | 77 | Focus on Energy deemed ARC $125/ton, statewide single administrator (one enrollment covers the state) |
| 6 | **IL** | 75 | ComEd/Ameren deemed ARC $100–300/ton; deep statutory budgets; slower payment |
| 2/7/10 | **ID/UT/WY** | 82/75/74 | The **wattsmart cluster** — one Rocky Mountain Power/PacifiCorp vendor relationship covers three states; ARC $500–$6,500/unit by tonnage |
| 8 | **OK** | 74 | PSO networked-controls rebate ($250/thermostat-zone 2026); midstream high-eff RTU |
| 13 | **HI** | 73 | Hawaii Energy deemed; highest $/kWh value in the country amplifies savings-multiple pricing; #1 residential |
| 21 | **AZ** | 67 | SRP ARC $250/ton; year-round cooling load suits the pitch |

### Tier 2 — Rich-custom markets (price with the rebate; M&V is the engine)
No automatic path for the optimizer, but custom rates are rich enough to fund 50–75% of projects. These are **savings-multiple pricing states** (GTM §3.2). Sell here when a portfolio lands here; enroll as trade ally at deal time.
**AR** (5, Entergy $0.16–0.20/kWh) · **NJ** (11, $0.30→$2.50/kWh HVAC Enhanced Pathway, 75% cap) · **WA** (12) · **MA** (14, deep but full-custom + slow) · **GA** (15) · **VT** (16) · **MN** (17) · **CO** (18, Xcel $500/kW) · **CA** (19, deemed controls-family $40–130/ton but heavy process) · **PA** (20, PECO pre-approval recommended not required — verified) · **NY** (22, $0.25/kWh at 65% cap; Sep 30 2026 install deadline this program year) · **CT** (23) · **KS** (24, Evergy $0.14/kWh for HVAC controls).

### Tier 3 — Moderate / reactive (respond, don't pursue)
Ranks ~25–47: NM, RI, MI, ME, MO (note the $1,500/HP ARC bundle rule), NE (OPPD deemed — a bright spot), DE, TN, IN, IA (midstream RTU), FL, NH, MD, VA (Dominion custom $0.12/kWh; APCo thin at $27/ton), TX (standard-offer via sponsors — Oncor $294.79/kW class rates), NV, DC (strong residential #2, weak commercial), ND, AL, MS, LA (program restructured by 2026 LPSC order — watch), KY (TVA rates unpublished — confirm via TVABusinessIncentive@tva.gov before quoting), SD, MT. **Hybrid pricing** (fixed + verified-savings share) unless the specific territory's custom program covers the metering cost.

### Tier 4 — No meaningful path (never promise a rebate)
**WV (19), AK (15), OH (15).** Ohio's post-HB6 landscape and WV/AK's absent commercial programs mean: hybrid pricing only, rebate line = $0 in proposals, no filing effort. Montana (38) is borderline-4.

### Residential overlay (for the future motion only)
Top residential markets: **HI (77), DC (77), RI (77), WI (72), NV/IA/NE/AZ (~69)** — dominated by instant/midstream designs and contractor-registration regimes, plus IRA HOMES/HEAR programs still rolling out state-by-state through 2026. No residential motion exists today (GTM: opportunistic only); when one does, registration-per-program is the gate and the states above are the shortlist.

---

## 3. Trade-ally enrollment sequence

Enrollment is the automation unlock (applications pre-validated, portal access, utility referral listings) and it's nearly free — the cost is paperwork (W-9, COI, references, sometimes a training webinar). Assistants (Q3 hire) own the filings; Dan signs.

1. **Now (Q3, aligns with GTM Q3-5):** Duke Energy Carolinas/Progress Trade Ally (one enrollment, covers NC+SC territories) · Dominion Energy SC trade ally · Santee Cooper Trade Ally Network. This fully covers the Kite test state and the #1-ranked state.
2. **At Kite rollout scoping:** enroll in each rollout state's Tier-1/2 administrator the moment target sites are known — enrollment takes days-to-weeks and must precede the first application, not follow it.
3. **Q4 batch (Tier-1 coverage):** Focus on Energy (WI) Trade Ally · Energy Trust of Oregon Trade Ally Network · ComEd Service Provider + Ameren IL Program Ally · Rocky Mountain Power wattsmart vendor (covers UT/WY/ID-RMP) · Idaho Power territory registration.
4. **Deal-triggered (Tier 2):** enroll at proposal time — NJ (Clean Energy Program contractor), MA (Mass Save), NY (Con Ed direct channel exists, trade ally *not* mandatory — verified), CO (Xcel trade partner), etc.
5. **Never:** Tier-4 states.

Track enrollments as routing-table rows (`trade_ally_status` per territory) in the admin, with renewal dates — several networks require annual re-attestation.

---

## 4. Get-our-products-deemed strategy

**Optimizer (near-term, highest leverage).**
- *Ride existing measures:* map the optimizer's function (compressor-cycling optimization on constant-speed units) against each Tier-1 ARC/controls measure spec. Three buckets: fits ARC-Lite-style definitions (OR explicitly; likely SC/OK thermostat-controls measures) → file deemed today; fits full-ARC only with add-ons (MO's econ+VSD+DCV bundle) → either bundle the install or file custom; no controls measure → custom.
- *Petition where the data compounds:* IL, MN, PA, NY TRMs update annually with public measure-development processes. After 3–5 owned M&V datasets (Kite + Q4 case studies), submit a measure workpaper ("cycling optimization controller for constant-speed unitary HVAC") to one TRM cycle — one acceptance creates precedent language every other TRM petition can cite. Cal TF's eTRM workpaper process is the long-game version.
- The 7-day pre/post metering the EP Protocol already produces **is** the evidence format TRM petitions want. Every verified install feeds the deemed case.

**CryoGenX4 (structural custom).** No TRM lists refrigerant-side additives; several utilities are explicitly skeptical of the category. Strategy: (a) never pitch it as deemed; (b) run it through custom applications *bundled with* the optimizer so the measure-level skepticism is diluted by a familiar controls measure and one metering event covers both; (c) build the IPMVP Option B evidence file toward emerging-technology program submissions (BPA/NEEA emerging tech, TVA pilots, utility R&D shops) — that's the only credible route to a deemed future; (d) in the meantime the additive's rebate value rides the custom $/kWh rate, which pays for measured savings regardless of measure pedigree.

**Frontier RTU (when manufactured).** Classic prescriptive fit everywhere high-eff unitary is deemed (nearly all Tier 1–2). Two launch requirements from this research: **AHRI certification at launch** (every prescriptive form asks for the AHRI number) and **heat-pump classification** where possible — HP-replacement measures pay multiples of AC-replacement measures (OR: $350/ton HP vs zero for straight AC swap).

**Solar thermal / thermal barrier.** Custom-only; include in custom packets where the savings model supports them; building-shell prescriptive exists for barriers in a handful of territories — routing-table detail, not strategy.

---

## 5. Per-tier application SOPs

**SOP-A — Deemed (Tier 1).**
1. Eligibility matcher names program + deemed $ at audit time → rebate line in proposal (sourced).
2. Confirm program-year funds + measure spec fit; check pre-approval threshold (most deemed programs: none below $10–50k).
3. Install → assemble packet (application form/portal, invoice, spec sheet, AHRI/UL docs, W-9) — Generator A output, human review, submit.
4. Track to check; typical 4–10 weeks (OR publishes 6–8 weeks; Dominion VA up to 90 days). Rebate assigned to customer unless the deal papers assign it to Energy Plus (decide per deal; assignment-to-contractor forms exist in most programs).
**Cost when automated: <1 admin-hour/application.**

**SOP-B — Custom M&V (Tier 2, and CryoGenX4 everywhere).**
1. **Iron rule: pre-approval before install.** Nearly every custom program disqualifies work begun before the approval letter (PECO's waivability is the exception, not the rule).
2. Pre-approval packet from audit data: savings workbook ($/kWh programs want first-year kWh; our cooling-share model feeds it), M&V plan instantiated from the EP Verification Protocol (7-day pre/post, Fluke/HOBO, IPMVP Option B), cost documentation. Generator B output.
3. Utility engineering review (2–8 weeks; Dominion SC best-in-class at days, NY/IL slowest). Take the reviewer's call personally — it's also the third-party validation channel (GTM §5.3).
4. Install inside the approval window → post-metering → final report from logger CSVs → final submission → payment 60–120 days.
5. The same metering event feeds: the rebate, the customer's savings verification, the pilot contract threshold, and the case-study file. Never meter twice.
**Note metering durations:** most programs accept short-interval IPMVP plans; a minority specify 30-day+ or full-season normalization — the routing table records this per territory (`mv_requirements`), and proposals in those territories must carry the longer timeline.

**SOP-C — Midstream/instant (IA, MA, RI equipment; OK, TX standard-offer variants).**
No customer application. Procurement routes through a participating distributor (equipment) or an approved sponsor aggregates the project (TX standard-offer). Action: get the optimizer/Frontier onto midstream qualified-product lists where they exist — that's a one-time vendor task per program, then rebates apply at invoice with zero paperwork per deal.

---

## 6. Cost & speed model (why automation pays)

| | Manual today | With routing table + generators |
|---|---|---|
| Find programs + rates per site | 2–6 hrs of research | seconds (eligibility matcher at audit) |
| Deemed application | 3–6 hrs | <1 hr (review + submit) |
| Custom pre-approval packet | 12–25 hrs (workbook, M&V plan, forms) | 2–4 hrs (generated, engineer reviews) |
| Custom final report | 8–15 hrs | 1–2 hrs (logger parse + template) |
| Risk of stale/wrong rate in a proposal | high (this research found live pages contradicting PDFs) | low (sourced rows + `verified_on` staleness alarms) |

At Kite-rollout volume (10–20 buildings), automation converts rebate filing from a ~$15–30k/yr admin burden into a near-zero marginal cost — and speed-to-check compresses because packets are complete on first submission (incomplete packets are the #1 published cause of rebate delays).

---

## 7. Data governance (rebate data rots)

- Program years mostly roll July 1 / Jan 1; several territories exhaust funds mid-year (recorded per row in `budget_cycle`). NY's current C&I year has a **Sept 30, 2026 install deadline** — live example.
- Every routing-table row carries `verified_on` (July 2026 for this dataset). **Re-verify Tier-1 rows at each program-year rollover and before any proposal cites a number older than 6 months.** The corrections log (`rebate-data/corrections.txt`) shows why: 15 of 51 states had at least one material error caught only by re-checking primary sources.
- Two flagged follow-ups requiring a human call, not research: TVA custom rates (KY/TN — email TVABusinessIncentive@tva.gov) and Louisiana's post-restructuring program terms (LPSC General Order 01-08-2026).

## 8. Ninety-day actions (folds into GTM Q3/Q4)

1. File the three home-territory trade-ally enrollments (Duke, Dominion SC, Santee Cooper) — this month, assistants execute (extends GTM Q3-5).
2. Load `rebate-states.csv` + `rebate-programs.csv` into the intake app database (software spec P0) and import to Notion for human browsing.
3. Add the rebate line to the Bill Audit readout for Tier-1/2 states (spec P1) — it strengthens the audit's perceived value immediately.
4. Qualify the optimizer against the ARC measure specs of NC, SC, WI, IL, OR, UT (one engineering memo, Cliff owns) — this decides where "automatic rebate" appears in sales language.
5. On Kite test completion: file the custom pre-approval for the rollout sites as the *first live run* of SOP-B, and start the TRM-petition evidence file with the test's M&V data.
