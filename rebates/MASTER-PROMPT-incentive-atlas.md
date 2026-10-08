# Master prompt: Energy Plus Incentive Atlas (from scratch)

Paste everything below this line into a new Claude Code session in the `energy-plus` repository, run from the Claude desktop app so the browser tools are available for the Grok lane. Stage A runs with Claude Fable 5.1 as the session model. Stage B sessions run with Claude Opus 5.5 as the session model, except the three Fable bookend tasks named in Section 5.

---

## 1. Mission

Build, from first principles and from primary sources only, a complete and verifiable record of every mechanism by which a commercial customer in the United States can get paid, credited, financed, or tax-advantaged for installing our four HVAC measures, with particular weight on mechanisms that pay for peak-demand reduction. Then rank the top 20 utility territories by how much money is realistically on the table for us, using a ranking model whose inputs are kept separate so the method can be swapped.

The build runs in two stages. **Stage A** is a proof of concept: setup, the territory screen, and one territory taken all the way through every step, ending in a report that proposes modifications. **Stage B** runs the remaining territories in parallel after the user approves the modifications. Nothing in Stage B starts before Checkpoint 3.

Two research lanes run side by side. The **Claude lane** owns the evidence store, extraction, checking, adjudication, the model and the page. The **Grok lane**, run on the user's Grok subscription and supervised by this session through the desktop browser, owns lead generation: finding programs, deep links, program years, and first-pass figures with quotes. Grok output is a lead, never a record. Section 6 governs the handoff.

This is a one-time build. Nothing from earlier research in this repository or in Google Drive may be read or reused while the research is in progress. The `rebates/` folder in this repository and the Ops folder in Drive contain an earlier attempt that was found to have unverifiable figures. Do not open them until Section 10 says you may. Treat any figure you already "know" about a program as a hypothesis to be verified, never as data.

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
4. **Solar thermal retrofit.** An all-in-one system that replaces or supplements the unit and stores heat for more than one hour. This has no settled program category. For every program and every tax or grant mechanism, record how it would be classified under the published rules: solar thermal, thermal energy storage, "thermal battery", demand-flexible load, energy storage under Section 48E, custom efficiency measure, or not eligible. Quote the definition that drives the classification. Where no definition fits, say so. One Grok task drafts the general classification question and one Opus agent verifies it against statute and guidance; each territory extraction then checks the local treatment.

Reference installs per measure are in the product inputs block (Section 12). Researchers never estimate savings, prices or tonnage. Those are inputs.

## 3. What counts as money

Research all of the following for each territory. Nothing is out of scope if it moves cash, credit or financing to the customer or to us.

- **Utility efficiency programs**: prescriptive or deemed rebates, custom or calculated incentives, midstream or distributor incentives, small business direct install, new construction and major renovation, bonus windows, bundling bonuses.
- **Demand response and grid services**: utility-run DR, wholesale-market DR reached through an aggregator (PJM, MISO, ISO-NE, NYISO, CAISO, ERCOT, SPP), capacity payments, emergency programs, auto-DR enabling incentives, bring-your-own-device style programs, load-flexibility pilots.
- **Tariffs**: demand charges by rate class, time-of-use windows and prices, ratchets, interruptible and curtailable rate credits, standby and storage riders, thermal energy storage riders, real-time pricing options.
- **Aggregator and pay-for-performance paths**: normalized metered energy consumption (NMEC) programs, pay-for-performance tariffs, third-party implementer programs where an installer is paid on metered savings, and whether a non-utility party can be the incentive recipient.
- **State mechanisms**: tax credits and deductions, sales and property tax exemptions, state energy office grants, green bank loans, state storage incentives, efficiency resource standards that fund the utility programs.
- **Financing**: on-bill repayment, on-bill financing, utility loans, C-PACE (record county-level availability for the counties that make up the territory), USDA REAP loans and grants, SBA 504 green loans.
- **Federal**: Section 48E investment credit (with the storage and thermal storage question), bonus depreciation, Section 179D status, REAP, any live grant program. Drafted once by Grok, verified once by Opus against current statute and IRS guidance, and applied to all territories.

## 4. Evidence standard

This standard governs every figure and every criterion. An agent that cannot meet it records `unknown` with a reason. No agent ever estimates, infers, averages, or fills a gap from memory.

- **Primary sources only for numbers and criteria.** A primary source is the utility's program page, program manual, application form, measure catalog, technical reference manual (TRM), tariff sheet, regulatory filing, ISO manual, statute, or IRS guidance. DSIRE, news, vendor blogs, summaries, and Grok output may be used to discover that a program exists, never to supply a figure.
- **Every field carries provenance**: source document id, the exact quoted sentence or table row, page number for PDFs, retrieval date, the agent that extracted it, the agent that checked it, and a confidence grade of high, medium or low with a one-line reason. High means the quote states the figure directly in a current-program-year document. Medium means the figure is stated but the document's program year or applicability is ambiguous. Low means the figure comes from an indirect statement.
- **Evidence store on disk.** Every document fetched is saved once under `incentive-atlas/evidence/<territory-id>/` with a document id, URL, title, publisher, document type, retrieval date and SHA-256 hash, listed in `sources.csv`. Agents read from the store when a document is already there. No page is fetched twice.
- **Native units.** Record incentives exactly as published: per ton, per kWh saved, per kW, per horsepower, percent of cost, per unit, per square foot, per MMBtu, tiered tables, whatever the program uses. Unit normalization happens in the model layer, never in the record.
- **Dates.** Every program record carries program year start and end, the document's own date or version, and the retrieval date. A figure from a document for a program year that has ended is recorded with confidence low and a note.
- **Verbatim criteria.** Inclusion and exclusion criteria are quoted, not paraphrased. A paraphrase may sit next to the quote.
- **Unknown is a value.** An `unknown` field names what was looked for, where, and why it was not found (not published, behind login, PDF unreadable, conflicting documents). Unknown counts are reported per territory and per field in the deliverables.
- **Leads are not evidence.** A figure or URL from the Grok lane enters a record only after the document is fetched into the evidence store and the figure is extracted from that saved document by a Claude-lane agent. The Grok claim is kept beside the extracted value as `lead_claim` for hit-rate scoring and nothing else. The adversarial checker is never shown lead claims.

## 5. Model routing rules

Fable 5.1 costs five times Opus 5.5 and fifty times Haiku 5.5 per token. It is used only for the judgment-dense work below, which should come to about five percent of total spend. Everything else runs on Opus, Sonnet or Haiku. Spawn subagents with the Agent tool and set the `model` parameter per the table.

**Fable 5.1 does exactly three things.** (1) Stage A end to end: schema, config, briefs, the territory screen adjudication, the proof-of-concept territory through every step, and the Stage A report with proposed modifications. (2) In Stage B, Phase 5 sample verification and the review of the ranking model. (3) The final report. Stage B sessions otherwise run with Opus 5.5 as the session model, and Opus orchestrates the territory batches using the briefs Fable wrote in Stage A. When a Stage B session hits a question the briefs do not answer, it logs the question in the decision log and takes the conservative option (record unknown, or keep the researcher's value flagged) rather than inventing a rule; Fable resolves the logged questions at Phase 5.

| Role | Model | Agent `model` value | Effort | What it does | What it never does |
|---|---|---|---|---|---|
| Stage A orchestrator; Phase 5; final report | Fable 5.1 | (session model) | high; xhigh for adjudication | Schema, config, briefs, adjudication, POC territory, sample verification, model review, final report | Bulk fetching, bulk extraction, reading whole PDFs, formatting, driving the browser |
| Stage B orchestrator | Opus 5.5 | (session model) | high; xhigh for adjudication | Runs territory batches with the Stage A briefs, adjudicates disagreements, locks territories, maintains the Grok manifest | Rewriting briefs or schema; any Fable task |
| Territory synthesizer | Opus 5.5 | `opus` | high | Reads the extracted records and evidence for one territory and writes the territory record: how we get paid here, per measure, with the unknown list | Fetching new pages except to resolve a specific contradiction |
| Adversarial checker | Opus 5.5 | `opus` | high | Fresh context, separate from the synthesizer. Receives the draft records and the evidence store and tries to falsify every figure and criterion against the sources, re-fetching live pages where the store is stale. Returns confirmed, corrected (with evidence) or unverifiable per field | Accepting a figure because it looks plausible; seeing lead claims |
| Dense-document extractor | Opus 5.5 | `opus` | medium | Program manuals, tariff books and TRMs longer than about 30 pages, or any document where the Sonnet extractor reports ambiguity | Discovery |
| Federal verifier | Opus 5.5 | `opus` | high | Verifies the Grok federal and classification draft against statute and IRS guidance, and the Grok ISO DR draft against ISO manuals | Accepting the draft without fetching the sources |
| Extraction worker | Sonnet 5.5 | `sonnet` | medium | Extracts fields with quotes from saved documents into schema-valid JSON. One territory or one document set per agent | Judgment calls about eligibility beyond quoting the rule; estimating anything |
| Gap-discovery worker | Sonnet 5.5 | `sonnet` | medium | After leads are ingested, searches only for programs and documents the leads missed. Budget 20 tool calls | Re-finding what the leads already found |
| Lead fetcher | Sonnet 5.5 | `sonnet` | low | Fetches every lead URL into the evidence store, marks each valid, dead, redirected or non-primary | Extraction |
| Data puller | Sonnet 5.5 | `sonnet` | low | EIA-861, NOAA degree days, OpenEI utility rate database, TRM full-load hours | Interpretation |
| Grok supervisor | Sonnet 5.5 | `sonnet` | low | Drives grok.com through the desktop browser: sends queued prompts, waits, saves responses verbatim, updates the manifest (Section 6) | Editing or summarizing Grok output; sending anything not in the prompts folder |
| Lead parser | Haiku 5.5 | `haiku` | low | Parses raw Grok output into lead JSON, validates against the lead schema, counts URLs and figures | Deciding whether a lead is true |
| Classifier and normalizer | Haiku 5.5 | `haiku` | low | Measure-fit first pass from quoted criteria, unit tagging, JSON schema validation, deduplication, link checking, CSV formatting, unknown counting | Any field that requires reading a document it was not given |
| Model builder | Opus 5.5 | `opus` | high | Writes and tests the ranking code and the page build script | Changing data |

Operating rules for every agent:

1. **Fresh context, narrow brief.** Each agent gets one territory or one document set, the schema, the evidence standard, and nothing else. No agent sees another agent's conclusions unless its job is to check them. Briefs live as files in `incentive-atlas/briefs/` and are passed by path, so every session uses the same words.
2. **Structured output only.** Agents return JSON that validates against the schema, plus a short list of unknowns and a short list of ambiguities. Prose summaries are not accepted. Haiku validates every return before the orchestrator reads it.
3. **Escalate up, never down.** If a Sonnet extractor returns unknown or ambiguous for a field that matters to the ranking (incentive rate, measure fit, cap, program year, DR payment, demand charge), re-run that field with Opus on the same documents before accepting unknown. Never re-run a failed Opus task on Sonnet.
4. **Separation of research and checking.** The checker is always a different agent instance from the researcher, with no shared context, and is told its job is to find errors. The orchestrator adjudicates any disagreement by reading the evidence itself, and logs the decision.
5. **Tool-call budgets.** Extraction workers: at most 40 tool calls. Gap-discovery workers: 20. Checkers: 60. Grok supervisor: 30 per task. If a worker hits its budget, it returns what it has with unknowns marked, and the orchestrator decides whether to spawn a continuation with a narrower brief.
6. **Parallelism.** Run five to eight Claude workers at a time. Territories are independent, so run territory pipelines in parallel. Within a territory, lead ingestion precedes gap discovery, discovery precedes extraction, extraction precedes synthesis, synthesis precedes checking. The Grok supervisor runs one task at a time and one batch ahead of the Claude lane.
7. **Retries.** A failed or truncated agent is re-run once with a narrower brief. A second failure is logged as unknown and reported.
8. **No memory of the old data.** If any agent encounters files under `rebates/` or Drive documents from the earlier attempt, it must not read them. Say so in every brief.
9. **Use the web through a saved copy.** Fetch tools save raw HTML or PDF to the evidence store first, then extract from the saved copy. If a site blocks fetching, use the browser tool, then save the rendered text. If a document is behind a login, record it as unknown with the URL.
10. **Move work to Grok whenever it can be.** Any task whose output is a list of leads (programs, URLs, dates, quotes to verify) goes to the Grok lane first. The Claude lane does the same task only when the Grok result is rejected or overdue (Section 6). The Stage A report must list every task that could move but has not yet, with the estimated Claude spend it would save.

## 6. The Grok lane

Purpose: shift lead generation to the user's Grok subscription so Claude spend goes to extraction, checking and judgment. Everything about the lane is bookkeeping, designed so no work is done twice and no Grok text ever becomes a record without passing through the evidence store.

**Files.** `incentive-atlas/leads/grok/` holds `prompts/<task-id>.md` (the exact text sent, generated from the templates in `GROK-PROMPTS-incentive-atlas.md`), `raw/<task-id>.md` (Grok's response, verbatim, never edited), `parsed/<task-id>.json` (Haiku's parse), and `manifest.csv`.

**Manifest.** One row per task: task_id, task_type (G1 universe screen, G2 territory discovery, G3 federal and classification draft, G4 ISO DR products, G5 state mechanisms and financing), territory_ids, prompt_path, status, queued_on, sent_on, received_on, parsed_on, ingested_on, grok_mode, response_chars, urls_total, urls_valid, urls_primary, figures_total, figures_confirmed, figures_corrected, notes. Status values, in order: queued, sent, received, parsed, ingesting, ingested, rejected, overdue, awaiting_human. The manifest is the single source of truth for both lanes. Every orchestrator reads it before assigning any discovery work, and the Grok supervisor reads it before sending anything.

**Task types and which Claude work they replace.**

| Task | Grok produces | Replaces on the Claude lane |
|---|---|---|
| G1 universe screen | For a pasted list of utilities: commercial HVAC efficiency program yes/no with URL and quote, commercial DR yes/no with URL and operator | Phase 1 step 3 discovery workers |
| G2 territory discovery | For one territory: every program with family, administrator, deep links to program page, manual, measure catalog, application, tariff book and DR page, program year, budget status, verbatim controls definition and exclusions, first-pass incentive lines with quotes, leads per measure, aggregator and P4P paths, financing, unknowns | Phase 2a discovery entirely; shrinks Phase 2b search effort |
| G3 federal and classification draft | Federal mechanism table with statute citations and quotes, and the solar-thermal classification memo with quoted definitions | The research half of the federal agent; Opus verifies instead of researches |
| G4 ISO DR products | One record per ISO/RTO commercial DR product with manual citations | The research half of the wholesale DR agent |
| G5 state mechanisms and financing | Per state: tax, grant, green bank, C-PACE administrators by county, on-bill programs, with URLs and quotes | The state and financing part of discovery |

**Supervisor loop (Sonnet, low effort, desktop browser tools).** Once per cycle: read the manifest; for the first queued task, open grok.com in the desktop browser, start a new chat, turn on the deepest search mode available, paste the prompt file verbatim, and set status sent with a timestamp. Poll the page as text every few minutes rather than taking screenshots. When the response is complete, copy the full response text into `raw/<task-id>.md` exactly as shown, set status received, and record response length. Send at most one task at a time and respect Grok's rate limits; if Grok refuses or truncates, note it and re-send once with the continuation line in the prompt template. If the desktop browser tools are not available in this session, write the prompt files, set status awaiting_human, and tell the user which files to paste and where to save the response. Never summarize, correct or reformat Grok's text.

**Ingestion.** Haiku parses raw to JSON against the lead schema and counts URLs and figures. The lead fetcher saves every URL into the evidence store and marks each valid, dead, redirected or non-primary; dead and non-primary URLs are dropped from the leads with the reason logged. Extraction then runs from the saved documents exactly as it would without leads. Each extracted field that has a matching Grok claim records it as `lead_claim`; Haiku later scores claims as confirmed, corrected or unverifiable. The gap-discovery worker runs last, with a 20-call budget, looking only for what the leads missed.

**Scheduling.** The Grok lane runs one batch ahead. Before the Claude lane starts a territory, the manifest must show its G2 task ingested or rejected. A task sent more than 12 hours ago with no response is marked overdue and the Claude lane runs full discovery for that territory on Sonnet with the 40-call budget; if the Grok response later arrives it is still parsed and scored but not ingested. A task is rejected when the parser finds no valid primary URLs or the response is plainly off-task.

**Reporting.** The README and the final report include the Grok hit rate per task type: URL validity, primary-source rate, and figure confirmation rate, plus the estimated Claude spend avoided. Low hit rates on a task type are a reason to rewrite that Grok template, not to stop using the lane.

## 7. Schema

Write the schema as JSON Schema files in `incentive-atlas/schema/` before any research starts. The fields below are the minimum. Add fields as the research reveals them, and log each addition.

**Territory** (`territory.json`): territory id, utility or administrator name, legal entity, state(s), type (IOU, municipal, cooperative, G&T, statewide administrator, federal power authority), wholesale market (ISO/RTO or none, with the sliver notes where a utility spans two), service counties, EIA utility id, commercial customer count, commercial sales MWh, commercial revenue, cooling degree days with station and normals period, cooling equivalent full-load hours with source, program administrator and implementer for efficiency programs, DR administrator, regulatory body, program year convention, verification summary (fields total, known, unknown, confidence counts), lead task ids, checked-by, locked-on.

**Program** (`program.json`): program id, territory id, program name, family (prescriptive, custom, midstream, small business, new construction, DR utility, DR wholesale, tariff, P4P or NMEC, aggregator, state tax, state grant, state rebate, financing, federal), administrator, implementer, sector eligibility, customer eligibility (rate classes, size thresholds, account conditions, quoted), site and building eligibility (quoted), contractor requirements (trade ally, licensing, quoted), timing rules (pre-approval before purchase, installation and submission deadlines, quoted), explicit exclusions (quoted), incentive table (one row per measure line as published: measure name as the program names it, unit, rate, tier conditions, cap), caps (per project, per customer per year, percent of cost, payback floors or ceilings, quoted), stacking rules (quoted), application method, documents required, M&V requirements (deemed, calculated, metered, pre and post inspection), payment recipient and whether assignment to a contractor is allowed, published payment timeline, program year start and end, total budget, remaining budget or waitlist status with date, funds-exhausted history, source document ids, retrieval date, confidence per field, unknown reasons, lead_source, lead_claim per field where one existed.

**Measure fit** (`measure_fit.json`): program id, measure (optimizer, cryogenx4, rtu_replacement, solar_thermal), verdict (deemed, custom, p4p, excluded, unknown), deciding criterion quoted, the applicable incentive row(s), conditions to qualify (for the optimizer: what the controls definition requires beyond compressor cycling), confidence, checked-by.

**Demand response program** (`dr_program.json`): program id, territory id, operator (utility, ISO via aggregator, aggregator-run), market product name, payment basis (per kW-month, per kW-year, per kWh of event energy, capacity plus energy, bill credit), published rates, minimum kW, aggregation permitted, event count, hours and notice, season and hours, enabling technology incentive, penalties, enrollment window, telemetry requirements, named aggregators active in the territory, sources, confidence.

**Tariff** (`tariff.json`): territory id, rate schedule name, customer class, demand charge per kW with season and window, ratchet, energy charges by TOU period with windows, interruptible or curtailable credits, standby and storage riders, thermal storage riders, effective date, sheet number, source.

**Financing** (`financing.json`): territory id, mechanism (on-bill, utility loan, C-PACE, green bank, REAP, SBA 504), availability by county where relevant, terms as published, administrator, source.

**State and federal mechanism** (`mechanism.json`): jurisdiction, mechanism, statute or program, status as of retrieval date, key dates, value as published, eligible measures with the classification quote for solar thermal, sector, stackable with utility rebates (quoted), source.

**Source** (`source.json`): document id, URL, title, publisher, document type, program year or version, retrieval date, SHA-256, local path, fetched by, lead task id if the URL came from a lead.

**Lead** (`lead.json`): task id, territory id, the parsed Grok structure (programs, URLs, claims with quotes, unknowns), URL statuses after fetching, claim scores after extraction.

**Decision log** (`decisions.jsonl`): one line per orchestrator adjudication or open question: territory, program, field, researcher value, checker value, decision or "open for Fable", evidence, date, session model.

## 8. Stages and phases

Treat the sequence below as the default plan. Adapt it where the evidence requires, and log every deviation in the decision log.

### Stage A: proof of concept (Fable 5.1 session)

**Phase 0: Setup.** Create `incentive-atlas/` with `schema/`, `briefs/`, `evidence/`, `data/`, `config/`, `build/`, `leads/grok/` and `README.md`. Write the schemas, the briefs for every agent role in Section 5, `config/product.json` from Section 12, `config/ranking.json` with the default method from Section 9, and the Grok prompt templates from `GROK-PROMPTS-incentive-atlas.md`. Commit. **Checkpoint 1**: show the user the schema field list, the product inputs and the brief list and ask for confirmation or corrections.

**Phase 1: Universe and screen.**

1. Data puller (Sonnet): download the latest EIA-861 annual data (Sales to Ultimate Customers, Service Territory, and Utility Data tables). Build the universe of every utility with more than 25,000 commercial customers, plus every statewide efficiency administrator (Mass Save, Energy Trust of Oregon, Focus on Energy, Efficiency Vermont, Efficiency Maine, NYSERDA, New Jersey Clean Energy, Hawaii Energy, Delaware SEU, DC SEU, and any others found). Record EIA utility id, commercial customers, commercial sales and revenue, service counties.
2. Data puller (Sonnet): join cooling degree days (NOAA 1991 to 2020 normals, nearest first-order station to the territory's population center, record the station) and cooling equivalent full-load hours (from the state TRM where one exists, otherwise a named regional reference).
3. Grok lane: queue G1 tasks for the universe in batches of 40 utilities. The supervisor sends them. Haiku parses. Where a G1 task is rejected or overdue, Sonnet discovery workers (ten territories per agent, existence only) cover those utilities.
4. Haiku: compute a preliminary prize index for each territory as commercial customers times cooling degree days, zeroed where no commercial efficiency program exists. Sort.
5. **Checkpoint 2**: present the top 30 to the user as a table (territory, state, type, commercial customers, CDD, efficiency program yes/no, DR yes/no, preliminary index, lead source) and ask them to confirm or edit the top 20 and to pick the proof-of-concept territory. Recommend a territory with one investor-owned utility and a published program manual, not California or New York, so the POC tests the pipeline rather than the hardest case. Keep the full universe table as a deliverable.

**Phase 2 on the POC territory, every step.** Queue G2 and G5 for the territory and G3 and G4 once; the supervisor sends them; ingest per Section 6. Then 2a gap discovery, 2b extraction, 2c measure fit, 2d synthesis, 2e adversarial check, 2f adjudication and lock, exactly as defined under Stage B below. Then run the federal verifier on the G3 and G4 drafts. Then run Phase 3, a first version of the Phase 4 model on the one territory, and Phase 5 sample verification on it.

**Stage A report, then Checkpoint 3.** Record, per phase and per agent role: agent count, tool calls, elapsed wall-clock time, and the session usage reading if available. Record the checker's correction count, the unknown count by field, the Grok hit rate per task type, every question logged as open, and the time the human spent on the Grok lane. Then propose modifications: to briefs, schema, routing (which roles can drop a model tier without loss, which cannot), Grok templates, tool-call budgets, batch size, and any further task that should move to Grok. Present this to the user and stop. Stage B starts only after the user approves the modifications, which Fable then writes into the briefs, templates and this plan's config before handing off.

### Stage B: parallel build (Opus 5.5 sessions, Fable bookends)

**Phase 2: Deep research, one pipeline per territory, run in parallel in batches of five.** For each territory, the manifest must show G2 and G5 ingested or rejected before the pipeline starts.

- **2a Gap discovery** (Sonnet, 20-call budget): with the ingested leads as the starting list, find what they missed. Save every new document to the evidence store.
- **2b Extraction** (Sonnet per program; Opus for dense documents): fill a program record per program, a tariff record per relevant rate schedule, a DR record per DR program, and financing records, from the saved documents, with quotes, recording lead claims beside extracted values.
- **2c Measure fit** (Haiku first pass from the quoted criteria; Opus confirms every partial or unknown verdict and every optimizer verdict): one measure-fit record per program per measure.
- **2d Synthesis** (Opus): the territory record, including a plain-language "how we get paid here" per measure, the unknown list, and the ambiguities list.
- **2e Adversarial check** (Opus, fresh context, no lead claims): every field in every record for the territory. Output per field: confirmed, corrected with evidence, or unverifiable with reason.
- **2f Adjudication and lock** (session orchestrator): resolve every correction and every unverifiable field by reading the evidence. Write decisions to the log; log anything the briefs do not settle as open for Fable. Mark the territory locked with a date. Commit and push.

**Phase 3: Market and climate completion.** Haiku checks every territory record has its EIA, CDD and full-load-hour fields filled with sources. Sonnet fills gaps. Where CBECS regional building-stock data by principal building activity is straightforward to attach, attach it as an optional field; do not let it block.

**Phase 4: Model.** Model builder (Opus) writes `build/model.py`. It reads only the locked records and `config/`. For each territory and each measure it computes the three measurements in Section 9 and writes `data/ranking.csv` with every input column visible. It also writes `data/sensitivity.csv` showing each territory's rank under every ranking method in the config. It writes `build/page.py` producing a self-contained HTML page per Section 11. Fable reviews the model (bookend task).

**Phase 5: Sample verification (Fable bookend).** For each locked territory, pick three numeric figures and two criteria at random. Re-fetch their sources live and confirm the quote still appears and the figure matches. If more than one of the five fails, the territory goes back to 2e with a fresh checker and the failures listed. Resolve every open question in the decision log. Record the pass rate per territory in the README.

**Phase 6: Deliverables and report (Fable bookend).** Build everything in Section 11, commit, push, and write the final report (Section 13).

## 9. Ranking model

The model keeps three measurements as separate columns and never merges them inside the data. Ranking methods combine them in `config/ranking.json` and can be changed without touching the data.

**Measurement A: dollars per reference install**, per measure, per territory. For each program where the measure's verdict is deemed, custom or P4P, apply the published rate to the reference install (tons, kWh saved, kW shaved, installed price from `config/product.json`), apply caps and percent-of-cost limits, and take the best single program plus any stackable DR revenue and tariff savings. Report the arithmetic in a column so a reader can check it. Where a required input is unknown, the result is `unknown`, not zero. Record separately: utility rebate dollars, DR revenue per year, demand-charge savings per year, tax value, financing value (as a yes/no with terms, not a dollar figure). Compute at the low, mid and high point of each savings range.

**Measurement B: probability of collecting**, per measure, per territory, a multiplier between 0 and 1 built from recorded facts: measure-fit verdict (deemed 1.0, custom 0.6, P4P 0.5, unknown 0.3, excluded 0), pre-approval burden, published payment timeline, program stability (budget exhausted history, program-year certainty, pending regulatory changes), and whether the incentive can be assigned to us. The weights live in the config. Each component is a column.

**Measurement C: size of the prize**, per territory: commercial customers times cooling degree days, optionally refined by building stock. Each component is a column.

Default ranking method: A times B times C, per measure, with the optimizer as the headline. Alternate methods in the config from the start: weighted sum of rank-normalized A, B and C; A alone; A times B alone (program quality); C alone (market only). `data/sensitivity.csv` shows every territory's rank under every method so the user can see which territories are robust across methods and which depend on one assumption. A territory with an unknown in a decisive input gets a rank range, not a point rank.

## 10. Use of the earlier data

Only after every territory is locked and Phase 5 is complete, one Haiku agent may read `rebates/data/` and produce `data/diff-vs-2026-07.csv`: for each territory and field present in both, the old value, the new value and whether they agree. This is for the user's review only. No value from the old data enters the new records under any circumstance.

## 11. Deliverables

All under `incentive-atlas/`, committed and pushed on the designated branch:

- `data/territories.csv`, `programs.csv`, `measure_fit.csv`, `dr_programs.csv`, `tariffs.csv`, `financing.csv`, `mechanisms.csv`, `sources.csv`, `universe.csv` (the Phase 1 full list), `ranking.csv`, `sensitivity.csv`, `unknowns.csv` (every unknown with its reason), `decisions.jsonl`.
- `leads/grok/manifest.csv`, with raw and parsed task files, and `data/grok-hit-rate.csv`.
- `data/atlas.json`: the merged record the page reads.
- `data/solar-thermal-classification.md`.
- `evidence/`: every saved document with the sources index.
- `briefs/`: the agent briefs as used, with their revision history.
- `build/model.py`, `build/page.py`, runnable from a clean checkout with Python 3 standard library only.
- `index.html`: self-contained page with a territory map or list, the ranking table with all input columns and a method switcher that reads the config, a program directory with the quoted criteria and native-unit incentive tables, a DR and tariff view, a sources view with retrieval dates, and an unknowns view. Light and dark themes. Works at phone width.
- `README.md`: what was built, the evidence standard, the schema, how to rebuild, the model, confidence and unknown statistics per territory, Phase 5 pass rates, Grok hit rates, spend by model and phase, and the items that need a human phone call.

## 12. Product inputs

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

## 13. Sessions, checkpoints and reporting

**Sessions and models.** Stage A is one or two Fable 5.1 sessions. Stage B runs as Opus 5.5 sessions, one per batch of five territories, each starting from this same prompt. A Fable 5.1 session returns for Phase 5, the model review and the final report. Every session starts by reading `incentive-atlas/README.md`, `decisions.jsonl`, `leads/grok/manifest.csv` and the lock status of each territory, then continues from the first unfinished step. The quarantine in Section 1 applies to `rebates/` and to Drive, never to `incentive-atlas/`, which is this project's own output. A locked territory is not reopened unless Phase 5 fails it. Every session records its model and its usage reading in the README's spend table at start and end.

**Checkpoints.** Stop and ask the user only at Checkpoint 1 (schema, inputs and briefs), Checkpoint 2 (top 20 and the POC territory), Checkpoint 3 (Stage A report and modifications), and at the end. Everything else is autonomous. Commit after every phase and after every territory lock, with a message naming the phase or territory.

**Progress notes**, when you write them, are one line per territory: territory, phase, lead status, fields known, unknown, confidence counts.

**The final report** to the user contains, in this order: the top-20 ranking table under the default method with the three measurements visible at low, mid and high savings; how many territories change rank under each alternate method; unknown and confidence counts per territory; the Phase 5 pass rate; the Grok hit rate per task type and the Claude spend it avoided; spend by model and phase; the ten figures with the largest effect on the ranking and their confidence; the list of items that need a phone call or a login to resolve; and the link to the page. No narrative beyond that.

## 14. What done means

- Every numeric field and every criterion in every locked record has a source document id, a quote, a retrieval date and a confidence grade.
- Every territory has been through an adversarial check by a separate agent and an orchestrator adjudication, and the decision log records every disagreement and every open question with its resolution.
- Phase 5 pass rate is recorded for every territory, and every failing territory was re-checked.
- Unknowns are counted and explained, never silently zero.
- The Grok manifest accounts for every task sent, and no record field cites Grok output as its source.
- The ranking is reproducible from the CSVs and the config by running one script, and the sensitivity table exists.
- The page renders at phone and desktop width and every figure on it links to its source row.
- No value in any record came from the earlier research or from an agent's memory.
