// Energy Plus Overspend Calculator — constants.js
// Plain script, no modules, no fetch. Assigns window.EP.
// Every top-level facility, state, and stream entry carries src (short source key,
// see EP.sources) and grade (A primary federal/tariff doc, B derived/secondary,
// C trade/vendor/internal estimate, U unsourced/planning assumption) where the
// research assigns confidence. Reviewed 2026-09-09 against research/01 to research/12
// and PRESUPPOSITIONS-v2.md. Where research says NOT FOUND, the presuppositions
// value is used and grade is "U".

(function () {
  "use strict";

  var EP = {};

  EP.meta = {
    usRate: 14.19, usRateSrc: "eia561",
    version: "1.0",
    reviewed: "2026-09-09"
  };

  // ---------------------------------------------------------------------
  // FACILITIES
  // ---------------------------------------------------------------------
  // hvac shares are CBECS 2018 Table E5 comfort-HVAC splits (cooling, ventilation,
  // electric heat) as a fraction of total electricity, national, per research/01
  // and the Sept 9 correction in PRESUPPOSITIONS-v2 section 2 (ventilation is a
  // separate, often-largest, HVAC electric end use, not folded into "cooling").
  //
  // billBands: six geometric monthly-dollar band edges per facility, sized off
  // the facility's EUI (kWh/sqft/yr) and a reasoned "typical size class" (small
  // footprint retail-format businesses like QSR/c-store get lower bands even when
  // EUI is high; large-footprint or 24/7 types like healthcare/datacenter get
  // higher bands). This is a UX/design judgment, not a sourced statistic — treat
  // every billBands array as grade U / "Energy Plus estimate" regardless of the
  // facility's other grades.

  EP.facilities = {

    office: {
      label: "Office", labelEs: "Oficina",
      hvac: { cooling: 0.10, ventilation: 0.28, heat: 0.06 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.075,
      eui_kwh_sqft: 15, sqftPerTon: { lo: 300, hi: 500, mid: 400 },
      hoursChips: [45, 55, 70], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.40, hi: 0.60 }, seasonalityChip: false,
      grades: { hvac: "A", eui: "B", sqftPerTon: "B", hours: "A" },
      billBands: [2000, 5000, 12000, 25000, 60000, 150000]
    },

    hotel: {
      label: "Hotel", labelEs: "Hotel",
      hvac: { cooling: 0.12, ventilation: 0.25, heat: 0.07 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.08,
      eui_kwh_sqft: 16, sqftPerTon: { lo: 300, hi: 400, mid: 350 },
      hoursChips: null, hoursFixed: 168, occupancyIndependent: false,
      loadFactor: { lo: 0.55, hi: 0.75 }, seasonalityChip: true,
      grades: { hvac: "A", eui: "B", sqftPerTon: "C", hours: "A" },
      billBands: [3000, 8000, 18000, 35000, 80000, 200000]
    },

    healthcare: {
      label: "Healthcare", labelEs: "Atencion medica",
      hvac: { cooling: 0.10, ventilation: 0.30, heat: 0.02 },
      refrigShare: 0, motorShare: 0.30, lightingShare: 0.06,
      eui_kwh_sqft: 20, sqftPerTon: { lo: 200, hi: 350, mid: 275 },
      hoursChips: null, hoursFixed: 168, occupancyIndependent: true,
      loadFactor: { lo: 0.80, hi: 1.00 }, seasonalityChip: false,
      grades: { hvac: "A", eui: "B", sqftPerTon: "U", hours: "A" },
      billBands: [4000, 10000, 25000, 50000, 120000, 300000]
    },

    coldstorage: {
      label: "Cold storage", labelEs: "Almacenamiento en frio",
      hvac: { cooling: 0.03, ventilation: 0.04, heat: 0.01 },
      refrigShare: 0.70, motorShare: 0.50, lightingShare: 0.02,
      eui_kwh_sqft: 25, sqftPerTon: { lo: 100, hi: 300, mid: 200 },
      hoursChips: null, hoursFixed: 168, occupancyIndependent: true,
      loadFactor: { lo: 0.70, hi: 0.95 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "U", sqftPerTon: "U", hours: "B" },
      billBands: [3000, 7000, 15000, 30000, 70000, 160000]
    },

    supermarket: {
      label: "Supermarket", labelEs: "Supermercado",
      hvac: { cooling: 0.04, ventilation: 0.07, heat: 0.04 },
      refrigShare: 0.48, motorShare: 0.07, lightingShare: 0.09,
      eui_kwh_sqft: 53.3, sqftPerTon: { lo: 100, hi: 350, mid: 225 },
      hoursChips: [98, 112, 126], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.70, hi: 0.90 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "A", sqftPerTon: "B", hours: "A" },
      billBands: [5000, 12000, 25000, 45000, 90000, 200000]
    },

    retail: {
      label: "Retail", labelEs: "Comercio minorista",
      hvac: { cooling: 0.13, ventilation: 0.25, heat: 0.04 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.09,
      eui_kwh_sqft: 13.5, sqftPerTon: { lo: 250, hi: 400, mid: 325 },
      hoursChips: [45, 55, 70], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.25, hi: 0.50 }, seasonalityChip: false,
      grades: { hvac: "A", eui: "B", sqftPerTon: "B", hours: "A" },
      billBands: [1500, 4000, 9000, 18000, 40000, 100000]
    },

    qsr: {
      label: "Quick service restaurant", labelEs: "Restaurante de comida rapida",
      hvac: { cooling: 0.11, ventilation: 0.11, heat: 0.07 },
      refrigShare: 0.26, motorShare: 0.07, lightingShare: 0.09,
      eui_kwh_sqft: 42.5, sqftPerTon: { lo: 100, hi: 300, mid: 200 },
      hoursChips: [70, 84, 98], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.40, hi: 0.60 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "B", sqftPerTon: "B", hours: "A" },
      billBands: [1000, 2500, 5000, 10000, 20000, 45000]
    },

    cstore: {
      label: "Convenience store", labelEs: "Tienda de conveniencia",
      hvac: { cooling: 0.04, ventilation: 0.07, heat: 0.04 },
      refrigShare: 0.42, motorShare: 0.07, lightingShare: 0.115,
      eui_kwh_sqft: 12.6, sqftPerTon: { lo: 200, hi: 350, mid: 275 },
      hoursChips: [84, 126, 168], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.65, hi: 0.85 }, seasonalityChip: false,
      grades: { hvac: "C", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [800, 1800, 3500, 7000, 15000, 35000]
    },

    warehouse: {
      label: "Warehouse", labelEs: "Almacen",
      hvac: { cooling: 0.16, ventilation: 0.07, heat: 0.06 },
      refrigShare: 0, motorShare: 0.40, lightingShare: 0.09,
      eui_kwh_sqft: 7, sqftPerTon: { lo: 400, hi: 1500, mid: 950 },
      hoursChips: [45, 55, 72], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.25, hi: 0.50 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "A", sqftPerTon: "B", hours: "A" },
      billBands: [1500, 4000, 9000, 20000, 45000, 110000]
    },

    multifamily: {
      label: "Multifamily", labelEs: "Multifamiliar",
      hvac: { cooling: 0.15, ventilation: 0.05, heat: 0.15 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.075,
      eui_kwh_sqft: 10, sqftPerTon: { lo: 350, hi: 450, mid: 400 },
      hoursChips: [84, 126, 168], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.45, hi: 0.65 }, seasonalityChip: false,
      grades: { hvac: "U", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [2000, 5000, 11000, 22000, 50000, 120000]
    },

    education: {
      label: "Education", labelEs: "Educacion",
      hvac: { cooling: 0.20, ventilation: 0.15, heat: 0.05 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.075,
      eui_kwh_sqft: 11, sqftPerTon: { lo: 300, hi: 400, mid: 350 },
      hoursChips: [40, 50, 60], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.30, hi: 0.50 }, seasonalityChip: true,
      grades: { hvac: "A", eui: "B", sqftPerTon: "B", hours: "A" },
      billBands: [3000, 7000, 15000, 30000, 65000, 150000]
    },

    fitness: {
      label: "Fitness", labelEs: "Gimnasio",
      hvac: { cooling: 0.32, ventilation: 0.09, heat: 0.09 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.08,
      eui_kwh_sqft: 12.6, sqftPerTon: { lo: 250, hi: 400, mid: 325 },
      hoursChips: [50, 65, 80], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.40, hi: 0.60 }, seasonalityChip: false,
      grades: { hvac: "C", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [1500, 4000, 9000, 18000, 38000, 90000]
    },

    manufacturing: {
      label: "Manufacturing", labelEs: "Manufactura",
      hvac: { cooling: 0.03, ventilation: 0.03, heat: 0.02 },
      refrigShare: 0, motorShare: 0.55, lightingShare: 0.05,
      eui_kwh_sqft: 12.6, sqftPerTon: { lo: 300, hi: 800, mid: 550 },
      hoursChips: [40, 80, 120], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.50, hi: 0.75 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [3000, 8000, 18000, 40000, 90000, 220000]
    },

    datacenter: {
      label: "Data center", labelEs: "Centro de datos",
      hvac: { cooling: 0.35, ventilation: 0.05, heat: 0 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.02,
      eui_kwh_sqft: 100, sqftPerTon: { lo: 150, hi: 300, mid: 225 },
      hoursChips: null, hoursFixed: 168, occupancyIndependent: true,
      loadFactor: { lo: 0.85, hi: 0.95 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "C", sqftPerTon: "B", hours: "C" },
      billBands: [5000, 15000, 35000, 70000, 150000, 400000]
    },

    lab: {
      label: "Laboratory", labelEs: "Laboratorio",
      hvac: { cooling: 0.20, ventilation: 0.40, heat: 0.05 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.06,
      eui_kwh_sqft: 40, sqftPerTon: { lo: 150, hi: 300, mid: 225 },
      hoursChips: null, hoursFixed: 168, occupancyIndependent: true,
      loadFactor: { lo: 0.55, hi: 0.75 }, seasonalityChip: false,
      grades: { hvac: "B", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [4000, 10000, 22000, 45000, 100000, 250000]
    },

    mixeduse: {
      label: "Mixed use", labelEs: "Uso mixto",
      hvac: { cooling: 0.12, ventilation: 0.26, heat: 0.05 },
      refrigShare: 0, motorShare: 0.07, lightingShare: 0.08,
      eui_kwh_sqft: 14, sqftPerTon: { lo: 275, hi: 425, mid: 350 },
      hoursChips: [45, 55, 70], hoursFixed: null, occupancyIndependent: false,
      loadFactor: { lo: 0.35, hi: 0.55 }, seasonalityChip: false,
      grades: { hvac: "C", eui: "U", sqftPerTon: "U", hours: "U" },
      billBands: [2500, 6000, 14000, 28000, 65000, 150000]
    }

  };

  // ---------------------------------------------------------------------
  // STATES (50 + DC)
  // ---------------------------------------------------------------------
  // rate: EIA Electric Power Monthly Table 5.6.A, commercial sector, June 2026
  // "Current" cents/kWh (research/06), grade A.
  // coolShare: derived cooling-share-of-HVAC-electricity table (research/08),
  // grade B; AK, HI, DC are climate-zone-analogy estimates (no NOAA state
  // series), grade C. Florida is capped at 90 per research/08's explicit cap.
  // escTier: 1 = CA HI MA NY NJ CT; 4 = WA ID MT ND SD NE WY; research/06 names
  // no explicit tier-2 state list, so every remaining state defaults to tier 3.
  // retailChoice: true = full commercial choice; "capped" = MI (10% cap, full,
  // waitlisted); "largeOnly" = VA (opens above 5 MW peak or approved
  // aggregation). publicBoard: true only where a public small-business supplier
  // offer board was confirmed live (research/10b): PA, OH.
  // season: EIA-861M monthly index (research/12, data/state-seasonal-index.json).

  function st(name, rate, coolShare, coolShareGrade, escTier, retailChoice, publicBoard, season) {
    return {
      name: name,
      rate: rate, src: "eia561", grade: "A",
      coolShare: coolShare, coolShareSrc: "research/08", coolShareGrade: coolShareGrade,
      escTier: escTier, escGrade: "B",
      escRate: { 1: 0.045, 2: 0.035, 3: 0.025, 4: 0.018 }[escTier],
      retailChoice: retailChoice,
      publicBoard: publicBoard,
      season: season,
      demandShare: 0.40, demandRate: 12.5
    };
  }

  EP.states = {
    AL: st("Alabama", 14.67, 0.77, "B", 3, false, false, { summer: 1.151, winter: 0.919, mild: 0.928 }),
    AK: st("Alaska", 23.42, 0.25, "C", 3, false, false, { summer: 0.959, winter: 1.072, mild: 0.989 }),
    AZ: st("Arizona", 12.47, 0.87, "B", 3, false, false, { summer: 1.208, winter: 0.846, mild: 0.925 }),
    AR: st("Arkansas", 11.54, 0.73, "B", 3, false, false, { summer: 1.177, winter: 0.910, mild: 0.912 }),
    CA: st("California", 27.33, 0.68, "B", 1, false, false, { summer: 1.088, winter: 0.942, mild: 0.964 }),
    CO: st("Colorado", 14.19, 0.36, "B", 3, false, false, { summer: 1.076, winter: 0.976, mild: 0.954 }),
    CT: st("Connecticut", 19.62, 0.52, "B", 1, true, false, { summer: 1.100, winter: 0.977, mild: 0.934 }),
    DE: st("Delaware", 14.40, 0.66, "B", 3, true, false, { summer: 1.145, winter: 0.971, mild: 0.901 }),
    DC: st("District of Columbia", 23.38, 0.66, "C", 3, true, false, { summer: 1.112, winter: 0.997, mild: 0.912 }),
    FL: st("Florida", 11.47, 0.90, "B", 3, false, false, { summer: 1.139, winter: 0.865, mild: 0.970 }),
    GA: st("Georgia", 11.91, 0.75, "B", 3, false, false, { summer: 1.131, winter: 0.925, mild: 0.940 }),
    HI: st("Hawaii", 48.05, 0.90, "C", 1, false, false, { summer: 1.048, winter: 0.934, mild: 1.002 }),
    ID: st("Idaho", 9.92, 0.43, "B", 4, false, false, { summer: 1.049, winter: 1.024, mild: 0.947 }),
    IL: st("Illinois", 14.53, 0.58, "B", 3, true, false, { summer: 1.084, winter: 1.001, mild: 0.932 }),
    IN: st("Indiana", 14.15, 0.60, "B", 3, false, false, { summer: 1.107, winter: 0.956, mild: 0.940 }),
    IA: st("Iowa", 12.79, 0.54, "B", 3, false, false, { summer: 1.054, winter: 1.017, mild: 0.946 }),
    KS: st("Kansas", 12.27, 0.67, "B", 3, false, false, { summer: 1.145, winter: 0.935, mild: 0.923 }),
    KY: st("Kentucky", 12.40, 0.67, "B", 3, false, false, { summer: 1.120, winter: 0.965, mild: 0.925 }),
    LA: st("Louisiana", 11.64, 0.88, "B", 3, false, false, { summer: 1.170, winter: 0.892, mild: 0.928 }),
    ME: st("Maine", 22.24, 0.32, "B", 3, true, false, { summer: 1.036, winter: 1.025, mild: 0.956 }),
    MD: st("Maryland", 16.84, 0.66, "B", 3, true, false, { summer: 1.104, winter: 0.996, mild: 0.919 }),
    MA: st("Massachusetts", 24.52, 0.47, "B", 1, true, false, { summer: 1.056, winter: 1.015, mild: 0.947 }),
    MI: st("Michigan", 16.63, 0.47, "B", 3, "capped", false, { summer: 1.095, winter: 0.972, mild: 0.941 }),
    MN: st("Minnesota", 13.68, 0.38, "B", 3, false, false, { summer: 1.062, winter: 1.002, mild: 0.949 }),
    MS: st("Mississippi", 13.83, 0.80, "B", 3, false, false, { summer: 1.183, winter: 0.887, mild: 0.921 }),
    MO: st("Missouri", 12.71, 0.66, "B", 3, false, false, { summer: 1.116, winter: 0.977, mild: 0.920 }),
    MT: st("Montana", 13.48, 0.29, "B", 4, false, false, { summer: 0.998, winter: 1.064, mild: 0.962 }),
    NE: st("Nebraska", 8.82, 0.59, "B", 4, false, false, { summer: 1.073, winter: 0.995, mild: 0.945 }),
    NV: st("Nevada", 9.83, 0.75, "B", 3, false, false, { summer: 1.158, winter: 0.884, mild: 0.943 }),
    NH: st("New Hampshire", 21.22, 0.34, "B", 3, true, false, { summer: 1.065, winter: 1.016, mild: 0.938 }),
    NJ: st("New Jersey", 18.47, 0.60, "B", 1, true, false, { summer: 1.095, winter: 0.993, mild: 0.928 }),
    NM: st("New Mexico", 10.82, 0.65, "B", 3, false, false, { summer: 1.137, winter: 0.910, mild: 0.944 }),
    NY: st("New York", 23.56, 0.52, "B", 1, true, false, { summer: 1.089, winter: 1.000, mild: 0.929 }),
    NC: st("North Carolina", 10.51, 0.71, "B", 3, false, false, { summer: 1.126, winter: 0.931, mild: 0.941 }),
    ND: st("North Dakota", 8.02, 0.37, "B", 4, false, false, { summer: 0.978, winter: 1.023, mild: 1.004 }),
    OH: st("Ohio", 13.77, 0.57, "B", 3, true, true, { summer: 1.087, winter: 0.962, mild: 0.953 }),
    OK: st("Oklahoma", 9.90, 0.73, "B", 3, false, false, { summer: 1.156, winter: 0.901, mild: 0.935 }),
    OR: st("Oregon", 10.59, 0.36, "B", 3, false, false, { summer: 1.028, winter: 1.018, mild: 0.967 }),
    PA: st("Pennsylvania", 13.33, 0.55, "B", 3, true, true, { summer: 1.073, winter: 1.014, mild: 0.933 }),
    RI: st("Rhode Island", 22.70, 0.50, "B", 3, true, false, { summer: 1.160, winter: 0.928, mild: 0.915 }),
    SC: st("South Carolina", 11.62, 0.77, "B", 3, false, false, { summer: 1.135, winter: 0.931, mild: 0.934 }),
    SD: st("South Dakota", 11.35, 0.48, "B", 4, false, false, { summer: 1.048, winter: 1.023, mild: 0.948 }),
    TN: st("Tennessee", 13.94, 0.70, "B", 3, false, false, { summer: 1.143, winter: 0.939, mild: 0.923 }),
    TX: st("Texas", 8.66, 0.87, "B", 3, true, false, { summer: 1.125, winter: 0.901, mild: 0.959 }),
    UT: st("Utah", 10.99, 0.45, "B", 3, false, false, { summer: 1.094, winter: 0.965, mild: 0.946 }),
    VT: st("Vermont", 21.22, 0.31, "B", 3, false, false, { summer: 1.062, winter: 1.006, mild: 0.947 }),
    VA: st("Virginia", 10.99, 0.66, "B", 3, "largeOnly", false, { summer: 1.095, winter: 0.950, mild: 0.954 }),
    WA: st("Washington", 11.77, 0.32, "B", 4, false, false, { summer: 1.002, winter: 1.034, mild: 0.978 }),
    WV: st("West Virginia", 11.09, 0.59, "B", 3, false, false, { summer: 1.060, winter: 1.002, mild: 0.951 }),
    WI: st("Wisconsin", 14.05, 0.42, "B", 3, false, false, { summer: 1.076, winter: 0.987, mild: 0.947 }),
    WY: st("Wyoming", 10.01, 0.33, "B", 4, false, false, { summer: 0.997, winter: 1.029, mild: 0.985 })
  };

  // ---------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------
  // Sourced utility rows only. demandRate in $/kW-month. pfClause per research/03
  // billing-mechanism table. rebate program names/URLs per research/09.

  EP.utilities = [
    {
      id: "fpl", name: "Florida Power & Light", state: "FL",
      demandRate: 11.46, demandGrade: "A", demandSrc: "fplTariff",
      pfClause: { threshold: 0.85, rule: "billed kW times 0.85 divided by actual PF" },
      pfGrade: "A", pfSrc: "fplTariff",
      ratchet: null,
      rebate: { name: "FPL Business Energy Programs", url: "https://www.fpl.com/business/save/programs.html" },
      matchNames: ["Florida Power & Light", "FPL"]
    },
    {
      id: "dukefl", name: "Duke Energy Florida", state: "FL",
      demandRate: 7.77, demandGrade: "A", demandSrc: "duke tariff, GSD-1, Aug 1 2025",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "Duke Energy Florida Smart $aver Business Rebates", url: "https://www.duke-energy.com/business/products/smartsaver" },
      matchNames: ["Duke Energy Florida"]
    },
    {
      id: "teco", name: "Tampa Electric (TECO)", state: "FL",
      demandRate: 19.62, demandGrade: "B", demandSrc: "TECO 2025 rate case, proposed",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "TECO Business Rebates", url: "https://www.tecopartners.com/rebateprocessing/about/" },
      matchNames: ["Tampa Electric", "TECO"]
    },
    {
      id: "gapower", name: "Georgia Power", state: "GA",
      demandRate: 11.21, demandRateLarge: 13.63, demandGrade: "A", demandSrc: "gaPowerTariff",
      pfClause: { threshold: 0.95, rule: "excess reactive demand, kVAR above one third of kW, billed per PLH-13" },
      pfGrade: "A", pfSrc: "gaPowerTariff",
      ratchet: null,
      rebate: { name: "Georgia Power Commercial Energy Efficiency Program", url: "https://www.georgiapower.com/business/save-money-and-energy/commercial-rebates-and-incentives.html" },
      matchNames: ["Georgia Power"]
    },
    {
      id: "coned", name: "Consolidated Edison", state: "NY",
      demandRate: 19.5, demandRateSummer: 17.22, demandRateWinter: 21.82,
      demandGrade: "B", demandSrc: "OpenEI URDB SC-9 Rate I",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "ConEd C&I Energy Efficiency and Electrification Program", url: "https://www.coned.com/-/media/files/coned/documents/save-energy-money/rebates-incentives-tax-credits/rebates-incentives-tax-credits-for-commercial-industrial-buildings-customers/commercial-and-industrial-program/program-manual.pdf" },
      matchNames: ["Consolidated Edison", "Con Edison", "ConEd"]
    },
    {
      id: "dukecarolinas", name: "Duke Energy Carolinas / Progress", state: "NC",
      states: ["NC", "SC"],
      demandRate: null, demandGrade: "U", demandSrc: "not confirmed, secondary aggregator only",
      pfClause: null, pfGrade: "U",
      ratchet: 0.70, ratchetGrade: "C",
      rebate: { name: "Duke Energy Carolinas/Progress Smart $aver Business Rebates", url: "https://www.duke-energy.com/business/products/smartsaver" },
      matchNames: ["Duke Energy Carolinas", "Duke Energy Progress"]
    },
    {
      id: "oncor", name: "Oncor", state: "TX",
      demandRate: 14, demandGrade: "C", demandSrc: "secondary blog, not PUCT tariff",
      pfClause: { threshold: 0.95, rule: "billing demand adjusted using average PF during the 15-minute peak interval, Tariff 5.5.5" },
      pfGrade: "C", pfSrc: "secondary summary, primary tariff text not independently fetched",
      ratchet: null,
      rebate: { name: "Oncor Take A Load Off, Texas", url: "https://www.oncor.com/content/oncorwww/wire/en/home/energy-efficiency/smart-money--energy-incentives-cut-costs---bills.html" },
      matchNames: ["Oncor"]
    },
    {
      id: "centerpoint", name: "CenterPoint Energy", state: "TX",
      demandRate: null, demandGrade: "U", demandSrc: "secondary source, wide range $3 to $12+/kW",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "CenterPoint Energy Commercial Electric Service Rebates / C&I Standard Offer", url: "https://www.centerpointenergy.com/en-us/business/save-energy-money/efficiency-programs-rebates/electric-service-rebates" },
      matchNames: ["CenterPoint"]
    },
    {
      id: "pge", name: "Pacific Gas & Electric", state: "CA",
      demandRate: null, demandGrade: "U", demandSrc: "B-19/B-20 PDF not extractable",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "PG&E Business Energy Efficiency Rebates", url: "https://www.pge.com/en/save-energy-and-money/rebates-and-incentives/business-energy-efficiency-rebates.html" },
      matchNames: ["Pacific Gas & Electric", "PG&E"]
    },
    {
      id: "sce", name: "Southern California Edison", state: "CA",
      demandRate: null, demandGrade: "U", demandSrc: "not confirmed",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "SCE Commercial Energy Efficiency Program (CEEP)", url: "https://www.sce.com/save-money/rebates-financial-assistance/rebates-sce-marketplace" },
      matchNames: ["Southern California Edison", "SCE"]
    },
    {
      id: "dominionsc", name: "Dominion Energy South Carolina", state: "SC",
      demandRate: null, demandGrade: "U", demandSrc: "not sourced at demand-rate precision",
      pfClause: null, pfGrade: "U",
      ratchet: null,
      rebate: { name: "Dominion Energy SC Small Business Energy Solutions", url: "https://www.dominionenergy.com/south-carolina/save-energy/small-business-incentives" },
      matchNames: ["Dominion Energy South Carolina", "Dominion South Carolina"]
    }
  ];

  // ---------------------------------------------------------------------
  // STREAMS
  // ---------------------------------------------------------------------
  // Exactly the values decided in BUILD-SPEC.md and PRESUPPOSITIONS-v2.md.

  EP.streams = {

    antifouling: {
      lossByAge: {
        1: 0.03, 2: 0.065, 3: 0.093, 4: 0.118, 5: 0.136, 6: 0.155, 7: 0.175,
        8: 0.188, 9: 0.207, 10: 0.216, 11: 0.226, 12: 0.231, 13: 0.236, 14: 0.242
      },
      kwPerTon: 1.05,
      src: null, grade: "C" // "Energy Plus measured"; category math, decided keep 2026-09-09
    },

    optimizer: {
      standalone: [0.15, 0.30],
      stackedFactor: 0.65,
      src: null, grade: "C" // Energy Plus field results, not ORNL (5-10%) or Fraunhofer (0-17%)
    },

    rcx: { range: [0.05, 0.15], src: null, grade: "B" },

    compressorCeiling: 0.55, // 55% of compressor cooling
    compressorCeilingSrc: "ashrae901", compressorCeilingGrade: "B",

    motorsBlended: { range: [0.15, 0.35], src: "doeMotors", grade: "B" },

    heating: {
      resistance: [0.55, 0.70],
      heatPump: [0, 0.50],
      unknown: [0.25, 0.60],
      gas: [0, 0],
      src: null, grade: "B"
    },

    lighting: {
      ledDone: 0.47,
      retrofit: [0.40, 0.50],
      ledDoneSrc: "doeLighting", ledDoneGrade: "A",
      retrofitSrc: null, retrofitGrade: "C"
    },

    harmonization: {
      kwh: [0.005, 0.03],
      display: 0.01,
      src: "eaton2010", grade: "A"
    },

    demand: {
      shareDefault: 0.40,
      shareRange: [0.30, 0.70],
      stagingFloor: 0.05,
      batteryPeaky: [0.30, 0.50],
      batteryFlat: [0.10, 0.25],
      flatHoursThreshold: 140,
      shareSrc: "nrelDemand", shareGrade: "A",
      stagingFloorSrc: null, stagingFloorGrade: "U",
      batterySrc: "nrelDemand", batteryGrade: "B"
    },

    brokering: {
      supplyShareChoice: 0.45,
      supplyShareDefault: 0.40,
      range: [0, 0.12],
      typicalBill: [0.025, 0.06],
      src: "papuc", grade: "A"
    },

    caps: {
      equipment: [0.25, 0.30],
      equipmentDeferred: 0.35,
      deferredAge: 15,
      equipmentSrc: "mills2009", equipmentGrade: "A",
      deferredGrade: "B", deferredAgeGrade: "U"
    },

    climate: {
      hotCoolShare: 0.85,
      warmCoolShare: 0.70,
      hotMult: 1.15,
      warmMult: 1.05,
      tonsHotMult: 1.15,
      src: null, grade: "B" // Confidence A for the national HVAC split, B for climate scaling
    },

    hours: {
      openToRunHours: 1.5,
      src: "cbecsHours", grade: "B"
    },

    occupancy: {
      busy: 1.15, slow: 0.85, typical: 1,
      src: "strOccupancy", grade: "U" // pending a monthly occupancy pull; labeled a planning assumption
    },

    finance: { paybackYears: 2, paymentShare: 0.5, rate: 0.08, src: null, grade: "C", note: "illustration: program sized at two years of low end savings; payment set at half the savings so half is free cash flow from day one; the term falls out of that; rate is not shown to the buyer" },
    ageDefault: 10,
    ageDefaultSrc: null, ageDefaultGrade: "U"

  };

  // ---------------------------------------------------------------------
  // INCENTIVES
  // ---------------------------------------------------------------------
  // From research/09 trigger table, verified 2026-09-09. Excludes 179D,
  // EPA/DOE discretionary grants, and California SGIP commercial per
  // PRESUPPOSITIONS-v2 section 6.

  EP.incentives = [
    {
      id: "itc48e-solar", level: "Federal", measures: ["Solar PV"], states: "all", utilities: null,
      display: "May qualify for a federal clean electricity tax credit on solar, up to 30 percent with labor requirements",
      url: "https://www.irs.gov/credits-deductions/clean-electricity-investment-credit",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "itc48e-storage", level: "Federal", measures: ["Battery storage"], states: "all", utilities: null,
      display: "May qualify for a federal tax credit on battery storage, up to 30 percent",
      url: "https://www.irs.gov/credits-deductions/clean-electricity-investment-credit",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "bonus-depreciation", level: "Federal", measures: ["Solar", "Battery storage", "Most capital equipment"], states: "all", utilities: null,
      display: "May qualify for full first-year depreciation on equipment cost",
      url: "https://www.chapman.com/publication-impact-of-one-big-beautiful-bill-on-clean-energy-tax-credits",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "usda-reap", level: "Federal", measures: ["Solar", "HVAC", "Efficiency"], states: "all", utilities: null,
      display: "May qualify for a USDA-guaranteed loan for renewable or efficiency projects, grants currently paused",
      url: "https://www.rd.usda.gov/inflation-reduction-act/rural-energy-america-program-reap",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "sc-solar-credit", level: "State", measures: ["Solar PV"], states: ["SC"], utilities: null,
      display: "May qualify for South Carolina's 25 percent state solar tax credit",
      url: "https://www.dsireusa.org/",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "tx-pace", level: "Financing", measures: ["Solar", "Storage", "HVAC", "Envelope"], states: ["TX"], utilities: null,
      display: "May qualify for low-cost PACE financing through your local TX-PACE administrator",
      url: "https://www.texaspaceauthority.org/property-assessed-clean-energy/",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "fl-pace", level: "Financing", measures: ["Solar", "Storage", "HVAC", "Envelope"], states: ["FL"], utilities: null,
      display: "May qualify for local PACE financing, availability varies by county",
      url: "https://programs.dsireusa.org/system/program/detail/3869/florida-pace-programs",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "nc-ga-cpace", level: "Financing", measures: ["Solar", "Storage", "HVAC", "Envelope"], states: ["NC", "GA"], utilities: null,
      display: "May qualify for C-PACE financing where your local jurisdiction participates",
      url: "https://commercial-solar.org/north-carolina/solar-incentives/",
      verified: "2026-09-09", confidence: "Low"
    },
    {
      id: "ca-solar-tax-exclusion", level: "State", measures: ["Solar PV"], states: ["CA"], utilities: null,
      display: "New solar systems may be excluded from property tax reassessment in California",
      url: "https://www.dsireusa.org/",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "ny-sun", level: "State", measures: ["Solar PV"], states: ["NY"], utilities: null,
      display: "May qualify for a per-watt NY-Sun rebate, amount varies by region and block",
      url: "https://www.nyserda.ny.gov/All-Programs/NY-Sun",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "fpl-rebates", level: "Utility", measures: ["Lighting", "HVAC", "VFD"], states: ["FL"], utilities: ["fpl"],
      display: "May qualify for FPL rebates on efficient lighting and HVAC upgrades",
      url: "https://www.fpl.com/business/save/programs.html",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "duke-smartsaver", level: "Utility", measures: ["HVAC", "Lighting", "Refrigeration", "Chillers"], states: ["FL", "NC", "SC"], utilities: ["dukefl", "dukecarolinas"],
      display: "May qualify for Duke Energy Smart $aver rebates on efficient equipment",
      url: "https://www.duke-energy.com/business/products/smartsaver",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "teco-rebates", level: "Utility", measures: ["Lighting", "HVAC"], states: ["FL"], utilities: ["teco"],
      display: "May qualify for TECO rebates on lighting and HVAC upgrades",
      url: "https://www.tecopartners.com/rebateprocessing/about/",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "oncor-load-off", level: "Utility", measures: ["HVAC", "Lighting", "Solar", "Load management"], states: ["TX"], utilities: ["oncor"],
      display: "May qualify for Oncor efficiency rebates, budget limited and resets annually",
      url: "https://www.oncor.com/content/oncorwww/wire/en/home/energy-efficiency/smart-money--energy-incentives-cut-costs---bills.html",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "centerpoint-standard-offer", level: "Utility", measures: ["Demand reduction", "Efficiency"], states: ["TX"], utilities: ["centerpoint"],
      display: "May qualify for CenterPoint demand and energy savings payments",
      url: "https://www.centerpointenergy.com/en-us/business/save-energy-money/efficiency-programs-rebates/electric-service-rebates",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "aep-tx-smart-source", level: "Utility", measures: ["Solar PV"], states: ["TX"], utilities: null,
      display: "May qualify for an AEP Texas solar rebate up to $50,000",
      url: "https://www.txreincentives.com/",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "dominion-sc-small-business", level: "Utility", measures: ["HVAC", "Lighting", "Water heating"], states: ["SC"], utilities: ["dominionsc"],
      display: "May qualify for Dominion Energy SC rebates covering up to 90 percent of project cost",
      url: "https://www.dominionenergy.com/south-carolina/save-energy/small-business-incentives",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "gapower-ceep", level: "Utility", measures: ["Lighting", "VFD", "Custom measures"], states: ["GA"], utilities: ["gapower"],
      display: "May qualify for Georgia Power efficiency rebates, seasonal bonus periods possible",
      url: "https://www.georgiapower.com/business/save-money-and-energy/commercial-rebates-and-incentives.html",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "pge-rebates", level: "Utility", measures: ["HVAC", "Lighting", "Motors", "Refrigeration"], states: ["CA"], utilities: ["pge"],
      display: "May qualify for PG&E rebates and demand response payments",
      url: "https://www.pge.com/en/save-energy-and-money/rebates-and-incentives/business-energy-efficiency-rebates.html",
      verified: "2026-09-09", confidence: "High"
    },
    {
      id: "sce-ceep", level: "Utility", measures: ["Efficiency", "Electrification"], states: ["CA"], utilities: ["sce"],
      display: "May qualify for SCE efficiency and demand response programs",
      url: "https://www.sce.com/save-money/rebates-financial-assistance/rebates-sce-marketplace",
      verified: "2026-09-09", confidence: "Medium"
    },
    {
      id: "coned-ci-program", level: "Utility", measures: ["HVAC", "Refrigeration", "Building automation", "Electrification"], states: ["NY"], utilities: ["coned"],
      display: "May qualify for ConEd incentives up to 50 percent of project cost",
      url: "https://www.coned.com/-/media/files/coned/documents/save-energy-money/rebates-incentives-tax-credits/rebates-incentives-tax-credits-for-commercial-industrial-buildings-customers/commercial-and-industrial-program/program-manual.pdf",
      verified: "2026-09-09", confidence: "High"
    }
  ];

  // ---------------------------------------------------------------------
  // SOURCES
  // ---------------------------------------------------------------------

  EP.sources = {
    eia561: { label: "EIA Electric Power Monthly, Table 5.6.A, commercial sector", url: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a" },
    cbecs2018: { label: "EIA CBECS 2018", url: "https://www.eia.gov/consumption/commercial/data/2018/" },
    noaaNormals: { label: "NOAA NCEI Climate at a Glance, statewide time series, 1991-2020 normals", url: "https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series/" },
    eia861m: { label: "EIA-861M monthly retail sales", url: "https://www.eia.gov/electricity/data/eia861m/" },
    nrelDemand: { label: "NREL / Clean Energy Group, An Introduction to Demand Charges", url: "https://www.cleanegroup.org/wp-content/uploads/Demand-Charge-Fact-Sheet.pdf" },
    mills2009: { label: "Mills 2009, LBNL, Building Commissioning: A Highly Cost-Effective Building Energy Management Strategy", url: "https://www.osti.gov/servlets/purl/1048261" },
    eaton2010: { label: "Carnovale and Hronek, Eaton Corporation, Power Quality Solutions and Energy Savings, What is Real?, 2010", url: "" },
    fplTariff: { label: "FPL Electric Tariff, Sheet No. 8.032, Power Factor Clause, effective July 1 2023", url: "" },
    gaPowerTariff: { label: "Georgia Power FPA-16 / PLH-13 / PLM-18 / PLL-18 tariff sheets", url: "https://www.georgiapower.com/content/dam/georgia-power/pdfs/business-pdfs/tariffs/2025/plm-18.pdf" },
    ornlOptimizer: { label: "ORNL independent optimizer test results (5 to 10 percent), cited in research/02", url: "" },
    fraunhofer: { label: "Fraunhofer independent optimizer test results (0 to 17 percent across six sites), cited in research/02", url: "" },
    ashrae901: { label: "ASHRAE 90.1, new equipment minimum efficiency class", url: "" },
    doeMotors: { label: "DOE / LBNL, U.S. Industrial and Commercial Motor System Market Assessment, 2021", url: "https://www.energy.gov/cmei/ammto/us-doe-motor-system-market-assessment" },
    doeLighting: { label: "DOE 2020 U.S. Lighting Market Characterization, published April 2024", url: "https://www.energy.gov/sites/default/files/2024-08/ssl-lmc2020_apr24.pdf" },
    strOccupancy: { label: "STR / CoStar hotel occupancy data, via Calculated Risk", url: "https://www.calculatedriskblog.com/2024/10/hotels-occupancy-rate-increased-16-year.html" },
    cbecsHours: { label: "EIA CBECS 2018, Table B1/B2, hours of operation", url: "https://www.eia.gov/consumption/commercial/data/2018/bc/pdf/b1.pdf" },
    puco: { label: "PUCO Apples to Apples, Ohio small commercial price-to-compare charts", url: "https://energychoice.ohio.gov" },
    papuc: { label: "PA PUC PAPowerSwitch, small business shopping site", url: "https://www.papowerswitch.com" }
  };

  EP.facilityOrder = ["datacenter","coldstorage","supermarket","cstore","qsr","healthcare","lab","manufacturing","hotel","education","mixeduse","office","multifamily","retail","fitness","warehouse"]; /* data center first, then refrigeration and HVAC heavy, then the rest by typical bill size */
EP.seasonMonths = {AK:[1.096,1.025,1.025,0.972,0.954,0.926,0.968,0.979,0.962,0.983,1.013,1.096],AL:[0.979,0.865,0.876,0.895,1.0,1.085,1.202,1.215,1.104,0.973,0.894,0.912],AR:[0.957,0.887,0.862,0.854,0.947,1.079,1.212,1.271,1.148,1.009,0.889,0.885],AZ:[0.852,0.798,0.836,0.857,1.005,1.109,1.288,1.3,1.136,1.03,0.898,0.889],CA:[0.98,0.864,0.96,0.861,0.97,1.007,1.12,1.156,1.07,1.099,0.931,0.982],CO:[1.018,0.92,0.996,0.911,0.952,0.993,1.111,1.172,1.029,0.985,0.924,0.99],CT:[0.998,0.932,0.942,0.865,0.97,1.072,1.229,1.074,1.026,0.961,0.93,1.0],DC:[1.032,0.899,0.954,0.891,0.922,1.079,1.197,1.129,1.043,0.91,0.885,1.059],DE:[0.982,0.894,0.961,0.837,0.909,1.206,1.209,1.135,1.032,0.936,0.862,1.037],FL:[0.876,0.827,0.907,0.944,1.057,1.091,1.17,1.182,1.111,1.021,0.921,0.892],GA:[0.963,0.868,0.898,0.906,0.994,1.072,1.197,1.189,1.067,0.985,0.917,0.944],HI:[0.943,0.873,0.966,0.954,1.001,0.991,1.051,1.087,1.062,1.071,1.016,0.986],IA:[1.071,0.958,0.972,0.892,0.932,1.031,1.083,1.099,1.003,1.001,0.935,1.022],ID:[1.071,0.969,0.974,0.908,0.936,0.985,1.125,1.1,0.985,0.962,0.953,1.032],IL:[1.064,0.927,0.98,0.883,0.913,1.027,1.153,1.144,1.013,0.963,0.921,1.011],IN:[0.989,0.9,0.924,0.914,0.93,1.042,1.148,1.173,1.067,0.999,0.934,0.98],KS:[0.999,0.878,0.898,0.88,0.974,1.1,1.193,1.217,1.069,0.961,0.904,0.927],KY:[1.033,0.895,0.92,0.892,0.944,1.079,1.191,1.181,1.029,0.973,0.896,0.966],LA:[0.93,0.863,0.858,0.874,0.968,1.1,1.189,1.225,1.167,1.033,0.908,0.884],MA:[1.048,0.982,0.986,0.929,0.941,0.999,1.125,1.082,1.018,0.979,0.898,1.015],MD:[1.043,0.917,0.94,0.875,0.952,1.067,1.207,1.132,1.011,0.923,0.904,1.029],ME:[1.062,1.056,1.021,0.933,0.923,0.952,1.071,1.075,1.048,0.991,0.913,0.956],MI:[1.026,0.916,0.958,0.903,0.972,1.054,1.173,1.136,1.015,0.974,0.9,0.974],MN:[1.045,0.943,0.985,0.901,0.946,1.026,1.101,1.109,1.011,0.978,0.937,1.018],MO:[1.041,0.91,0.91,0.875,0.954,1.084,1.179,1.162,1.041,0.953,0.91,0.98],MS:[0.913,0.87,0.855,0.859,0.967,1.087,1.21,1.26,1.177,1.029,0.895,0.878],MT:[1.086,1.071,1.027,0.946,0.935,0.938,1.034,1.044,0.978,0.975,0.929,1.036],NC:[0.975,0.874,0.92,0.894,0.986,1.085,1.209,1.178,1.031,0.956,0.948,0.944],ND:[1.021,0.942,1.019,0.96,0.974,0.95,0.999,1.0,0.962,1.009,1.057,1.106],NE:[1.01,0.927,0.93,0.889,0.947,1.021,1.103,1.117,1.05,0.995,0.965,1.047],NH:[1.044,0.985,0.958,0.896,0.918,1.027,1.165,1.086,0.983,0.966,0.953,1.019],NJ:[1.025,0.919,0.99,0.881,0.933,1.036,1.189,1.133,1.022,0.964,0.873,1.035],NM:[0.94,0.867,0.951,0.895,1.003,1.061,1.169,1.25,1.068,0.967,0.905,0.924],NV:[0.908,0.823,0.895,0.91,1.012,1.123,1.229,1.223,1.058,0.995,0.902,0.921],NY:[1.014,0.98,0.961,0.898,0.897,1.0,1.169,1.141,1.046,0.954,0.933,1.006],OH:[0.966,0.892,0.934,0.892,0.976,1.042,1.154,1.132,1.021,1.011,0.953,1.027],OK:[0.925,0.832,0.871,0.872,0.992,1.088,1.221,1.23,1.086,1.008,0.93,0.945],OR:[1.053,0.959,0.99,0.934,0.961,0.969,1.068,1.083,0.992,0.982,0.967,1.041],PA:[1.06,0.948,0.955,0.899,0.934,0.985,1.18,1.128,1.0,0.962,0.914,1.035],RI:[1.12,0.768,0.912,0.879,0.973,1.115,1.329,1.176,1.02,0.914,0.898,0.895],SC:[0.971,0.84,0.899,0.905,1.017,1.069,1.238,1.186,1.046,0.995,0.854,0.981],SD:[1.054,0.991,0.984,0.921,0.919,0.994,1.065,1.117,1.014,0.977,0.94,1.025],TN:[0.962,0.926,0.867,0.905,0.945,1.045,1.171,1.221,1.133,0.994,0.902,0.929],TX:[0.936,0.882,0.905,0.892,0.978,1.051,1.146,1.185,1.117,1.063,0.958,0.886],UT:[0.984,0.918,0.937,0.883,0.951,1.043,1.161,1.144,1.027,1.005,0.953,0.994],VA:[0.944,0.906,0.947,0.905,0.97,1.056,1.13,1.172,1.02,0.996,0.954,1.0],VT:[1.038,0.96,1.002,0.916,0.943,1.008,1.153,1.098,0.99,0.957,0.916,1.02],WA:[1.022,1.012,1.026,0.966,0.948,0.952,1.034,1.039,0.983,0.992,0.959,1.068],WI:[1.03,0.931,0.975,0.902,0.959,1.042,1.129,1.121,1.011,0.975,0.923,1.001],WV:[1.057,0.925,0.987,0.873,0.979,1.034,1.136,1.1,0.971,0.985,0.929,1.025],WY:[1.048,0.97,1.019,0.963,0.927,0.979,0.999,1.022,0.987,0.997,1.02,1.069]}; /* EIA-861M commercial sales index by month, 2023 to 2025 average */
EP.nonlinearHigh = ["datacenter","coldstorage","supermarket","manufacturing","lab","healthcare"]; /* the rest are medium; every commercial building has some */
EP.machineKind = {datacenter:"rack", lab:"rack", coldstorage:"case", supermarket:"case", cstore:"case", qsr:"case", manufacturing:"motor", warehouse:"motor", fitness:"motor"};
window.EP = EP;

})();
