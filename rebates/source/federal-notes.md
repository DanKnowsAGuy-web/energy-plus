# Federal Incentive Layer — Method, Sources, and Reasoning
Energy Plus (commercial HVAC efficiency, SC-based) — compiled 2026-09-22

## Method

This research was conducted entirely by live WebSearch and WebFetch queries against primary and
near-primary sources during this session — no figure, date, or percentage in
`federal-mechanisms.csv` was taken from model training data without an attempt at
independent verification. Primary sources used where fetchable directly:

- `uscode.house.gov` — statutory text of 26 U.S.C. §§ 48, 48E, 179D
- `irs.gov` — the official OBBBA transition FAQ (FS-2025-05) and IRS Notice 2026-11 on bonus
  depreciation
- `epa.gov` — the Greenhouse Gas Reduction Fund program status page
- `energy.gov` (DOE 179D page, DOE Office of State and Community Energy Programs page)
- `energy.sc.gov` — South Carolina's own EECBG program page (used because EP is SC-based)
- `federalregister.gov` — the 2026 §45Y inflation-adjustment notice

Several official pages refused direct WebFetch with HTTP 403 (notably `rd.usda.gov` pages,
`congress.gov` CRS products, and some law-firm alert pages). For those, I relied on the
WebSearch tool's own content retrieval (which fetches and quotes the live page rather than
using stored knowledge) and cross-checked each fact against at least one independent secondary
source (law firm alert, CPA firm alert, or trade-press article) before including it. Every
`sources` URL in the CSV is a URL that was actually returned and read via WebSearch or
WebFetch this session — none were guessed or filled in from memory.

This session's WebSearch quota (200 calls) was exhausted partway through research. After that
point I relied exclusively on WebFetch against specific URLs surfaced by earlier searches. This
means a small number of "as of today" status checks (noted below) could not be freshly
re-verified in the final stretch and are flagged as such rather than asserted with full
confidence.

## Per-mechanism reasoning (where status was non-obvious)

### §179D — construction-start vs. placed-in-service cutoff
Multiple secondary sources initially gave inconsistent framing (one DOE-derived WebFetch summary
said "placed in service on or before 6/30/2026," which would be a materially different — and
more favorable — cutoff than what several CPA-firm alerts described). I resolved this by
fetching the actual statutory text at uscode.house.gov, which added new subsection 179D(i):
*"This section shall not apply with respect to property the construction of which begins after
June 30, 2026."* That is unambiguous: the cutoff is a **construction-start** date, not a
placed-in-service date. A retrofit beginning construction in October 2026 is squarely outside
the window. I treat this as **high confidence**.

### §48/§48E and geothermal heat pumps vs. air-source heat-pump RTUs
This is worth flagging explicitly because it's an easy, expensive mistake: the Section 48
"geothermal heat pump property" credit (6% base / 30% bonus, good through construction starting
2034, phasing to zero after) applies only to true ground- or water-source heat pump systems.
Energy Plus's "heat-pump RTU" product is an air-source packaged rooftop unit. Nothing in the
statute or any secondary source reviewed extends the geothermal credit to air-source equipment.
**High confidence this credit does NOT apply to EP's heat-pump RTU measure.**

### §48/§48E and solar thermal — genuinely unresolved
This was the hardest item to pin down and I want to be explicit that I could not fully resolve
it. The chain of reasoning:
1. Legacy §48 "solar energy property" explicitly includes equipment that heats/cools a structure
   or provides hot water/solar process heat — i.e., solar thermal is unambiguously within scope
   of the *old* statutory definition.
2. Multiple sources state that §48's technology-specific rules for most technologies (solar
   included) require construction to have begun before 1/1/2025, with geothermal heat pumps
   carved out to a later date. I did not find an equivalent carve-out for solar thermal.
3. The replacement mechanism, §48E, is titled the "Clean Electricity Investment Credit" and its
   statutory eligibility test (a "qualified facility" that produces electricity with a
   greenhouse-gas emissions rate of zero or below) is written around electricity generation.
   Non-electric solar thermal does not generate electricity.
4. One secondary source (Eide Bailly) stated that "no Section 48E credit is allowed for property
   attributable to qualified solar water heating expenditures... for tax years beginning after
   July 4, 2025" — but I could not confirm whether this is describing a real 48E-specific
   carve-out or is actually describing a different code section (possibly a garbled reference to
   the §25D residential repeal). I flag this as a real risk of secondary-source error, not a
   confirmed fact.

Net: I could not confirm from primary statutory text or Treasury regulation whether commercial
solar thermal property beginning construction in 2025 or later has **any** live federal ITC
pathway. This is marked "unclear" in the CSV, on purpose, per the task's own instruction to do so
rather than guess. **This is the most important unresolved item in this deliverable** — see the
"five findings" list below.

### Bonus depreciation and HVAC/controls MACRS classification
Confirmed via IRS Notice 2026-11 (primary source) that 100% bonus depreciation is now permanent
for qualified property acquired after January 19, 2025. What I could **not** confirm from a
primary source is how, specifically, an IRS examiner would classify EP's various measures under
MACRS — this depends on whether the installed equipment is a "structural component" of the
building (39-year real property, generally no bonus depreciation) versus tangible personal
property or Qualified Improvement Property (15-year, bonus-eligible). This is a
long-standing, fact-specific area of tax law (the entire cost-segregation industry exists because
of this ambiguity) and no amount of general web research substitutes for a cost-segregation
study of an actual EP project. I flagged this as **medium confidence** — the permanence of 100%
bonus depreciation is high confidence; how cleanly it applies to a given EP job is not.

### USDA REAP — grant pause
This is a live, moving situation. I found consistent reporting (rd.usda.gov's own FAQ PDF
filename, dated 3/31/2026, plus trade press from DTN/Progressive Farmer, Civil Eats, and the
National Sustainable Agriculture Coalition, all dated around April 2026) that USDA halted **all**
REAP grant awards — both energy-efficiency and renewable-energy categories — pending a
rulemaking to align 7 CFR 4280 Subpart B with Executive Order 14315. Direct WebFetch to the
official rd.usda.gov pages returned HTTP 403 both times I tried, so I could not do a final
"as of 9/22/2026" freshness check against the primary source before my WebSearch quota ran out.
**Medium confidence that the pause is still in effect today; treat the CSV row as needing a
live phone/email check with a USDA Rural Development state office before quoting to a customer.**

### Greenhouse Gas Reduction Fund
High confidence — confirmed directly from EPA's own program page (a primary source that loaded
successfully), which states plainly that OBBBA repealed CAA §134 and rescinded GGRF funding, and
that all three components (NCIF, CCIA, Solar for All) have been terminated, with litigation
ongoing over the Solar for All terminations specifically. This program was never a strong direct
fit for EP's commercial HVAC/controls measures (it primarily capitalized green banks and
residential solar), so its termination has limited practical impact on EP beyond removing it as
a talking point entirely.

### EECBG / State Energy Program
High confidence these remain active and funded — confirmed via DOE's own SCEP page and (as a
second, SC-specific check since EP is SC-based) South Carolina's own EECBG program page, which
shows an actively open application round. Both are **pass-through-to-government** programs,
meaning EP cannot sell directly against them for its private commercial customers; the only
angle is EP acting as a paid implementer/contractor if a municipality or Tribal government uses
EECBG/SEP funds for its own facilities.

### FERC Order 2222
Included per the task's request for one context row on wholesale DR participation. The
consequential finding here is local, not national: Energy Plus's home territory (South Carolina,
Duke Energy Carolinas/Progress and Dominion/Santee Cooper service areas) is vertically-integrated
utility territory, not inside a FERC-jurisdictional RTO/ISO. Order 2222 only creates wholesale
market access where an RTO/ISO exists to sell into. This means Order 2222 is currently close to
irrelevant for EP's core SC customer base, and should not be used as a revenue talking point
there. **Medium confidence** on the SC-not-in-an-RTO characterization — this is a well-known
industry fact but I did not independently re-verify it against a FERC or SC PSC filing this
session; flagged as a small residual risk.

## Unresolved / needs follow-up before customer-facing use

1. **Solar thermal ITC status (§48/§48E)** — see above. Needs a tax attorney's written opinion.
   Do not quote an ITC percentage for solar_thermal until this is resolved.
2. **2026 inflation-adjusted §179D dollar-per-square-foot figures** — I have confirmed the 2025
   figures ($0.58-$1.16 / $2.90-$5.81) but could not locate a distinct, confirmed 2026 IRS
   revenue procedure figure. Given the 6/30/2026 construction-start cutoff, this is a narrowing
   window regardless of the exact current-year number, but get the exact figure before quoting.
3. **USDA REAP grant NOFO reopening status** — last confirmed status is "paused as of 3/31/2026
   pending rulemaking"; could not do a fresh 9/2026 check before the WebSearch quota ran out.
   Call a USDA Rural Development state office or check rd.usda.gov directly before including
   REAP grant dollars in any live proposal.
4. **Section 179 expensing cap under OBBBA** — widely reported as increased alongside bonus
   depreciation, but I could not confirm the exact new dollar cap/phase-out threshold from a
   primary IRS source this session. Folded into the MACRS/bonus depreciation row with this
   caveat rather than asserting a specific number.
5. **USDA REAP guaranteed-loan guarantee percentage and maximum loan size** — official
   rd.usda.gov program pages returned HTTP 403 on direct fetch both times attempted; the
   qualitative "loans still open while grants are paused" fact is confirmed, but the specific
   loan terms are not independently verified this session.
6. **SC RTO/ISO status for FERC Order 2222 purposes** — treated as well-established industry
   background rather than freshly verified against a FERC docket this session.

## Five findings that most change what Energy Plus should say in a proposal

1. **§179D is a fast-closing door, not a standing offer.** Construction must *begin* by
   6/30/2026 — not merely be planned or contracted. Any EP deal not yet under construction should
   be evaluated now for whether it can hit a construction-start safe harbor before that date;
   after it, 179D disappears entirely for that project regardless of when work happens.
2. **The "heat-pump RTU" is not a geothermal system for tax purposes.** EP should scrub any sales
   language that implies its air-source heat-pump RTU offering qualifies for the 30% geothermal
   §48 ITC — it does not. Conflating the two risks a customer's tax return (and EP's
   credibility) if a preparer later disallows a claimed geothermal credit.
3. **Solar thermal's federal tax-credit story is currently unclear, likely weak, and should not
   be sold on a specific percentage.** Both consumer-facing repeal (§25D, confirmed dead
   1/1/2026) and the commercial pathway (§48/§48E, genuinely unresolved whether non-electric
   solar thermal qualifies at all post-2024) point the same direction. Until resolved by counsel,
   solar thermal should be sold on utility rebates, depreciation, and direct fuel/electric-cost
   savings — not an ITC line item.
4. **100% bonus depreciation is now permanent — this is probably EP's best universal federal
   talking point** — but its strength varies by measure. Add-on controls/optimizer/CryoGenX4
   equipment (personal property, not structural) has the cleanest case for full first-year
   write-off; RTU replacements that become structural building components are murkier and may
   need a cost-segregation opinion to substantiate 100% treatment. EP should not present bonus
   depreciation as uniformly "100% write-off" across all five measures without this caveat.
5. **USDA REAP, EP's most "on the nose" federal grant program for rural ag/small-business
   customers, is currently paused for new grant awards**, and even when it reopens it only
   reaches EP's rural agricultural and rural-small-business customers — a minority of EP's QSR/
   retail/hotel/distribution book. The SBA 504 Green loan program (no rural restriction, active,
   10% EUI-reduction threshold) is a better broad-based financing lever to lead with for EP's
   non-rural commercial customers right now.

## Scope note
Per instructions, nothing under `Ops\rebate-data\` or `Ops\Strategy\` was read or modified. This
deliverable covers the FEDERAL layer only; it does not attempt to reconcile against any
utility/state rebate data that may live elsewhere in the Energy Plus Ops folder.
