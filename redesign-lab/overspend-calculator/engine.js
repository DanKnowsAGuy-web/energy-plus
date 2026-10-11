/* Energy Plus overspend engine v1. Pure functions, no DOM.
   Reads window.EP (constants.js). Every number is annual dollars unless named otherwise.
   Ranges are [lo, hi]. See BUILD-SPEC.md for the derivation of each line. */
(function (root) {
  'use strict';

  const R = {
    mul: (r, x) => [r[0] * x, r[1] * x],
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sum: (arr) => arr.reduce((acc, r) => R.add(acc, r), [0, 0]),
    cap: (r, hi) => [Math.min(r[0], hi), Math.min(r[1], hi)],
    max0: (r) => [Math.max(0, r[0]), Math.max(0, r[1])],
    mid: (r) => (r[0] + r[1]) / 2,
    geo: (r) => (r[0] > 0 && r[1] > 0) ? Math.sqrt(r[0] * r[1]) : R.mid(r),
    round: (x, step) => Math.round(x / step) * step
  };

  function EP() { return root.EP; }

  function lossByAge(age) {
    const t = EP().streams.antifouling.lossByAge;
    const a = Math.max(1, Math.min(14, Math.round(age)));
    return t[a] != null ? t[a] : t[14];
  }

  function escalationFactor(rate, years) {
    // sum of (1+r)^(y-1) for y = 1..years, i.e. cumulative cost with compounding
    let f = 0;
    for (let y = 0; y < years; y++) f += Math.pow(1 + rate, y);
    return f;
  }

  function cleanMax(x) {
    // meter top: a clean number above x
    const steps = [50000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000];
    for (const s of steps) if (x <= s) return s;
    return Math.ceil(x / 5000000) * 5000000;
  }

  function isFlat(fac, hoursWeek) {
    const d = EP().streams.demand;
    if (fac.occupancyIndependent) return true;
    if (fac.hoursFixed === 168) return true;
    if (hoursWeek >= d.flatHoursThreshold) return true;
    return fac.loadFactor && fac.loadFactor.lo >= 0.7;
  }

  function runHours(fac, hoursWeek) {
    if (fac.occupancyIndependent || fac.hoursFixed === 168) return 8760;
    const perWeek = Math.min(168, hoursWeek + EP().streams.hours.openToRunHours * 7);
    return perWeek * 52;
  }

  /* input: { state, utility|null, facility, billMonthly, season, heat, hoursWeek, occupancy, locations, nudges } */
  function compute(input) {
    const C = EP();
    const S = C.streams;
    const st = C.states[input.state];
    const fac = C.facilities[input.facility];
    const util = input.utility || null;
    const n = input.nudges || {};
    const locations = Math.max(1, input.locations || 1);
    // optional lines: off unless the buyer turns them on in "How we got this"
    const L = Object.assign({ heating: false, lighting: false, ventilation: false, motors: false, refrigeration: true, harmonization: true }, input.lines || {});
    const flags = [];

    // rate
    const rateSrc = n.rate != null ? 'you' : (util && util.commRate ? 'utility' : 'state');
    const rate = n.rate != null ? n.rate : (util && util.commRate ? util.commRate : st.rate);

    // annualize the one bill
    const seasonIdx = (st.season && st.season[input.season]) || 1;
    let annual = (input.billMonthly / seasonIdx) * 12;
    const occ = input.occupancy && fac.seasonalityChip ? S.occupancy[input.occupancy] : 1;
    annual = annual / (occ || 1);
    const monthlyAvg = annual / 12;
    const kwh = annual / (rate / 100);

    // prefill chain
    const hotMult = st.coolShare >= S.climate.hotCoolShare ? S.climate.hotMult : (st.coolShare >= S.climate.warmCoolShare ? S.climate.warmMult : 1);
    const euiClimate = 1 + (hotMult - 1) * 0.6; // hot states run a higher intensity; partial credit
    const sqft = n.sqft != null ? n.sqft : kwh / (fac.eui_kwh_sqft * euiClimate);
    const age = n.age != null ? n.age : S.ageDefault;
    const hoursWeek = n.hours != null ? n.hours : (fac.hoursFixed || input.hoursWeek || (fac.hoursChips ? fac.hoursChips[1] : 60));
    const rh = runHours(fac, hoursWeek);

    // three products on one bill (display)
    // demand share of the bill: small accounts often have no demand meter at all, so tier by bill size (grade C rule)
    const baseDemand = (util && util.demandShare) || st.demandShare || S.demand.shareDefault;
    const sizeTier = input.billMonthly < 3000 ? 0.15 : (input.billMonthly < 10000 ? 0.28 : baseDemand);
    const demandShare = Math.min(baseDemand, sizeTier);
    const supplyShare = st.retailChoice === true ? S.brokering.supplyShareChoice : S.brokering.supplyShareDefault;
    const products = {
      demand: annual * demandShare,
      supply: annual * supplyShare,
      delivery: annual * Math.max(0, 1 - demandShare - supplyShare)
    };

    // HVAC split
    const pool = fac.hvac.cooling + fac.hvac.heat;
    const cs = st.coolShare;
    const cooling$ = annual * pool * cs * hotMult;
    const heatElectric$ = input.heat === 'gas' ? 0 : annual * pool * (1 - cs);
    const vent$ = annual * fac.hvac.ventilation;
    const refrig$ = annual * (fac.refrigShare || 0);

    // tons: the bill says how much compressor work is being done; square feet say how much capacity is installed.
    // Equivalent full load hours by climate (hot 2200, warm 1500, else 1000), scaled by how much of the week the building runs.
    const eflhBase = cs >= S.climate.hotCoolShare ? 2200 : (cs >= S.climate.warmCoolShare ? 1500 : 1000);
    const eflh = eflhBase * Math.max(0.5, rh / 8760);
    const coolingKwh = cooling$ / (rate / 100);
    const tonsFromBill = coolingKwh / (S.antifouling.kwPerTon * eflh);
    const tonsHot = st.coolShare >= S.climate.hotCoolShare ? S.climate.tonsHotMult : 1;
    const tonsFromSqft = (sqft / fac.sqftPerTon.mid) * tonsHot;
    const tons = n.tons != null ? n.tons : Math.sqrt(Math.max(1, tonsFromBill) * Math.max(1, tonsFromSqft));
    // cross-check: equipment side (tons x kW/ton x EFLH x rate) against the bill side
    const coolingEquip$ = tons * S.antifouling.kwPerTon * eflh * (rate / 100);
    const crossCheck = cooling$ > 0 ? coolingEquip$ / cooling$ : 1;
    if (crossCheck > 1.6 || crossCheck < 0.6) flags.push('coolingCrossCheck');

    // what moves this bill: the top three dollar lines a buyer can act on, in this building and this state
    const lighting$ = annual * (fac.lightingShare || 0);
    const hvacAll$ = cooling$ + heatElectric$ + vent$;
    const moverList = [
      { key: 'hvac', value: hvacAll$ },
      { key: 'refrig', value: refrig$ },
      { key: 'demand', value: products.demand },
      { key: 'supply', value: st.retailChoice === true ? products.supply : 0 },
      { key: 'lighting', value: lighting$ }
    ].filter(m => m.value > 0).sort((a, b) => b.value - a.value);
    const movers = moverList.slice(0, 3);
    const shares = { hvac: hvacAll$ / annual, refrig: refrig$ / annual, lighting: lighting$ / annual, demand: demandShare };

    /* ---------- Equipment not tuned ---------- */
    const loss = lossByAge(age);
    const antifouling = [cooling$ * loss, cooling$ * loss];
    const remainder = cooling$ * (1 - loss);
    const optimizer = R.mul(S.optimizer.standalone, remainder * S.optimizer.stackedFactor);
    let compressor = R.sum([antifouling, optimizer]);
    compressor = R.cap(compressor, cooling$ * S.compressorCeiling);

    const motorsRange = S.motorsBlended.range || S.motorsBlended;
    const ventilationAll = R.mul(motorsRange, vent$);
    const ventilation = L.ventilation ? ventilationAll : [0, 0];
    const motorsBase = fac.motorShare > 0.1 ? annual * fac.motorShare * demandShare : 0; // process motors only, fans already counted
    const motorsAll = R.mul(motorsRange, motorsBase);
    const motors = L.motors ? motorsAll : [0, 0];

    const heatRange = input.heat === 'resistance' ? S.heating.resistance
      : input.heat === 'hp' ? S.heating.heatPump
      : input.heat === 'gas' ? S.heating.gas : S.heating.unknown;
    const heatingAll = R.mul(heatRange, heatElectric$);
    const heating = L.heating ? heatingAll : [0, 0];

    const lightingAll = R.mul(S.lighting.retrofit, annual * (fac.lightingShare || 0) * (1 - S.lighting.ledDone));
    const lighting = L.lighting ? lightingAll : [0, 0];
    const harmonAll = R.mul(S.harmonization.kwh, annual);
    const harmon = L.harmonization ? harmonAll : [0, 0];
    const refrigAll = R.mul([0.05, 0.12], refrig$); // refrigeration tuning, conservative, grade C
    const refrigTune = (L.refrigeration && refrig$ > 0) ? refrigAll : [0, 0];

    let equipment = R.sum([compressor, ventilation, motors, heating, lighting, refrigTune, harmon]);
    const capRange = age >= S.caps.deferredAge ? [S.caps.equipment[0], S.caps.equipmentDeferred] : S.caps.equipment;
    const eqCap = [annual * capRange[0], annual * capRange[1]];
    const equipmentCapped = [Math.min(equipment[0], eqCap[0]), Math.min(equipment[1], eqCap[1])];
    if (equipmentCapped[1] < equipment[1]) flags.push('equipmentCapped');
    equipment = equipmentCapped;

    /* ---------- Peak demand ---------- */
    const demandPool = products.demand;
    // staging and soft start only where large motors and compressors actually start in steps: motor heavy buildings
    const stagingApplies = (fac.motorShare || 0) >= 0.3;
    const staging = stagingApplies ? [demandPool * S.demand.stagingFloor, demandPool * S.demand.stagingFloor] : [0, 0];
    const flat = isFlat(fac, hoursWeek);
    const battery = R.mul(flat ? S.demand.batteryFlat : S.demand.batteryPeaky, demandPool - staging[0]);
    let peak = R.sum([staging, battery]);
    const ratchet = util && util.ratchet ? util.ratchet : 0;
    peak = R.cap(peak, demandPool * (1 - ratchet));
    const pfPossible = !!(util && util.pfClause);

    /* ---------- Brokering ---------- */
    let brokering = [0, 0];
    let brokeringReason = 'noChoice';
    if (st.retailChoice === true) {
      brokering = R.mul(S.brokering.range, products.supply);
      brokeringReason = st.publicBoard ? 'board' : 'choice';
    } else if (st.retailChoice === 'capped') brokeringReason = 'capped';
    else if (st.retailChoice === 'largeOnly') brokeringReason = 'largeOnly';

    /* ---------- Totals ---------- */
    const perSite = R.sum([brokering, peak, equipment]);
    const total = R.mul(perSite, locations);
    const typical = R.geo(perSite) * locations;
    const months = [perSite[0] / monthlyAvg, perSite[1] / monthlyAvg];
    const esc = escalationFactor(st.escRate, 10);
    const tenYear = R.mul(total, esc);
    const meterMax = cleanMax(Math.max(150000, perSite[1] * 1.6));

    // cash flow illustration: the program is sized at two years of low end savings and financed over three,
    // so the payment stays under the savings while it runs and the whole amount is theirs after payoff
    const fin = S.finance || { paybackYears: 2, paymentShare: 0.5, rate: 0.08 };
    const floorMonthly = perSite[0] / 12;
    const program = floorMonthly * 12 * fin.paybackYears;
    const payment = floorMonthly * fin.paymentShare;                       // half the savings goes to the payment
    const i = fin.rate / 12;
    const termMonths = payment > 0 ? Math.ceil(-Math.log(1 - i * program / payment) / Math.log(1 + i)) : 0;  // months to pay it off at that payment
    const cash = { floorMonthly, program, payment, paybackYears: fin.paybackYears, paymentShare: fin.paymentShare, termMonths, termYears: Math.round(termMonths / 12 * 10) / 10,
      todayMonthly: monthlyAvg, afterBillMonthly: monthlyAvg - floorMonthly, keepMonthly: floorMonthly - payment, afterPayoffMonthly: floorMonthly };

    const assumptions = [
      { key: 'rate', value: rate, unit: 'c/kWh', confirmed: n.rate != null, src: rateSrc === 'utility' ? 'eia861' : (rateSrc === 'state' ? 'eia561' : 'you'), grade: rateSrc === 'you' ? 'A' : 'A' },
      { key: 'sqft', value: sqft, unit: 'sqft', confirmed: n.sqft != null, src: 'cbecs2018', grade: fac.grades ? fac.grades.eui : 'B' },
      { key: 'tons', value: tons, unit: 'tons', confirmed: n.tons != null, src: 'ashrae901', grade: fac.grades ? fac.grades.sqftPerTon : 'C' },
      { key: 'age', value: age, unit: 'years', confirmed: n.age != null, src: 'ashrae901', grade: 'U' },
      { key: 'hours', value: hoursWeek, unit: 'h/wk', confirmed: n.hours != null || fac.hoursFixed === 168, src: 'cbecsHours', grade: fac.grades ? fac.grades.hours : 'B' }
    ];

    return {
      inputs: { ...input, hoursWeek, locations },
      rate, rateSrc, annual, monthlyAvg, kwh, sqft, tons, age, hoursWeek, runHours: rh, flat,
      seasonIdx, occupancyFactor: occ, hotMult, crossCheck,
      products, demandShare, supplyShare,
      hvac: { cooling: cooling$, vent: vent$, heat: heatElectric$, refrig: refrig$, loss },
      movers, shares,
      buckets: {
        brokering: { range: brokering, reason: brokeringReason, lines: [{ id: 'supply', range: brokering }] },
        peak: { range: peak, flat, pfPossible, lines: [{ id: 'staging', range: staging, applies: stagingApplies }, { id: 'battery', range: battery }] },
        equipment: { range: equipment, cap: eqCap, lines: [
          { id: 'antifouling', range: antifouling, note: { loss } },
          { id: 'optimizer', range: optimizer },
          { id: 'refrigeration', range: refrigTune, optional: refrig$ > 0, on: L.refrigeration, applies: refrig$ > 0, potential: refrigAll },
          { id: 'harmonization', range: harmon, optional: true, on: L.harmonization, applies: true, potential: harmonAll },
          { id: 'heating', range: heating, optional: heatElectric$ > 0, on: L.heating, applies: heatElectric$ > 0, potential: heatingAll },
          { id: 'lighting', range: lighting, optional: true, on: L.lighting, applies: (fac.lightingShare || 0) > 0, potential: lightingAll },
          { id: 'ventilation', range: ventilation, optional: true, on: L.ventilation, applies: vent$ > 0, potential: ventilationAll },
          { id: 'motors', range: motors, optional: motorsBase > 0, on: L.motors, applies: motorsBase > 0, potential: motorsAll }
        ] }
      },
      perSite, total, typical, months, tenYear, escRate: st.escRate,
      meter: { max: meterMax, lo: perSite[0], hi: perSite[1], needle: R.geo(perSite) },
      cash,
      assumptions, flags
    };
  }

  /* bill bands: six geometric bands over a facility's range, returns [{lo, hi, mid, label}] */
  function billBands(fac) {
    const edges = fac.billBands;
    const out = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const lo = edges[i], hi = edges[i + 1];
      out.push({ lo, hi, mid: Math.sqrt(lo * hi), label: `$${fmtK(lo)} to $${fmtK(hi)}` });
    }
    return out;
  }

  function fmtK(x) { return x >= 1000 ? (x / 1000).toFixed(x % 1000 ? 1 : 0) + 'k' : String(x); }

  function fmtMoney(x, step) {
    const s = step || (x >= 1000000 ? 10000 : x >= 100000 ? 1000 : x >= 10000 ? 500 : 100);
    return '$' + R.round(x, s).toLocaleString('en-US');
  }

  function fmtRange(r, step) { return `${fmtMoney(r[0], step)} to ${fmtMoney(r[1], step)}`; }

  function resolveUtility(name) {
    // match an EIA-861 utility name to one of the sourced utilities in constants
    const list = EP().utilities || [];
    const lower = (name || '').toLowerCase();
    for (const u of list) {
      for (const m of (u.matchNames || [])) if (lower.includes(m.toLowerCase())) return u;
    }
    return null;
  }

  root.EPEngine = { compute, billBands, lossByAge, escalationFactor, fmtMoney, fmtRange, fmtK, resolveUtility, R };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined') module.exports = (typeof window !== 'undefined' ? window : globalThis).EPEngine;
