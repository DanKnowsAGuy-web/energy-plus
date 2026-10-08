# Path 2: Bundling the Optimizer Up to the ARC Definition — Cost & Earnings Analysis

**Date:** July 19, 2026 · **For:** Dan (decision), Cliff (engineering review)
**Question:** What does it take — components, dollars, labor — to make our retrofit qualify for the "Advanced Rooftop Controls" prescriptive rebates, and is the money worth it?
**Sourcing rule:** every figure carries its source; ASSUMPTION marks the few numbers we had to estimate; confidence flagged per item.

---

## 1. What an ARC retrofit actually requires (per program, from the primary documents)

| Program | Required functions | VFD mandatory? | Key fine print |
|---|---|---|---|
| **Duke NC/SC** (Smart $aver) | Supply-fan **VFD + air-side economizer + DCV** — all three, verbatim requirement | **Yes** — no lite tier exists | Single-zone existing units only; economizer must reset min position during unoccupied hours; repairing an existing economizer doesn't count; rebate **capped at 75% of equipment cost**; tune-up bundling rule on existing units |
| **Energy Trust OR — Full** ($200–300/ton) | Digital **integrated economizer + proportional DCV (CO2)** | **No** — Full tier is for units with a single-speed fan and *no* existing economizer/CO2; adding a VFD is not required | ≥5-ton units; **controller must be on the BPA qualifying product list**; min 500 op-hrs |
| **Energy Trust OR — Lite** ($200/ton) | **VFD + controller** for variable-speed fan (no DCV needed) | Yes | Same BPA list requirement; 2,500–3,500 op-hrs |
| **wattsmart UT/WY/ID** ($500–$6,500/unit) | **VFD *or* multi-speed supply-fan motor** + integrated economizer (new-HP tier adds CO2/occupancy DCV) | **No — multi-speed fan alternative explicitly allowed** | Packaged RTUs only (no splits); unit age 1–15 yrs (older needs pre-approval — note: our sweet spot is aging units); **capped at 100% of measure cost**; separate "DCV-only" add-on tier $300–$800 |
| **Focus on Energy WI** ($125/ton) | VFD + economizer + DCV per their tech sheet | Unverified | **Exact requirement text not yet verified** — confirm in the 2025 WI TRM before quoting (flagged) |

Sources: Duke Smart $aver Heating & Cooling application (southernlightingservices.com mirror of Duke 2022 v2 PDF); Energy Trust Form 120HVAC v2026.2 p.9; Rocky Mountain Power UT incentive list (eff. 7/11/2025) + WY HVAC application; Focus on Energy BIZ_RTU_TS tech sheet.

**Two structural discoveries:**
1. **Oregon's Full tier is our cheapest door** — economizer + DCV, no VFD hardware, on exactly the units we target (single-speed fan, no existing economizer).
2. **The BPA qualifying-product-list gate (OR, and BPA-territory utilities in WA/ID/MT):** bundling generic components does NOT qualify there — the *controller* must be a listed product. Our optimizer is not on that list. Options: (a) partner/resell a listed ARC product in those territories, or (b) pursue QPL listing for our controller (a defined application process — a concrete "get deemed" workstream). Duke and wattsmart have no such list requirement — components just have to perform the functions.

---

## 2. What the bundle would likely cost us (hardware, per RTU)

**Option A — assemble it ourselves** (5-ton class, 1–2 HP blower):

| Component | Cost | Source / confidence |
|---|---|---|
| Our optimizer | $400 | internal (GTM plan) |
| Supply-fan VFD, 1–2 HP (Yaskawa GA500/V1000 class) | $538–$1,063 list | RSP Supply distributor listing — moderate confidence; distributor net will be lower |
| Economizer retrofit kit (Honeywell JADE W7220 module + actuator + sensors) | ~$600–$1,000 — only the $299 module price is confirmed; full-kit total **not published** | Midwest Supply ($299 module); range is ASSUMPTION pending a distributor quote — **get a real quote** |
| CO2 sensor (commercial, duct/wall) | $195–$373 | Kele confirmed price — moderate confidence |
| **Hardware total (Duke-style full bundle)** | **≈ $1,750–$2,850** | |
| **Hardware, Oregon-Full-style (no VFD)** | **≈ $1,200–$1,775** | |
| **Hardware, wattsmart multi-speed-fan route** | VFD swapped for multi-speed motor+controller — **not yet priced**; flagged for Cliff | |

**Option B — buy an integrated ARC kit** (e.g., Transformative Wave CATALYST): **$2,500–$3,000 equipment per RTU** (8–10-ton units, UC Davis/SPEED case study; also the product class behind the PNNL-22656 study — avg 57% total RTU energy reduction across 66 units). Already BPA-listed → solves the QPL gate in the Northwest, but likely displaces our optimizer as the brain (see §5).

## 3. Our cost to install (labor)

- Integrated-kit benchmark: **~10 man-hours per RTU** (2 techs × 5 hrs — UC Davis/SPEED case study; moderate confidence).
- Self-assembled bundle: expect the same or slightly more (VFD mount/wire + economizer hardware + sensor + controls integration): **ASSUMPTION 10–16 hrs**. At a subcontractor rate of $85–$125/hr (ASSUMPTION — market rate, not sourced): **≈ $850–$2,000 labor per unit**.
- Contractor-market sanity check: RTU economizer retrofits alone are marketed at $1,500–$5,000 installed (single contractor-marketing source, low confidence).

**All-in installed cost per 5-ton unit (our cost, before margin):**
- Duke-style full bundle (self-assembled): **≈ $2,600–$4,900**
- Oregon-Full-style (no VFD): **≈ $2,050–$3,800**
- Integrated kit route: **≈ $3,350–$5,000**

(For comparison: optimizer-only install today ≈ $400 hardware + ~1–2 hrs labor ≈ **$600–$700** all-in.)

## 4. What we could earn (prescriptive rebate per unit)

| Unit | Duke NC/SC (HP / AC-gas) | Energy Trust OR Full | wattsmart UT retrofit | WI (unverified) |
|---|---|---|---|---|
| 5-ton | $1,585 / $1,260 | $1,000–$1,500 | $500 (<5t tier boundary — confirm mid-tier) | $625 |
| 10-ton | $2,255 / $2,310 | $2,000–$3,000 | mid-tier (between $500 and $4,500 — exact step not in our extract; pull from the incentive-list PDF) | $1,250 |
| 20-ton | $3,190 / $3,300 | $4,000–$6,000 | $4,500 gas / up to $6,500 HP | $2,500 |

Caps that bite: Duke pays at most **75% of equipment cost** — on a 5-ton HP the $1,585 chart value only pays in full if documented equipment cost ≥ $2,113 (our self-assembled BOM sits right at that line; itemization strategy matters). wattsmart caps at **100% of measure cost** — on big units the rebate can approach *fully funding the bundle*.

**Net position examples (rebate minus the *incremental* cost of bundling beyond optimizer-only, midpoint estimates):**
- **5-ton, Duke:** incremental bundle cost ≈ $2,000–$4,200 → rebate $1,260–$1,585 covers ~40–65%. Not free — justified only because the added components add real savings (fan + economizer measures are the majority of the PNNL-measured 57% avg reduction), which feeds the 20–55% claim and savings-multiple pricing.
- **10-ton, Duke:** incremental ≈ $2,200–$4,500 → rebate $2,255–$2,310 covers ~55–100%. **Break-even territory.**
- **20-ton, wattsmart HP:** rebate up to $6,500 vs bundle cost ~$3,000–$5,000 → **rebate can exceed our cost** (program caps at 100% of measure cost — i.e., customer-side cost approaches zero).
- **Oregon Full, any size ≥5t:** cheapest bundle (no VFD) meets the richest structural fit — **but blocked by the QPL gate until we list or partner.**

**Bottom line: the bundle economics flip from "subsidized upsell" at 5 tons to "rebate pays for most or all of it" at 10+ tons.** Size of unit matters more than state.

---

## 5. The open engineering questions (Cliff's memo, now sharpened)

1. **Can our optimizer be the integrated controller** — running economizer logic and DCV proportional control — or does it coexist with a JADE-class economizer module? Duke/wattsmart don't require a listed product, only the functions; if our box can't run them, the "bundle" is really *components + our optimizer alongside*, which still qualifies functionally but adds cost.
2. **Multi-speed fan motor route (wattsmart):** price and labor for a multi-speed blower motor + controller vs a VFD on 2–10-ton RTUs — explicitly allowed there, possibly cheaper.
3. **BPA QPL listing:** requirements and timeline to get our controller listed (unlocks OR/WA/ID BPA-territory deemed money with our own product).
4. **Get real quotes:** full JADE Y-Pack kit net price and CATALYST current 2026 pricing (both figures in this memo are the weakest links — one is an assumption range, the other is a 2013 case study).
5. **Verify WI's requirement text** in the 2025 Focus on Energy TRM before any WI quote.

## 6. Recommendation

- **Rebate-rich, big-tonnage deals (10+ ton units, Duke/wattsmart territories): bundle by default.** The rebate covers 55–100%+ of the incremental cost and the added measures deepen verified savings — this is the configuration to pilot on the first NC/SC portfolio site.
- **Small units (≤5 ton) or thin-rebate states: optimizer-only via the custom door.** The bundle doesn't pay for itself on rebate alone at that size.
- **Northwest (BPA territories): don't bundle generic components** — decide partner-vs-QPL-listing first.
- Sequence: Cliff answers §5 Q1–Q2 → one distributor quote round (Q4) → pilot the bundle on the largest-tonnage units in the first rebate-state deal → feed its M&V into both the rebate application and the TRM-petition file (Path 3).
