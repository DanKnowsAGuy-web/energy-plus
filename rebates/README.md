# Utility Rebate Master List

One consolidated record per US jurisdiction (50 states + DC) of the utility money available for Energy Plus measures, built from the research sessions of July through September 2026. Open `index.html` for the working page, or load `data/master-list.csv` into a spreadsheet or Notion.

## What is consolidated here

| Layer | What it answers | Source sweep | Files |
|---|---|---|---|
| Rebate layer (archetypes A, B, C) | Which utility reimburses the customer for our measures, how we file, what it pays, how fast | July 19, 2026. 51 jurisdiction sweeps, each adversarially fact-checked (36 confirmed, 15 corrected), cross-state calibrated, completeness-audited | `data/rebate-states.csv`, `data/rebate-programs.csv`, `data/corrections.txt`, `data/patches.json`, `data/adjustments.json` |
| Peak-demand layer | Which ISO/RTO or utility pays the customer for shaving or shifting peak load (demand response, curtailment tariffs, grid services) | September 22, 2026, incentive-stack phase 0 | `data/dr-by-state.csv` |
| Aggregator layer (archetype D) | Where a third-party implementer is paid on metered savings (pay-for-performance, NMEC), which is the only path that lets CryoGenX4 earn an incentive without a TRM listing | September 22, 2026. 20 states recorded as `not_screened`, not `not_found` | `data/archetype-d-screen.csv`, `source/archetype-d-notes.md` |
| Federal layer | Post-OBBBA status of 179D, Section 48 and 48E, bonus depreciation, USDA REAP, SBA 504 Green, GGRF, EECBG, SEP, IRA home rebates, FERC Order 2222 | September 22, 2026 | `data/federal-mechanisms.csv`, `source/federal-notes.md` |
| Calculator research | Incentive trigger table for the savings calculator (FL, TX, SC, GA, CA, NY utilities), demand-charge constants, default supply rates by state | September 9, 2026 | `source/09-incentives-master-list.md` here; `04-demand-and-battery.md`, `10-brokering-default-rates-by-state.md` and `10b-pa-oh-live-small-business-offers.md` stay in the Drive research folder |

The merged per-state record is `data/master-list.json` (what the page renders) and `data/master-list.csv` (flat, one row per state, sorted by commercial rank).

## How the layers were joined

Each layer keys on the two-letter state abbreviation. Nothing was re-researched or re-scored in the consolidation; every figure is exactly as the originating sweep recorded it, with its `verified_on` date and source URLs carried through. One derived field was added:

**Peak-demand readiness** (`strong`, `available`, `thin`, `none`, `unscreened`) summarizes `dr-by-state.csv` for the map and the master table. It is `strong` when the row is high confidence or a dollar payment is published at medium confidence, `available` when the state sits in an organized wholesale market or a named utility program exists at medium confidence, `thin` when programs are known but unverified, and `none` when no program was found. The rule lives in `build.py` and can be changed there.

## Strategy documents

`source/` holds the plans the data was built for, unchanged from the Ops folder:

- `UTILITY-REBATE-MASTER-PLAN.md`: the three application archetypes, state tiering, trade-ally enrollment sequence, per-tier SOPs, data governance.
- `REBATE-AUTOMATION-SOFTWARE-SPEC.md`: routing table plus three packet generators, build phases P0 to P4.
- `INCENTIVE-STACK-PLAN.md`: extends the routing table to every money mechanism (archetype D, financing, tax, grants, DR revenue, compliance drivers, packaging).
- `ARC-BUNDLE-ANALYSIS.md`: what it costs to bundle the optimizer up to the Advanced Rooftop Controls definition, and where the rebate pays for it.
- `Stream2-EaaS-Dealer-DR-Norms.md` and `partner-program-entry-points.md`: the September 27 partner research on demand-response aggregators (Voltus, Enel X, CPower, Leap) and program entry points, kept here because they are the channel side of the peak-demand layer.

The wiki project page (`rebate-automation.md`) and the calculator constant notes stay in the Drive Ops folder.

## Rebuilding the page

```
cd rebates
python3 build.py data data index.html
```

`build.py` reads the five source CSVs in `data/`, writes `master-list.json` and `master-list.csv` there, and renders `index.html` from `template.html`. The page is self-contained (data embedded, fonts from Google Fonts) so it can be opened from disk, served from GitHub Pages, or published as an artifact.

## Freshness

Rebate data rots. Program years mostly roll July 1 or January 1 and several territories exhaust funds mid-year. The master plan's rule stands: re-verify tier-1 rows at each program-year rollover and before any proposal cites a number older than six months. As of this consolidation (October 8, 2026) the rebate layer is about three months old and the peak-demand, aggregator and federal layers about two weeks old.

Two items still need a human call rather than research: TVA custom rates (TVABusinessIncentive@tva.gov) and Louisiana's post-restructuring program terms (LPSC General Order 01-08-2026).

## Known limitations of the value ranking

An audit of the scoring logic on October 8, 2026 found the arithmetic sound (all 51 published scores recompute from their dimension scores at the stated weights) but the judgment behind it fragile. Treat the commercial rank as a program-quality index, not a sell-here-first list, until the items below are addressed.

- **No market-size term.** The score asks how good a state's program is, not how many target buildings sit under it. Idaho ranks second and Wyoming tenth, above New Jersey and Washington.
- **"Deemed" is scored as unconditional when it is conditional.** Deemed availability carries 25 percent of the score, and 10 of the 13 deemed states carry a flag saying the compressor-cycling optimizer may not meet the Advanced Rooftop Controls spec on its own. The bundle that fixes this costs roughly $2,000 to $4,900 per unit (`source/ARC-BUNDLE-ANALYSIS.md`) and is not reflected in the score. North Carolina's first place rests on this.
- **Speed scored without evidence in six states.** Oklahoma, Washington, Hawaii, California, Rhode Island and New Hampshire have no published payment timeline but a speed score of 3.
- **Generosity compares incomparable units by impression.** Rates arrive as $/ton, $/unit by tonnage, $/fan horsepower, $/kWh and percent of cost. No reference project was priced, so a 5 in one state and a 5 in another are two researchers' judgments. The only recorded cross-state calibration is one Massachusetts dimension moved by one point (`data/adjustments.json`).
- **Corrections did not feed back into scores.** `data/corrections.txt` logs 28 corrections, some large (Missouri's ARC rebate is $1,500 per fan horsepower, not about $130 per ton; New Jersey's enhanced pathway pays up to $2.50 per kWh), with no matching score changes.
- **The unit is the state, but the money is the territory.** Illinois has two very different programs and one score. The routing table in the software spec is per territory; the ranking should be too.

Recommended fix, in order: price one reference project (a 10-ton RTU optimizer install, with and without the ARC bundle) per territory from the recorded rates to replace the generosity and deemed-availability impressions with dollars; add a market-size weight and rank territories; then re-verify the dozen figures that move the ranking against live program pages.
