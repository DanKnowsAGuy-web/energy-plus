# Master prompt: Energy Plus Incentive Atlas (from scratch)

Paste everything below this line into a new Claude Code session running Claude Fable 5.1, in the `energy-plus` repository. Fill in the product inputs block at the end before starting, or leave the placeholders and the session will flag every figure that depends on them.

---

## 1. Mission

Build, from first principles and from primary sources only, a complete and verifiable record of every mechanism by which a commercial customer in the United States can get paid, credited, financed, or tax-advantaged for installing our four HVAC measures, with particular weight on mechanisms that pay for peak-demand reduction. Then rank the top 20 utility territories by how much money is realistically on the table for us, using a ranking model whose inputs are kept separate so the method can be swapped.

This is a one-time build. Nothing from earlier research in this repository or in Google Drive may be read or reused while the research is in progress. The `rebates/` folder in this repository and the Ops folder in Drive contain an earlier attempt that was found to have unverifiable figures. Do not open them until Section 9 says you may. Treat any figure you already "know" about a program as a hypothesis to be verified, never as data.

Units of analysis:

- The **utility territory**, not the state. Money is paid by a utility, a statewide administrator, a wholesale market, or a government program, and each has its own rules. A state record is a roll-up, never the source of truth.
- The **program**, inside a territory. One territory may have ten programs. Each gets its own record.
- The **measure fit**, inside a program. Each of our four measures gets its own eligibility verdict inside each program.

Customer segment: commercial only. Any building size and any demand level. Residential programs are out of scope, except where a program explicitly covers small commercial under a residential-style process, in which case record it as commercial.

## 2. What we sell

Four measures. Research each as a separate line item inside every program.

1. **HVAC optimizer.** A compressor-cycling controller retrofitted onto packaged rooftop units (RTUs). Reduces compressor run time and peak kW. The central eligibility question in most programs is whether it qualifies under the program's definition of "advanced rooftop unit controls" (often requiring economizer control, supply fan speed control and demand-controlled ventilation together) or falls to a custom path. Record the program's definition verbatim.
2. **CryoGenX4.** A refrigerant-side treatment applied to existing cooling equipment. Rarely named in any program. Record whether the program excludes "refrigerant additives", "power conditioning", "unproven technologies" or similar categories, and whether a measured-savings path (custom, pay-for-performance, NMEC) is open to it.
3. **High-efficiency RTU replacement.** Replacing a packaged unit with one above a stated efficiency tier (IEER, SEER2, CEE tier). Record the thresholds and the per-ton or per-unit rates by tier, and whether early replacement is allowed or only replace-on-burnout.
4. **Solar thermal retrofit.** An all-in-one system that replaces or supplements the unit and stores heat for more than one hour. This has no settled program category. For every program and every tax or grant mechanism, record how it would be classified under the published rules: solar thermal, thermal energy storage, "thermal battery", demand-flexible load, energy storage under Section 48E, custom efficiency measure, or not eligible. Quote the definition that drives the classification. Where no definition fits, say so. One dedicated agent in Phase 2 researches the general classification question across federal law, state storage programs and utility storage incentives, and each territory extraction then checks the local treatment.

Reference installs per measure are in the product inputs block (Section 11). Researchers never estimate savings, prices or tonnage. Those are inputs.

## 3. What counts as money

Research all of the following for each territory. Nothing is out of scope if it moves cash, credit or financing to the customer or to us.

- **Utility efficiency programs**: prescriptive or deemed rebates, custom or calculated incentives, midstream or distributor incentives, small business direct install, new construction and major renovation, bonus windows, bundling bonuses.
- **Demand response and grid services**: utility-run DR, wholesale-market DR reached through an aggregator (PJM, MISO, ISO-NE, NYISO, CAISO, ERCOT, SPP), capacity payments, emergency programs, auto-DR enabling incentives, bring-your-own-device style programs, load-flexibility pilots.
- **Tariffs**: demand charges by rate class, time-of-use windows and prices, ratchets, interruptible and curtailable rate credits, standby and storage riders, thermal energy storage riders, real-time pricing options.
- **Aggregator and pay-for-performance paths**: normalized metered energy consumption (NMEC) programs, pay-for-performance tariffs, third-party implementer programs where an installer is paid on metered savings, and whether a non-utility party can be the incentive recipient.
- **State mechanisms**: tax credits and deductions, sales and property tax exemptions, state energy office grants, green bank loans, state storage incentives, efficiency resource standards that fund the utility programs.
- **Financing**: on-bill repayment, on-bill financing, utility loans, C-PACE (record county-level availability for the counties that make up the territory), USDA REAP loans and grants, SBA 504 green loans.
- **Federal**: Section 48E investment credit (with the storage and thermal storage question), bonus depreciation, Section 179D status, REAP, any live grant program. Research this once, by one agent, with current statute and IRS guidance as sources, and apply it to all territories.

## 4. Evidence standard

This standard governs every figure and every criterion. An agent that cannot meet it records `unknown` with a reason. No agent ever estimates, infers, averages, or fills a gap from memory.

- **Primary sources only for numbers and criteria.** A primary source is the utility's program page, program manual, application form, measure catalog, technical reference manual (TRM), tariff sheet, regulatory filing, ISO manual, statute, or IRS guidance. DSIRE, news, vendor blogs and summaries may be used to discover that a program exists, never to supply a figure.
- **Every field carries provenance**: source document id, the exact quoted sentence or table row, page number for PDFs, retrieval date, the agent that extracted it, the agent that checked it, and a confidence grade of high, medium or low with a one-line reason. High means the quote states the figure directly in a current-program-year document. Medium means the figure is stated but the document's program year or applicability is ambiguous. Low means the figure comes from an indirect statement.
- **Evidence store on disk.** Every document fetched is saved once under `incentive-atlas/evidence/<territory-id>/` with a document id, URL, title, publisher, document type, retrieval date and SHA-256 hash, listed in `sources.csv`. Agents read from the store when a document is already there. No page is fetched twice.
- **Native units.** Record incentives exactly as published: per ton, per kWh saved, per kW, per horsepower, percent of cost, per unit, per square foot, per MMBtu, tiered tables, whatever the program uses. Unit normalization happens in the model layer (Phase 4), never in the record.
- **Dates.** Every program record carries program year start and end, the document's own date or version, and the retrieval date. A figure from a document for a program year that has ended is recorded with confidence low and a note.
- **Verbatim criteria.** Inclusion and exclusion criteria are quoted, not paraphrased. A paraphrase may sit next to the quote.
- **Unknown is a value.** An `unknown` field names what was looked for, where, and why it was not found (not published, behind login, PDF unreadable, conflicting documents). Unknown counts are reported per territory and per field in the deliverables.

## 5. Model routing rules

You are the orchestrator, running on Claude Fable 5.1. Spawn subagents with the Agent tool and set the `model` parameter per the table. Fable's cost is five times Opus and fifty times Haiku per token, so Fable does only what no cheaper model can do well.

| Role | Model | Agent `model` value | Effort | What it does | What it never does |
|---|---|---|---|---|---|
| Orchestrator | Fable 5.1 | (this session) | high; xhigh for adjudication | Plans, writes the schema and config, assigns work, adjudicates disagreements between researcher and checker, runs the final sample verification, reviews the ranking code, writes the final report | Bulk fetching, bulk extraction, reading whole PDFs, formatting |
| Territory synthesizer | Opus 5.5 | `opus` | high | Reads the extracted program records and evidence for one territory and writes the territory record: how we get paid here, per measure, with the unknown list | Fetching new pages except to resolve a specific contradiction |
| Adversarial checker | Opus 5.5 | `opus` | high | Fresh context, separate from the synthesizer. Receives the locked draft record and the evidence store and tries to falsify every figure and criterion against the sources, re-fetching live pages where the store is stale. Returns confirmed, corrected (with evidence) or unverifiable per field | Accepting a figure because it looks plausible |
| Dense-document extractor | Opus 5.5 | `opus` | medium | Program manuals, tariff books and TRMs longer than about 30 pages, or any document where the Sonnet extractor reports ambiguity | Discovery |
| Discovery and extraction worker | Sonnet 5.5 | `sonnet` | medium | Searches, fetches, saves to the evidence store, extracts fields with quotes into schema-valid JSON. One territory or one document set per agent | Judgment calls about eligibility beyond quoting the rule; estimating anything |
| Data puller | Sonnet 5.5 | `sonnet` | low | EIA-861, NOAA degree days, OpenEI utility rate database, C-PACE county lists, ISO DR manuals | Interpretation |
| Classifier and normalizer | Haiku 5.5 | `haiku` | low | Measure-fit first pass from quoted criteria, unit tagging, JSON schema validation, deduplication, link checking, CSV formatting, unknown counting | Any field that requires reading a document it was not given |
| Model builder | Opus 5.5 | `opus` | high | Writes and tests the ranking code and the page build script | Changing data |

Operating rules for every agent:

1. **Fresh context, narrow brief.** Each agent gets one territory or one document set, the schema, the evidence standard, and nothing else. No agent sees another agent's conclusions unless its job is to check them.
2. **Structured output only.** Agents return JSON that validates against the schema, plus a short list of unknowns and a short list of ambiguities. Prose summaries are not accepted. Haiku validates every return before the orchestrator reads it.
3. **Escalate up, never down.** If a Sonnet extractor returns unknown or ambiguous for a field that matters to the ranking (incentive rate, measure fit, cap, program year, DR payment, demand charge), re-run that field with Opus on the same documents before accepting unknown. Never re-run a failed Opus task on Sonnet.
4. **Separation of research and checking.** The checker is always a different agent instance from the researcher, with no shared context, and is told its job is to find errors. The orchestrator adjudicates any disagreement by reading the evidence itself, and logs the decision.
5. **Tool-call budgets.** Discovery and extraction workers: at most 40 tool calls each. Checkers: at most 60. If a worker hits its budget, it returns what it has with unknowns marked, and the orchestrator decides whether to spawn a continuation with a narrower brief.
6. **Parallelism.** Run five to eight workers at a time. Territories are independent, so run territory pipelines in parallel. Within a territory, discovery precedes extraction, extraction precedes synthesis, synthesis precedes checking.
7. **Retries.** A failed or truncated agent is re-run once with a narrower brief. A second failure is logged as unknown and reported.
8. **No memory of the old data.** If any agent encounters files under `rebates/` or Drive documents from the earlier attempt, it must not read them. Say so in every brief.
9. **Use the web through a saved copy.** Fetch tools save raw HTML or PDF to the evidence store first, then extract from the saved copy. If a site blocks fetching, use the browser tool, then save the rendered text. If a document is behind a login, record it as unknown with the URL.

## 6. Schema

Write the schema as JSON Schema files in `incentive-atlas/schema/` before any research starts. The fields below are the minimum. Add fields as the research reveals them, and log each addition.

**Territory** (`territory.json`): territory id, utility or administrator name, legal entity, state(s), type (IOU, municipal, cooperative, G&T, statewide administrator, federal power authority), wholesale market (ISO/RTO or none, with the sliver notes where a utility spans two), service counties, EIA utility id, commercial customer count, commercial sales MWh, commercial revenue, cooling degree days with station and normals period, cooling equivalent full-load hours with source, program administrator and implementer for efficiency programs, DR administrator, regulatory body, program year convention, verification summary (fields total, known, unknown, confidence counts), checked-by, locked-on.

**Program** (`program.json`): program id, territory id, program name, family (prescriptive, custom, midstream, small business, new construction, DR utility, DR wholesale, tariff, P4P or NMEC, aggregator, state tax, state grant, state rebate, financing, federal), administrator, implementer, sector eligibility, customer eligibility (rate classes, size thresholds, account conditions, quoted), site and building eligibility (quoted), contractor requirements (trade ally, licensing, quoted), timing rules (pre-approval before purchase, installation and submission deadlines, quoted), explicit exclusions (quoted), incentive table (one row per measure line as published: measure name as the program names it, unit, rate, tier conditions, cap), caps (per project, per customer per year, percent of cost, payback floors or ceilings, quoted), stacking rules (quoted), application method, documents required, M&V requirements (deemed, calculated, metered, pre and post inspection), payment recipient and whether assignment to a contractor is allowed, published payment timeline, program year start and end, total budget, remaining budget or waitlist status with date, funds-exhausted history, source document ids, retrieval date, confidence per field, unknown reasons.

**Measure fit** (`measure_fit.json`): program id, measure (optimizer, cryogenx4, rtu_replacement, solar_thermal), verdict (deemed, custom, p4p, excluded, unknown), deciding criterion quoted, the applicable incentive row(s), conditions to qualify (for the optimizer: what the controls definition requires beyond compressor cycling), confidence, checked-by.

**Demand response program** (`dr_program.json`): program id, territory id, operator (utility, ISO via aggregator, aggregator-run), market product name, payment basis (per kW-month, per kW-year, per kWh of event energy, capacity plus energy, bill credit), published rates, minimum kW, aggregation permitted, event count, hours and notice, season and hours, enabling technology incentive, penalties, enrollment window, telemetry requirements, named aggregators active in the territory, sources, confidence.

**Tariff** (`tariff.json`): territory id, rate schedule name, customer class, demand charge per kW with season and window, ratchet, energy charges by TOU period with windows, interruptible or curtailable credits, standby and storage riders, thermal storage riders, effective date, sheet number, source.

**Financing** (`financing.json`): territory id, mechanism (on-bill, utility loan, C-PACE, green bank, REAP, SBA 504), availability by county where relevant, terms as published, administrator, source.

**State and federal mechanism** (`mechanism.json`): jurisdiction, mechanism, statute or program, status as of retrieval date, key dates, value as published, eligible measures with the classification quote for solar thermal, sector, stackable with utility rebates (quoted), source.

**Source** (`source.json`): document id, URL, title, publisher, document type, program year or version, retrieval date, SHA-256, local path, fetched by.

**Decision log** (`decisions.jsonl`): one line per orchestrator adjudication: territory, program, field, researcher value, checker value, decision, evidence, date.

## 7. Phases

Treat the sequence below as the default plan. Adapt it where the evidence requires, and log every deviation in the decision log.

### Phase 0: Setup (orchestrator)

Create `incentive-atlas/` with `schema/`, `evidence/`, `data/`, `config/`, `build/` and `README.md`. Write the schemas. Write `config/product.json` from Section 11. Write `config/ranking.json` with the default method from Section 8. Commit. Checkpoint 1: show the user the schema field list and the product inputs and ask for confirmation or corrections. Proceed on confirmation.

### Phase 1: Universe and screen

Goal: the list of every utility territory worth considering, with enough data to pick the top 20.

1. Data puller (Sonnet): download the latest EIA-861 annual data (Sales to Ultimate Customers, Service Territory, and Utility Data tables). Build the universe of every utility with more than 25,000 commercial customers, plus every statewide efficiency administrator (Mass Save, Energy Trust of Oregon, Focus on Energy, Efficiency Vermont, Efficiency Maine, NYSERDA, New Jersey Clean Energy, Hawaii Energy, Delaware SEU, DC SEU, and any others found). Record EIA utility id, commercial customers, commercial sales and revenue, service counties.
2. Data puller (Sonnet): join cooling degree days (NOAA 1991 to 2020 normals, nearest first-order station to the territory's population center, record the station) and cooling equivalent full-load hours (from the state TRM where one exists, otherwise a named regional reference).
3. Discovery workers (Sonnet, ten territories per agent, two fields each): does the territory have a commercial efficiency program with HVAC measures (yes, no, unknown, with URL), and does it have or sit in a DR program open to commercial customers (yes, no, unknown, with URL). Existence only, no figures.
4. Haiku: compute a preliminary prize index for each territory as commercial customers times cooling degree days, zeroed where no commercial efficiency program exists. Sort.
5. Checkpoint 2: present the top 30 to the user as a table (territory, state, type, commercial customers, CDD, efficiency program yes/no, DR yes/no, preliminary index) and ask them to confirm or edit the top 20. Proceed with the confirmed 20. Keep the full universe table as a deliverable.

### Phase 2: Deep research, one pipeline per territory, run in parallel

For each of the 20 territories:

- **2a Discovery** (Sonnet): enumerate every program, document and tariff relevant to Section 3 for this territory. Save every document to the evidence store. Return the document list with types and the program list with families. Include the ISO or RTO DR manuals where the territory sits in a market, the state energy office and green bank pages, the C-PACE administrator for the territory's counties, and the current tariff book.
- **2b Extraction** (Sonnet per program; Opus for dense documents): fill a program record per program, a tariff record per relevant rate schedule, a DR record per DR program, and financing records, from the saved documents, with quotes.
- **2c Measure fit** (Haiku first pass from the quoted criteria; Opus confirms every partial or unknown verdict and every optimizer verdict): one measure-fit record per program per measure.
- **2d Synthesis** (Opus): the territory record, including a plain-language "how we get paid here" per measure, the unknown list, and the ambiguities list.
- **2e Adversarial check** (Opus, fresh context): every field in every record for the territory. Output per field: confirmed, corrected with evidence, or unverifiable with reason.
- **2f Adjudication and lock** (orchestrator): resolve every correction and every unverifiable field by reading the evidence. Write decisions to the log. Mark the territory locked with a date.

Two cross-cutting agents run once, not per territory:

- **Federal and classification agent** (Opus): the federal mechanism records, and the general solar-thermal classification memo covering Section 48E energy storage definitions and thermal energy storage property, state storage incentive definitions, and how utility storage and load-flexibility programs define eligible thermal storage. Output goes into `mechanism.json` records and `data/solar-thermal-classification.md`, every claim quoted.
- **Wholesale DR agent** (Opus): one record per ISO or RTO commercial DR product, with rules, payment basis, minimum sizes and aggregator requirements from the ISO manuals, so territory agents reference it instead of re-researching it.

### Phase 3: Market and climate completion

Haiku checks every territory record has its EIA, CDD and full-load-hour fields filled with sources. Sonnet fills gaps. Where CBECS regional building-stock data by principal building activity is straightforward to attach, attach it as an optional field; do not let it block.

### Phase 4: Model

Model builder (Opus) writes `build/model.py`, reviewed by the orchestrator. It reads only the locked records and `config/`. For each territory and each measure it computes the three measurements in Section 8 and writes `data/ranking.csv` with every input column visible. It also writes `data/sensitivity.csv` showing each territory's rank under every ranking method in the config. It writes `build/page.py` producing a self-contained HTML page per Section 10.

### Phase 5: Sample verification (orchestrator)

For each locked territory, pick three numeric figures and two criteria at random. Re-fetch their sources live and confirm the quote still appears and the figure matches. If more than one of the five fails, the territory goes back to 2e with a fresh checker and the failures listed. Record the pass rate per territory in the README.

### Phase 6: Deliverables and report

Build everything in Section 10, commit, push, and write the final report (Section 12).

## 8. Ranking model

The model keeps three measurements as separate columns and never merges them inside the data. Ranking methods combine them in `config/ranking.json` and can be changed without touching the data.

**Measurement A: dollars per reference install**, per measure, per territory. For each program where the measure's verdict is deemed, custom or P4P, apply the published rate to the reference install (tons, kWh saved, kW shaved, installed price from `config/product.json`), apply caps and percent-of-cost limits, and take the best single program plus any stackable DR revenue and tariff savings. Report the arithmetic in a column so a reader can check it. Where a required input is unknown, the result is `unknown`, not zero. Record separately: utility rebate dollars, DR revenue per year, demand-charge savings per year, tax value, financing value (as a yes/no with terms, not a dollar figure).

**Measurement B: probability of collecting**, per measure, per territory, a multiplier between 0 and 1 built from recorded facts: measure-fit verdict (deemed 1.0, custom 0.6, P4P 0.5, unknown 0.3, excluded 0), pre-approval burden, published payment timeline, program stability (budget exhausted history, program-year certainty, pending regulatory changes), and whether the incentive can be assigned to us. The weights live in the config. Each component is a column.

**Measurement C: size of the prize**, per territory: commercial customers times cooling degree days, optionally refined by building stock. Each component is a column.

Default ranking method: A times B times C, per measure, with the optimizer as the headline. Alternate methods in the config from the start: weighted sum of rank-normalized A, B and C; A alone; A times B alone (program quality); C alone (market only). `data/sensitivity.csv` shows every territory's rank under every method so the user can see which territories are robust across methods and which depend on one assumption. A territory with an unknown in a decisive input gets a rank range, not a point rank.

## 9. Use of the earlier data

Only after every territory is locked and Phase 5 is complete, one Haiku agent may read `rebates/data/` and produce `data/diff-vs-2026-07.csv`: for each territory and field present in both, the old value, the new value and whether they agree. This is for the user's review only. No value from the old data enters the new records under any circumstance.

## 10. Deliverables

All under `incentive-atlas/`, committed and pushed on the designated branch:

- `data/territories.csv`, `programs.csv`, `measure_fit.csv`, `dr_programs.csv`, `tariffs.csv`, `financing.csv`, `mechanisms.csv`, `sources.csv`, `universe.csv` (the Phase 1 full list), `ranking.csv`, `sensitivity.csv`, `unknowns.csv` (every unknown with its reason), `decisions.jsonl`.
- `data/atlas.json`: the merged record the page reads.
- `data/solar-thermal-classification.md`.
- `evidence/`: every saved document with the sources index.
- `build/model.py`, `build/page.py`, runnable from a clean checkout with Python 3 standard library only.
- `index.html`: self-contained page with a territory map or list, the ranking table with all input columns and a method switcher that reads the config, a program directory with the quoted criteria and native-unit incentive tables, a DR and tariff view, a sources view with retrieval dates, and an unknowns view. Light and dark themes. Works at phone width.
- `README.md`: what was built, the evidence standard, the schema, how to rebuild, the model, confidence and unknown statistics per territory, Phase 5 pass rates, and the items that need a human phone call.

## 11. Product inputs

These are the only estimates allowed anywhere in the project, and they come from the user, not from research. Savings are given as ranges. The model computes every dollar figure at the low, mid and high point of each range and reports all three. Null values make every dependent output report `unknown`. Per-ton and per-unit rebates compute from tonnage alone and do not depend on the savings ranges.

```json
{
  "reference_installs": {
    "optimizer": {
      "tons": 10,
      "units": 1,
      "installed_price_usd": null,
      "kwh_savings_pct": {"low": 15, "mid": 22.5, "high": 30},
      "peak_kw_reduction_pct": {"low": 15, "mid": 22.5, "high": 30, "assumption": "set equal to the kWh range until measured peak data is supplied"},
      "notes": "Compressor-cycling controller on one packaged RTU"
    },
    "cryogenx4": {
      "tons": 10,
      "units": 1,
      "installed_price_usd": null,
      "kwh_savings_pct": {"low": 15, "mid": 20, "high": 25},
      "peak_kw_reduction_pct": {"low": 15, "mid": 20, "high": 25, "assumption": "set equal to the kWh range until measured peak data is supplied"},
      "notes": "Refrigerant-side treatment on existing cooling equipment"
    },
    "rtu_replacement": {
      "tons": 10,
      "units": 1,
      "installed_price_usd": null,
      "new_unit_ieer": null,
      "baseline_ieer": null,
      "kwh_savings_pct": null,
      "peak_kw_reduction_pct": null,
      "notes": "No savings range supplied yet; dollar outputs for this measure report unknown except per-ton and per-unit rebates"
    },
    "solar_thermal": {
      "tons": 10,
      "units": 1,
      "installed_price_usd": null,
      "storage_hours": null,
      "kwh_savings_pct": {"low": 30, "mid": 37.5, "high": 45},
      "peak_kw_reduction_pct": {"low": 30, "mid": 37.5, "high": 45, "assumption": "set equal to the kWh range until measured peak data is supplied"},
      "notes": "All-in-one system with thermal storage over one hour"
    }
  },
  "baseline_rtu_kw_per_ton": 1.2,
  "notes": "Researchers never fill or change these. If a program pays on installed cost and installed_price_usd is null, that program's dollar figure is unknown and the unknown is counted."
}
```

## 12. Reporting and checkpoints

**Running across sessions.** This build will not fit in one session. Run Phase 0 and Phase 1 in the first session. Run Phase 2 in batches of five territories, committing and pushing after each territory locks. Run Phases 3 to 6 in a final session. A new session started with this same prompt first reads `incentive-atlas/README.md`, `decisions.jsonl` and the lock status of each territory, then continues from the first unfinished step. The quarantine in Section 1 applies to `rebates/` and to Drive, never to `incentive-atlas/`, which is this project's own output. A territory that is locked is not reopened unless Phase 5 fails it.

Stop and ask the user only at Checkpoint 1 (schema and inputs), Checkpoint 2 (top 20 confirmation), and at the end. Everything else is autonomous. Commit after every phase with a message naming the phase.

Progress notes, when you write them, are one line per territory: territory, phase, fields known, unknown, confidence counts.

The final report to the user contains, in this order: the top-20 ranking table under the default method with the three measurements visible; how many territories change rank under each alternate method; unknown and confidence counts per territory; the Phase 5 pass rate; the ten figures with the largest effect on the ranking and their confidence; the list of items that need a phone call or a login to resolve; and the link to the page. No narrative beyond that.

## 13. What done means

- Every numeric field and every criterion in every locked record has a source document id, a quote, a retrieval date and a confidence grade.
- Every territory has been through an adversarial check by a separate agent and an orchestrator adjudication, and the decision log records every disagreement.
- Phase 5 pass rate is recorded for every territory, and every failing territory was re-checked.
- Unknowns are counted and explained, never silently zero.
- The ranking is reproducible from the CSVs and the config by running one script, and the sensitivity table exists.
- The page renders at phone and desktop width and every figure on it links to its source row.
- No value in any record came from the earlier research or from an agent's memory.
