# Grok prompt templates for the Incentive Atlas

Five templates. The Claude session's Grok supervisor fills the placeholders in square brackets, saves the filled prompt under `incentive-atlas/leads/grok/prompts/<task-id>.md`, pastes it into a new Grok chat with the deepest search mode turned on, and saves the response verbatim. Each template is self-contained so it can also be pasted by hand.

Every template starts with the same rules block. The rules matter more than the schema: Grok output is only useful if every URL was actually opened and every figure has its sentence.

---

## Rules block (included at the top of every template)

You are a research scout for a commercial HVAC incentive atlas. Your output will be verified field by field by another system that will open every URL you give and look for every sentence you quote. Follow these rules exactly.

1. Use your deepest web search mode. Open the documents. Do not answer from memory.
2. Give only URLs you opened in this session. Deep links to the specific page or PDF, never a home page or a search result. For PDFs give the direct PDF URL. If you cannot find a specific document, say `unknown` and describe what you looked for.
3. Numbers and eligibility rules come only from primary documents: the utility's program page, program manual, application form, measure catalog, technical reference manual, tariff sheet, regulatory filing, ISO manual, statute or IRS guidance. DSIRE, news, vendor sites and summaries may tell you a program exists; list them separately as locator sources and never take a figure from them.
4. Every figure and every rule carries the exact sentence or table row you saw, copied verbatim, and the URL it came from. No paraphrase in the quote field.
5. Record incentives in their native units exactly as published (per ton, per kWh saved, per kW, per horsepower, percent of cost, per unit, per square foot, per MMBtu, tiered tables). Do not convert, average, estimate or round.
6. Record the program year the document applies to and the document's own date or version. If the program year has ended, say so.
7. `unknown` is a valid value and is better than a guess. Never fill a gap from general knowledge.
8. Today's date is [DATE]. Put it in `retrieved_on`.
9. Output JSON only, matching the structure given, with no commentary before or after. If the output would be too long, finish the current object cleanly, output `"continuation": true` as the last key, and wait for the message `CONTINUE` to send the rest.

---

## G1: Universe screen

[Rules block]

Task: for each utility in the list below, determine two things. Existence only, no figures.

A. Does it run or participate in a commercial or business energy-efficiency program that pays for HVAC measures (rooftop unit controls, HVAC replacement, custom HVAC projects)? Answer yes, no or unknown. Give the program page URL and the sentence that shows HVAC is covered.

B. Can a commercial customer in its territory be paid for demand response or load curtailment, either through the utility or through a wholesale market program via an aggregator? Answer yes, no or unknown. Give the URL, the sentence, and name the operator (utility program name, or the ISO/RTO product name).

Utilities (name, state, EIA id):
[LIST]

Output:

```json
{
  "task_id": "[TASK_ID]",
  "retrieved_on": "[DATE]",
  "utilities": [
    {
      "eia_id": "",
      "name": "",
      "state": "",
      "commercial_ee_hvac": "yes | no | unknown",
      "ee_url": "",
      "ee_quote": "",
      "ee_program_name": "",
      "ee_administrator": "",
      "commercial_dr": "yes | no | unknown",
      "dr_url": "",
      "dr_quote": "",
      "dr_operator": "",
      "dr_market": "PJM | MISO | ISO-NE | NYISO | CAISO | ERCOT | SPP | none | unknown",
      "locator_sources": [""],
      "notes": ""
    }
  ]
}
```

---

## G2: Territory discovery

[Rules block]

Territory: [TERRITORY_NAME], [STATE]. Utility or administrator: [UTILITY]. EIA id: [EIA_ID]. Known program administrator or implementer if any: [ADMIN_HINT].

Task: find every program, tariff and document through which a commercial customer in this territory can be paid, credited, financed or tax-advantaged for four HVAC measures, with particular attention to anything that pays for peak-demand reduction. The four measures:

1. A compressor-cycling controller retrofitted onto a packaged rooftop unit. The key question is whether the program's definition of "advanced rooftop unit controls" (or similar) would admit it, or whether it falls to a custom path. Quote the definition.
2. A refrigerant-side treatment applied to existing cooling equipment. Quote any exclusion of refrigerant additives, power conditioning, or unproven technologies, and any measured-savings path open to unlisted measures.
3. Replacing a packaged rooftop unit with a higher-efficiency one. Quote the efficiency thresholds and the rate table, and whether early replacement is allowed.
4. An all-in-one solar thermal system with more than one hour of heat storage. Quote how the program defines solar thermal, thermal energy storage, energy storage or load flexibility, and whether such a system could fit.

Cover all of these for the territory:

- Utility efficiency programs: prescriptive, custom, midstream, small business, new construction, bonus windows.
- Demand response and grid services: utility programs and wholesale-market participation via aggregators, with payment basis, minimum kW and whether aggregation is permitted.
- Tariffs: the commercial rate schedules, the tariff book URL, demand charge per kW and the time-of-use windows if readable, interruptible or curtailable credits, storage or thermal storage riders.
- Pay-for-performance, NMEC or third-party implementer programs, and whether a non-utility party can receive the incentive.
- Program calendar: program year start and end, application deadlines, total budget, remaining budget or waitlist status, any history of funds running out.
- Process: pre-approval requirements, trade ally or contractor requirements, measurement and verification requirements, published payment timeline, whether the incentive can be assigned to the contractor.

Output:

```json
{
  "task_id": "[TASK_ID]",
  "retrieved_on": "[DATE]",
  "territory": {
    "name": "", "state": "", "utility": "", "eia_id": "",
    "ee_administrator": "", "ee_implementer": "", "dr_administrator": "",
    "wholesale_market": "", "regulator": "", "program_year_convention": "",
    "service_counties_url": ""
  },
  "programs": [
    {
      "name": "",
      "family": "prescriptive | custom | midstream | small_business | new_construction | dr_utility | dr_wholesale | tariff | p4p_nmec | aggregator | financing",
      "administrator": "",
      "urls": {"program_page": "", "manual_or_guidelines": "", "measure_catalog_or_application": "", "tariff_or_rider": "", "other": [""]},
      "program_year": {"start": "", "end": "", "document_version_or_date": "", "quote": ""},
      "budget": {"total": "", "remaining_or_status": "", "as_of": "", "quote": "", "url": ""},
      "customer_eligibility": {"quote": "", "url": ""},
      "controls_definition": {"quote": "", "url": ""},
      "exclusions": [{"quote": "", "url": ""}],
      "incentive_lines": [
        {"measure_as_named": "", "unit": "", "rate": "", "tier_or_condition": "", "cap": "", "quote": "", "url": "", "page": ""}
      ],
      "caps_and_stacking": [{"quote": "", "url": ""}],
      "process": {
        "pre_approval": {"value": "", "quote": "", "url": ""},
        "trade_ally": {"value": "", "quote": "", "url": ""},
        "mv_requirements": {"quote": "", "url": ""},
        "payment_timeline": {"quote": "", "url": ""},
        "assignment_to_contractor": {"value": "", "quote": "", "url": ""}
      },
      "measure_leads": {
        "optimizer": {"likely_path": "deemed | custom | p4p | excluded | unknown", "quote": "", "url": ""},
        "cryogenx4": {"likely_path": "", "quote": "", "url": ""},
        "rtu_replacement": {"likely_path": "", "quote": "", "url": ""},
        "solar_thermal": {"likely_path": "", "quote": "", "url": ""}
      },
      "unknowns": [{"field": "", "looked_for": "", "why_not_found": ""}]
    }
  ],
  "dr_programs": [
    {"name": "", "operator": "", "market_product": "", "payment_basis": "", "rates": "", "minimum_kw": "", "aggregation_permitted": "", "events_hours_notice": "", "season": "", "enabling_tech_incentive": "", "aggregators_named": [""], "quote": "", "url": ""}
  ],
  "tariffs": [
    {"schedule": "", "customer_class": "", "demand_charge_per_kw": "", "tou_windows": "", "ratchet": "", "interruptible_credit": "", "storage_riders": "", "effective_date": "", "quote": "", "url": ""}
  ],
  "locator_sources": [{"url": "", "what_it_pointed_to": ""}],
  "unknowns": [{"field": "", "looked_for": "", "why_not_found": ""}]
}
```

---

## G3: Federal mechanisms and the solar thermal classification

[Rules block]

Task, part one: for each federal mechanism below, give its status as of [DATE] for a commercial building owner, the key dates, the value as published, the eligible property definitions that matter for HVAC controls, HVAC replacement, thermal energy storage and solar thermal, and whether it can be combined with utility rebates. Cite statute sections, IRS notices or guidance pages and quote the operative sentence. Mechanisms: Section 48E clean electricity investment credit including its energy storage and thermal energy storage property definitions; bonus depreciation; Section 179D; USDA REAP loans and grants; SBA 504 green loans; any live federal grant program open to commercial efficiency or storage projects.

Task, part two: a classification memo for an all-in-one solar thermal HVAC system that stores heat for more than one hour. Under each of the following, quote the definition and state whether the system could fit, could fit with conditions, or does not fit: Section 48E energy storage property and thermal energy storage property; the solar energy property definitions; state storage incentive programs in California, New York, Massachusetts, Maryland, New Jersey, Illinois and Texas; and how utility storage, load-flexibility or thermal-storage riders typically define eligible thermal storage (give three examples with URLs).

Output:

```json
{
  "task_id": "[TASK_ID]",
  "retrieved_on": "[DATE]",
  "mechanisms": [
    {"mechanism": "", "statute_or_program": "", "status": "", "key_dates": "", "value_as_published": "", "eligible_property_quote": "", "stacking_quote": "", "url": "", "section_or_page": ""}
  ],
  "solar_thermal_classification": [
    {"framework": "", "definition_quote": "", "url": "", "fit": "fits | fits_with_conditions | does_not_fit | unknown", "conditions": ""}
  ],
  "locator_sources": [""],
  "unknowns": [{"field": "", "looked_for": "", "why_not_found": ""}]
}
```

---

## G4: Wholesale demand response products

[Rules block]

Task: for each ISO or RTO (PJM, MISO, ISO-NE, NYISO, CAISO, ERCOT, SPP), list every product through which a commercial customer's load reduction can be paid, directly or through an aggregator or curtailment service provider. For each product give the payment basis, published or most recent clearing values if the manual or results page states them, minimum size, aggregation rules, event rules, telemetry requirements, and how a customer enrolls. Cite the ISO manual, business practice manual or tariff section and quote the operative sentence.

Output:

```json
{
  "task_id": "[TASK_ID]",
  "retrieved_on": "[DATE]",
  "products": [
    {"iso": "", "product": "", "payment_basis": "", "published_values": "", "minimum_kw": "", "aggregation_rules": "", "event_rules": "", "telemetry": "", "enrollment_path": "", "manual_name": "", "section": "", "quote": "", "url": ""}
  ],
  "unknowns": [{"field": "", "looked_for": "", "why_not_found": ""}]
}
```

---

## G5: State mechanisms and financing

[Rules block]

State: [STATE]. Counties of interest: [COUNTIES].

Task: find every state-level mechanism and every financing path open to a commercial building owner for HVAC efficiency, demand flexibility or thermal storage in this state. Cover: state tax credits and deductions; sales and property tax exemptions; state energy office grants and rebates; green bank products; state storage incentives; the efficiency resource standard or statute that funds utility programs; C-PACE, including which of the listed counties have an active program and who administers it; on-bill repayment or financing; any state loan fund. For each, quote the operative sentence and give the URL.

Output:

```json
{
  "task_id": "[TASK_ID]",
  "retrieved_on": "[DATE]",
  "state": "",
  "mechanisms": [
    {"mechanism": "", "type": "tax | grant | rebate | green_bank | storage | standard | other", "administrator": "", "status": "", "value_as_published": "", "eligibility_quote": "", "url": ""}
  ],
  "financing": [
    {"mechanism": "c_pace | on_bill | loan_fund | other", "administrator": "", "counties_active": [""], "terms_quote": "", "url": ""}
  ],
  "locator_sources": [""],
  "unknowns": [{"field": "", "looked_for": "", "why_not_found": ""}]
}
```
