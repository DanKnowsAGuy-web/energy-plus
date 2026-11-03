/* Energy Plus walkthrough. Twelve facility paths on the Overspend engine (engine/).
   Shared spine (facility, role, state, locations, bill, season), then three to four path
   questions, then capture and the reveal. Every answer shows an insight. */
(function () {
  "use strict";
  var EP = window.EP, ENG = window.EPEngine;
  var PHONE_DISPLAY = "864-777-0688", PHONE_E164 = "+18647770688";
  var BOOK_URL = "https://book.slashyourenergycost.com/";
  var LEAD_ENDPOINT = "https://formsubmit.co/ajax/dan@danknowsaguy.org";
  var QUALIFY_MONTHLY = 20000;

  /* ---------- shared path questions ---------- */
  var AGE = {
    id: "age", eyebrow: "Equipment", q: "How old is most of your main equipment?",
    sub: "Rooftop units, chillers, or refrigeration racks. Your best guess is fine.",
    opts: [["3", "Under 5 years"], ["7", "5 to 10 years"], ["12", "10 to 15 years"], ["15", "15+ years"], ["unk", "Not sure"]],
    pick: function (k) { S.age = k === "unk" ? null : parseInt(k, 10); S.ageKey = k; },
    insight: function (k) {
      var age = k === "unk" ? EP.streams.ageDefault : parseInt(k, 10);
      var loss = Math.round(ENG.lossByAge(age) * 100);
      if (k === "unk") return { tag: "Equipment", h: "That's normal. It's one of the first things we check.", p: "At a typical 10 years, coils have lost about " + loss + "% of their performance. The units run longer to make up for it." };
      if (age < 5) return { tag: "Equipment", h: "Newer equipment, so the opportunity is keeping it new.", p: "Even at " + age + " years, coils have lost about " + loss + "% of their performance. Clean power and lighter duty cycles are what add 5 to 15 years of life." };
      return { tag: "Equipment", h: "At " + (age >= 15 ? "15+" : age) + " years, coils typically lose about " + loss + "% of their performance.", p: "So the units run longer to deliver the same comfort. " + (age >= 10 ? "This is also the age where emergency calls and premium parts pricing start stacking up." : "Restoring that is usually the fastest payback on the roof.") };
    }
  };
  var SUMMER = {
    id: "summer", eyebrow: "Pattern", q: "Is your summer electric bill noticeably higher than winter?",
    opts: [["much", "Much higher"], ["little", "A little higher"], ["same", "About the same"], ["unk", "Not sure"]],
    pick: function (k) { S.summer = k; S.loadShape = (k === "much" || k === "little") ? "peaky" : null; },
    insight: function (k) {
      if (k === "much") return { tag: "Pattern", h: "That's the demand-charge signature.", p: "Hot afternoons push everything to peak at the same moment, and that one 15-minute peak sets your demand charge for the whole month." };
      if (k === "little") return { tag: "Pattern", h: "Even a modest summer bump usually means peaks are stacking.", p: "Flattening that overlap lowers the demand line on every bill." };
      if (k === "same") return { tag: "Pattern", h: "A flat bill means the baseline is doing the damage.", p: "When the bill barely moves with the seasons, the savings are in the load that never shuts off." };
      return { tag: "Pattern", h: "Worth a look next time it crosses your desk.", p: "A summer spike is the clearest sign demand charges are driving your bill. We check 12 months of history on a walkthrough." };
    }
  };
  function HOURS(q, opts, insight) {
    return { id: "hours", eyebrow: "Hours", q: q, opts: opts,
      pick: function (k) { S.hours = parseInt(k, 10); }, insight: insight };
  }
  function CASES(word) {
    return { id: "cases", eyebrow: "On your floor", q: "How are your " + word + " mostly set up?",
      opts: [["open", "Mostly open"], ["mix", "A mix of open and doored"], ["door", "Mostly doored"], ["unk", "Not sure"]],
      pick: function (k) { S.cases = k; S.refrigRange = { open: [0.08, 0.12], mix: [0.06, 0.10], unk: [0.06, 0.10], door: [0.05, 0.08] }[k]; },
      insight: function (k) {
        if (k === "door") return { tag: "Case setup", h: "Doors help. The next leak is how hard the compressors cycle.", p: "Doored cases cut the spill, but the racks behind them still run every hour of the year." };
        return { tag: "Case setup", h: "Open cases spill cold air into your aisles. Your HVAC then pays to reheat the space while refrigeration pays to replace the cold.", p: "You're paying twice for the same air." };
      } };
  }
  function info(id, eyebrow, q, opts, insightFn, findingFn) {
    return { id: id, eyebrow: eyebrow, q: q, opts: opts, pick: function (k) { S[id] = k; if (findingFn) { var f = findingFn(k); if (f) S.pf[id] = f; else delete S.pf[id]; } }, insight: insightFn };
  }

  /* ---------- the twelve facility paths ---------- */
  var FAC = {
    grocery: { label: "Supermarket / Grocery", eng: "supermarket", unit: "store", units: "stores",
      sizes: [["Neighborhood", "under 25K sq ft", 20000], ["Standard", "25K to 50K sq ft", 40000], ["Superstore", "50K+ sq ft", 70000]],
      path: function () { return [CASES("refrigerated cases"), AGE, SUMMER, HOURS("How many hours a day are your stores open?", [["168", "24 hours"], ["126", "18 or more"], ["98", "Under 18"]], function (k) {
        return k === "168" ? { tag: "Hours", h: "Every system you run is on the clock every hour of the year.", p: "Round-the-clock stores wear equipment fastest, so every point of efficiency is worth more." } : { tag: "Hours", h: "Your compressors don't know you're closed.", p: "Lights and HVAC may set back overnight, but refrigeration runs all 8,760 hours of the year." }; })]; },
      signature: "Your HVAC and your refrigeration are fighting each other, and you're paying both sides." },
    cold: { label: "Cold Storage / Food Distribution", eng: "coldstorage", unit: "facility", units: "facilities",
      sizes: [["Small", "under 50K sq ft", 25000], ["Mid-size", "50K to 150K sq ft", 75000], ["Large", "150K+ sq ft", 200000]],
      path: function () { return [
        info("stored", "What you store", "What do you mostly store?", [["frozen", "Mostly frozen"], ["chilled", "Mostly chilled or fresh"], ["mix", "A mix"]], function (k) {
          return k === "frozen" ? { tag: "Your load", h: "At frozen sites, refrigeration can be around three quarters of the electric bill.", p: "Small efficiency gains move big dollars." } : { tag: "Your load", h: "Refrigeration is still the biggest line on your bill.", p: "The rest is lighting, docks, and material handling." }; }),
        info("docks", "Docks", "How busy are your dock doors?", [["constant", "Constant traffic"], ["moderate", "Moderate"], ["closed", "Mostly closed"]], function (k) {
          if (k === "constant") { S.refrigRange = [0.08, 0.12]; return { tag: "Docks", h: "Every open door pulls warm, wet air into a space you paid to freeze.", p: "That load shows up as compressor runtime and extra defrost cycles." }; }
          S.refrigRange = k === "moderate" ? [0.06, 0.10] : [0.05, 0.08];
          return { tag: "Docks", h: "Fewer openings, so the leak is inside the system.", p: "Compressor cycling and defrost timing are where the money hides." }; },
          function (k) { return k === "constant" ? ["Dock traffic is loading your compressors", "Warm, wet air at every door shows up as runtime and defrost."] : null; }),
        AGE, SUMMER]; },
      signature: "Your inventory can act like a battery. Most facilities never use it." },
    hotel: { label: "Hotels / Hospitality", eng: "hotel", unit: "property", units: "properties",
      sizes: [["Under 80 rooms", "select service", 40000], ["80 to 200 rooms", "full service", 100000], ["200+ rooms", "large or resort", 250000]],
      path: function () { return [
        info("occ", "Occupancy", "Was the bill you gave from a busy, typical, or slow month?", [["busy", "Busy month"], ["typical", "Typical month"], ["slow", "Slow month"]], function (k) {
          S.occupancy = k; return { tag: "Occupancy", h: "Your HVAC runs whether the rooms are full or not.", p: "Empty rooms still get cooled, and corridors, lobbies, and kitchens run every hour." }; }),
        info("rooms", "Guest rooms", "How are guest rooms mostly cooled?", [["ptac", "Units in each room (PTAC)"], ["central", "Central system"], ["mix", "A mix"]], function (k) {
          return k === "ptac" ? { tag: "Guest rooms", h: "Hundreds of small units, each tuned by nobody.", p: "PTACs age fast and run hard. Small gains per room add up across the property." } : { tag: "Guest rooms", h: "One central plant means one big lever.", p: "Chillers and air handlers are where a single fix moves the whole bill." }; }),
        AGE, SUMMER]; },
      signature: "Your building is paying full price for rooms nobody is in." },
    qsr: { label: "Multi-Unit Restaurants", eng: "qsr", unit: "restaurant", units: "restaurants",
      sizes: [["Small", "under 2,500 sq ft", 2500], ["Standard", "2,500 to 4,500 sq ft", 3500], ["Large", "4,500+ sq ft", 6000]],
      path: function () { return [
        HOURS("How many hours a day is the kitchen running?", [["70", "Under 12"], ["98", "12 to 16"], ["126", "16 or more"]], function () { return { tag: "Hours", h: "Your kitchen heats the building your HVAC is trying to cool.", p: "Fryers, grills, and hoods put the rooftop units under the heaviest load in commercial real estate." }; }),
        info("walkin", "Cold storage", "How many walk-in coolers or freezers per restaurant?", [["1", "One"], ["2", "Two"], ["3", "Three or more"]], function (k) {
          return { tag: "Cold storage", h: "Walk-ins run all 8,760 hours, even after close.", p: "A struggling walk-in is both an energy leak and a food-cost risk." }; }),
        AGE, SUMMER]; },
      signature: "Whatever we find in one kitchen, you have in every location." },
    cstore: { label: "Convenience / Fuel", eng: "cstore", unit: "store", units: "stores",
      sizes: [["Small", "under 3K sq ft", 2500], ["Standard", "3K to 5K sq ft", 4000], ["Travel center", "5K+ sq ft", 6000]],
      path: function () { return [
        CASES("coolers and cases"),
        HOURS("How many hours a day are your stores open?", [["168", "24 hours"], ["126", "18 or more"], ["84", "Under 18"]], function () { return { tag: "Hours", h: "Your coolers are the biggest load in the store.", p: "They run every hour of the year, and so does the canopy lighting." }; }),
        AGE, SUMMER]; },
      signature: "Your coolers never close, so neither does the meter." },
    health: { label: "Senior Living / Healthcare", eng: "healthcare", unit: "facility", units: "facilities",
      sizes: [["Small", "under 40K sq ft", 25000], ["Mid-size", "40K to 100K sq ft", 60000], ["Large", "100K+ sq ft", 150000]],
      path: function () { return [
        info("type", "Your facility", "What best describes it?", [["senior", "Senior living"], ["clinic", "Clinic or medical office"], ["hospital", "Hospital or surgical"]], function (k) {
          return k === "senior" ? { tag: "Your facility", h: "Comfort is care. The HVAC can't take a night off.", p: "That's exactly why efficiency there pays every hour of the year." } : { tag: "Your facility", h: "Ventilation rules set a floor you can't cut below.", p: "So the savings come from running the same air with less power, not from less air." }; }),
        AGE, SUMMER]; },
      signature: "You can't turn the building down, so the savings have to come from how it runs." },
    ind: { label: "Manufacturing / Industrial", eng: "manufacturing", unit: "plant", units: "plants",
      sizes: [["Small", "under 50K sq ft", 30000], ["Mid-size", "50K to 200K sq ft", 100000], ["Large", "200K+ sq ft", 300000]],
      path: function () { return [
        HOURS("How many shifts do you run?", [["40", "One shift"], ["80", "Two shifts"], ["120", "Three shifts or 24/7"]], function () { return { tag: "Shifts", h: "Motors and compressed air are your biggest load.", p: "Every startup of a big motor can set a new demand peak." }; }),
        info("motors", "Process", "How much of your load is large motors, pumps, or compressed air?", [["most", "Most of it"], ["some", "Some"], ["little", "Very little"]], function (k) {
          return k === "little" ? { tag: "Process", h: "Then HVAC and lighting are the levers.", p: "We size those first." } : { tag: "Process", h: "Motor-heavy plants carry the dirtiest power.", p: "Harmonics from drives and motors inflate the bill and shorten motor life." }; },
          function (k) { return k !== "little" ? ["Motor-heavy load", "Drives and big motors create the distortion and startup peaks that inflate the bill."] : null; }),
        AGE, SUMMER]; },
      signature: "Your demand charge is set by the moment your biggest motors start." },
    fit: { label: "Fitness Centers", eng: "fitness", unit: "club", units: "clubs",
      sizes: [["Studio", "under 15K sq ft", 10000], ["Club", "15K to 35K sq ft", 25000], ["Large club", "35K+ sq ft", 45000]],
      path: function () { return [
        HOURS("How many hours a day is the club open?", [["168", "24 hours"], ["100", "16 or more"], ["70", "Under 16"]], function () { return { tag: "Hours", h: "Bodies are heat. Your HVAC fights a full room all day.", p: "Fitness has one of the highest cooling shares of any building type." }; }),
        info("pool", "Amenities", "Any pool, hot tub, or sauna?", [["yes", "Yes"], ["no", "No"]], function (k) {
          return k === "yes" ? { tag: "Amenities", h: "Pools and spas run around the clock.", p: "Pumps and heating are a steady load worth looking at." } : { tag: "Amenities", h: "Then HVAC is the story.", p: "Cooling and ventilation are where nearly all your savings sit." }; }),
        AGE, SUMMER]; },
      signature: "Your members generate the heat. Your HVAC pays to remove it." },
    dc: { label: "Data Centers", eng: "datacenter", unit: "site", units: "sites",
      sizes: [["Edge or small", "under 10K sq ft", 5000], ["Mid-size", "10K to 40K sq ft", 20000], ["Large", "40K+ sq ft", 60000]],
      path: function () { return [
        info("cool", "Cooling", "How is the white space cooled?", [["crac", "CRAC or CRAH units"], ["chiller", "Chilled water plant"], ["unk", "Not sure"]], function () { return { tag: "Cooling", h: "Cooling is the biggest overhead on top of the IT load.", p: "Every point of cooling efficiency drops straight to the bottom line, 8,760 hours a year." }; }),
        AGE, SUMMER]; },
      signature: "Every watt of IT pulls a cooling watt behind it." },
    mf: { label: "Multifamily", eng: "multifamily", unit: "property", units: "properties",
      sizes: [["Under 100 units", "", 60000], ["100 to 300 units", "", 150000], ["300+ units", "", 350000]],
      path: function () { return [
        info("cooling", "Cooling", "How is the building cooled?", [["central", "Central plant"], ["units", "Individual units"], ["mix", "A mix"]], function (k) {
          return k === "central" ? { tag: "Cooling", h: "A central plant is one big lever.", p: "One fix moves the whole common bill." } : { tag: "Cooling", h: "Your common areas still run on your meter.", p: "Corridors, lobbies, and amenities run every hour, on your dime." }; }),
        info("amen", "Amenities", "Which do you carry on the house meter?", [["many", "Pool, gym, and garage"], ["some", "One or two of those"], ["few", "Mostly corridors and lighting"]], function () {
          return { tag: "Amenities", h: "Your common areas are a 24/7 building inside your building.", p: "Every dollar out of the house meter goes straight to NOI." }; }),
        AGE, SUMMER]; },
      signature: "Your common areas are a 24/7 building inside your building." },
    office: { label: "Office / School / General", eng: "office", unit: "building", units: "buildings",
      sizes: [["Small", "under 30K sq ft", 20000], ["Mid-size", "30K to 100K sq ft", 60000], ["Large", "100K+ sq ft", 150000]],
      path: function () { return [
        info("type", "Your building", "What best describes it?", [["office", "Office"], ["school", "School or campus"], ["other", "Government or other"]], function (k) {
          S.engOverride = k === "school" ? "education" : null;
          return k === "school" ? { tag: "Your building", h: "Schools run hardest when the calendar says they're closed.", p: "Summer cooling and weekend runtime are where the waste hides." } : { tag: "Your building", h: "Ventilation is often the biggest HVAC line in an office.", p: "Fans moving air when nobody's breathing it cost real money." }; }),
        info("setback", "Schedules", "Does the HVAC shut down or set back nights and weekends?", [["yes", "Yes, it's scheduled"], ["unk", "Not sure"], ["no", "It runs all the time"]], function (k) {
          S.hours = k === "yes" ? null : 100;
          return k === "yes" ? { tag: "Schedules", h: "Good. The next leak is how hard it runs when it's on.", p: "Equipment that was never matched to the building burns power without adding comfort." } : { tag: "Schedules", h: "You could be paying full price for about two thirds of the week with no one inside.", p: "It's one of the cheapest fixes there is." }; },
          function (k) { return k !== "yes" ? ["Running when nobody's there", "Nights and weekends are about two thirds of the week."] : null; }),
        AGE, SUMMER]; },
      signature: "Your building is working hardest when no one's in it." },
    retail: { label: "Retail Centers / Multi-Tenant", eng: "retail", unit: "center", units: "centers",
      sizes: [["Strip center", "under 30K sq ft", 15000], ["Community center", "30K to 150K sq ft", 60000], ["Regional", "150K+ sq ft", 200000]],
      path: function () { return [
        info("pays", "Who pays", "Who pays for tenant energy?", [["tenants", "Tenants, on their own meters"], ["house", "House meter, we bill back"], ["mix", "A mix"]], function (k) {
          return k === "tenants" ? { tag: "Who pays", h: "Then your bill is the common areas, and it's all yours.", p: "Parking lots, corridors, and vacant suites still send you a bill." } : { tag: "Who pays", h: "Every dollar you can't bill back comes out of NOI.", p: "Efficiency on the house meter is margin, not just savings." }; }),
        info("vacancy", "Vacancy", "Roughly how much is vacant?", [["low", "Under 5%"], ["mid", "5 to 15%"], ["high", "Over 15%"]], function (k) {
          return k === "low" ? { tag: "Vacancy", h: "Full centers still waste on the common load.", p: "Lighting and rooftop units run on your schedule, not your tenants'." } : { tag: "Vacancy", h: "Vacant suites still pull power for HVAC and lighting.", p: "That cost lands on you, not a tenant." }; },
          function (k) { return k !== "low" ? ["Vacant suites on your meter", "Empty spaces still pull HVAC and lighting, and the cost is yours."] : null; }),
        AGE, SUMMER]; },
      signature: "Vacant suites and parking lots still send you a bill. That's NOI leaking out." }
  };
  var FAC_ORDER = ["grocery", "cold", "hotel", "qsr", "cstore", "health", "ind", "fit", "dc", "mf", "office", "retail"];
  var ROLES = [["owner", "Owner / Operator"], ["fm", "Facility Manager"], ["cfo", "CFO / Finance"], ["pm", "Property Manager"], ["multi", "Multi-Site Operator"]];
  var ROLE_INSIGHT = {
    owner: { h: "Most owners treat energy as a fixed cost. It's one of the few large lines you can actually move.", p: "We'll lead with the dollars, then what's driving them." },
    fm: { h: "The units that get the most service calls are usually the ones driving the bill.", p: "We'll lead with equipment, then tie it to cost." },
    cfo: { h: "On demand-billed accounts, 30 to 70% of the bill can be demand charges, set by one peak a month.", p: "That's controllable cost in a line most budgets treat as fixed. We'll lead with the 10-year number." },
    pm: { h: "Every dollar of energy out of operating expense goes straight to NOI.", p: "We'll lead with NOI and the capex you can push out." },
    multi: { h: "Whatever we find in one location, you have in every location.", p: "Small leaks per site become portfolio money. We'll lead with the portfolio total." }
  };
  var STATE_NAMES = {}; Object.keys(EP.states).forEach(function (a) { STATE_NAMES[EP.states[a].name] = a; });

  /* ---------- state ---------- */
  var hist = [], current = null;
  function go(fn) { if (current) { hist.push(current); try { history.pushState({ wt: hist.length }, ""); } catch (e) {} } current = fn; fn(); syncBack(); }
  function back() { if (!hist.length) return; current = hist.pop(); current(); syncBack(); }
  window.addEventListener("popstate", function () { back(); });
  function syncBack() { var b = document.getElementById("back"); if (b) b.hidden = !hist.length; }
  var S, app = document.getElementById("app"), prog = document.getElementById("prog"), countEl = document.getElementById("count");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function reset() { S = { pf: {}, ans: {}, locs: 1 }; hist = []; current = null; }
  reset();

  function $(h) { var d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function kmoney(n) { if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M"; if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K"; return "$" + Math.round(n).toLocaleString("en-US"); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function fac() { return FAC[S.fac]; }
  function engKey() { return S.engOverride || fac().eng; }
  function engFac() { return EP.facilities[engKey()]; }

  var TOTAL = 12;
  function setProgress(i, label) { prog.style.width = Math.min(100, i / TOTAL * 100) + "%"; countEl.textContent = label != null ? label : (i > 0 ? String(i).padStart(2, "0") + " / " + TOTAL : ""); }
  function countUp(el, to, fmt, dur) { if (reduce) { el.textContent = fmt(to); return; } var t0 = performance.now(); dur = dur || 1100; (function st(t) { var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(st); })(t0); }
  function fillBars(root) { requestAnimationFrame(function () { requestAnimationFrame(function () { root.querySelectorAll(".bt i").forEach(function (i) { i.style.width = i.dataset.w + "%"; }); }); }); }
  function show(node) {
    var old = app.firstChild;
    function put() { app.innerHTML = ""; app.appendChild(node); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
    if (old && !reduce) { old.classList.add("leave"); setTimeout(put, 260); } else put();
  }
  function bars(rows) { return '<div class="bars">' + rows.map(function (r, i) { return '<div class="brow' + (i === 0 ? " lead" : "") + '"><span class="lbl">' + r[0] + '</span><span class="bt"><i data-w="' + r[1] + '"></i></span><span class="pv">' + r[1] + '%</span></div>'; }).join("") + "</div>"; }

  function card(res, next, quiet) {
    var c = $('<div class="insight"><h3>' + res.h + "</h3>" + (res.p ? "<p>" + res.p + "</p>" : "") + (res.viz || "") + '<div class="next"><button class="btn">Continue <span class="ar">&rarr;</span></button></div>' + (res.src ? '<div class="src">' + esc(res.src) + "</div>" : "") + '</div>');
    c.querySelector(".btn").addEventListener("click", next);
    setTimeout(function () {
      fillBars(c);
      c.querySelectorAll("[data-count]").forEach(function (el) { var v = parseFloat(el.dataset.count), f = el.dataset.fmt; countUp(el, v, f === "cents" ? function (x) { return x.toFixed(2) + "¢"; } : f === "pct" ? function (x) { return (x >= 0 ? "+" : "") + x.toFixed(1) + "%"; } : kmoney); });
      if (!quiet) c.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }, 120);
    if (!quiet) setTimeout(function () { c.querySelector(".btn").focus({ preventScroll: true }); }, 500);
    return c;
  }

  /* generic question: options, lock, insight, continue */
  function question(cfg) {
    setProgress(cfg.step);
    var html = '<section class="screen"><h1>' + esc(cfg.q) + "</h1>" + (cfg.sub ? '<p class="sub">' + esc(cfg.sub) + "</p>" : "") +
      '<div class="opts' + (cfg.grid ? " grid2" : "") + '">' + cfg.opts.map(function (o) { return '<button class="opt" data-k="' + o[0] + '"><span>' + esc(o[1]) + "</span>" + (o[2] ? '<span class="hint">' + esc(o[2]) + "</span>" : "") + "</button>"; }).join("") + '</div><div class="slot"></div></section>';
    var node = $(html), opts = node.querySelector(".opts"), slot = node.querySelector(".slot");
    function choose(b, quiet) {
      if (!b || b.classList.contains("chosen")) return;
      opts.querySelectorAll(".opt").forEach(function (x) { x.classList.toggle("chosen", x === b); x.classList.toggle("dim", x !== b); });
      var k = b.dataset.k; S.ans[cfg.q] = k; if (cfg.pick) cfg.pick(k);
      var res = cfg.insight(k);
      slot.innerHTML = "";
      if (!quiet && !S.hintShown) S.hintShown = true, opts.insertAdjacentHTML("afterend", '<p class="change-hint">Tap another answer to change it.</p>');
      if (res && res.redirect) {
        if (!quiet) { setTimeout(function () { go(res.redirect); }, 350); return; }
        var nx = $('<div class="next"><button class="btn">Continue <span class="ar">&rarr;</span></button></div>');
        nx.querySelector(".btn").addEventListener("click", function () { go(res.redirect); }); slot.appendChild(nx); return;
      }
      slot.appendChild(card(res, function () { go(cfg.next); }, quiet));
    }
    opts.addEventListener("click", function (e) { choose(e.target.closest(".opt")); });
    show(node);
    var saved = S.ans[cfg.q];
    if (saved != null) setTimeout(function () { choose(opts.querySelector('[data-k="' + saved + '"]'), true); }, reduce ? 0 : 300);
    else if (cfg.preselect) setTimeout(function () { choose(opts.querySelector('[data-k="' + cfg.preselect + '"]')); }, reduce ? 0 : 700);
  }

  /* ---------- screens ---------- */
  function intro() {
    reset();
    var pre = new URLSearchParams(location.search).get("f");
    if (pre && FAC[pre]) S.preFac = pre;
    setProgress(0, "");
    var label = S.preFac ? FAC[S.preFac].label.split(" /")[0] : "your building";
    var n = $('<section class="screen"><div class="panel"><div class="grat"></div><div class="in"><h1>A few taps. About two minutes. A read on ' + esc(label.toLowerCase() === "your building" ? "your building" : "your " + FAC[S.preFac].units) + ' most operators never get.</h1><p class="sub">Tap through the questions a senior energy strategist would ask on a first call. Every answer shows you something about your operation.</p><div class="dial"><div><b class="mono">~10</b>taps</div><div><b class="mono">~2 min</b>to finish</div></div><div style="margin-top:30px"><button class="btn" id="go">Start the diagnostic <span class="ar">&rarr;</span></button></div></div></div></section>');
    n.querySelector("#go").addEventListener("click", function () { go(facility); });
    show(n);
  }

  function facility() {
    question({ step: 1, eyebrow: "Facility", q: "What kind of facility are we looking at?", grid: true,
      opts: FAC_ORDER.map(function (k) { return [k, FAC[k].label]; }), preselect: S.preFac,
      pick: function (k) {
        if (S.fac && S.fac !== k) { S.path.forEach(function (q) { if (q.id !== "age" && q.id !== "summer") delete S.ans[q.q]; }); S.pf = {}; ["cases", "refrigRange", "occupancy", "engOverride", "hours"].forEach(function (x) { delete S[x]; }); }
        S.fac = k; S.path = FAC[k].path(); TOTAL = 6 + S.path.length + 1; },
      insight: function () {
        var f = engFac(), sh = f.hvac.cooling + f.hvac.ventilation + f.hvac.heat;
        var rows = [];
        if (f.refrigShare) rows.push(["Refrigeration", Math.round(f.refrigShare * 100)]);
        rows.push(["Heating & cooling", Math.round(sh * 100)]);
        if (f.motorShare >= 0.3) rows.push(["Motors & process", Math.round(f.motorShare * 100)]);
        rows.push(["Lighting", Math.round(f.lightingShare * 100)]);
        rows.sort(function (a, b) { return b[1] - a[1]; });
        var other = 100 - rows.reduce(function (s, r) { return s + r[1]; }, 0); if (other > 0) rows.push(["Everything else", other]);
        return { tag: "Where your power goes", h: fac().signature, p: "Typical share of the electric bill for this kind of building:", viz: bars(rows), src: "EIA CBECS 2018 end-use splits; Energy Plus estimates where federal data is thin" };
      }, next: role });
  }

  function role() {
    question({ step: 2, eyebrow: "Your seat", q: "What's your role?", opts: ROLES,
      pick: function (k) { S.role = k; },
      insight: function (k) { var r = ROLE_INSIGHT[k]; return { tag: "How we'll read this for you", h: r.h, p: r.p }; }, next: stateQ });
  }

  function stateQ() {
    setProgress(3);
    var names = Object.keys(STATE_NAMES).sort();
    var n = $('<section class="screen"><h1>Where are most of your ' + esc(fac().units) + '?</h1><p class="sub">We pull that state\'s current commercial rate and trend.</p><select class="state" id="stsel" aria-label="State"><option value="">Choose a state</option>' + names.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select><div class="slot"></div></section>');
    var sel = n.querySelector("#stsel"), slot = n.querySelector(".slot");
    sel.addEventListener("change", function () {
      if (!sel.value) return; S.state = STATE_NAMES[sel.value]; S.stateName = sel.value; slot.innerHTML = "";
      var st = EP.states[S.state], nat = EP.national, rate = st.rate, diff = (rate / nat.rate12mo - 1) * 100, chg = EP.rateChange[S.state];
      var rise = riseFor(S.state), name = esc(sel.value);
      var h = diff >= 3 ? "Commercial power in " + name + " already costs about " + Math.round(diff) + "% more than the national average."
        : diff <= -3 ? "Power in " + name + " is cheaper than average. That makes waste easy to ignore, and it still compounds."
        : "Commercial power in " + name + " runs close to the national average.";
      var p = (rise.local ? "And it's climbing: rates here rose " + rise.pct.toFixed(1) + "% in the last 12 months." : "And it's climbing: commercial rates rose " + rise.pct.toFixed(1) + "% nationally in the last year. Yours may vary.") +
        (st.retailChoice === true ? " Your state also lets businesses shop their supply rate, so we'll include that." : "");
      slot.appendChild(card({ h: h, p: p,
        viz: '<div class="fig"><span class="big metered" data-count="' + rate + '" data-fmt="cents">0¢</span><span class="vs">per kWh here vs ' + nat.rate12mo.toFixed(2) + '¢ national</span></div><div class="fig" style="margin-top:8px"><span class="big" style="font-size:30px" data-count="' + rise.pct + '" data-fmt="pct">0%</span><span class="vs">' + (rise.local ? "rate rise here, last 12 months" : "rate rise nationally, last 12 months") + '</span></div>',
        src: "EIA commercial retail prices, 12 months to Aug 2026; national change Aug 2026 vs Aug 2025" }, function () { go(locations); }));
    });
    show(n);
    if (S.stateName) setTimeout(function () { sel.value = S.stateName; sel.dispatchEvent(new Event("change")); }, reduce ? 0 : 300);
    else setTimeout(function () { sel.focus({ preventScroll: true }); }, 600);
  }

  function locations() {
    var F = fac();
    question({ step: 4, eyebrow: "Footprint", q: "How many " + F.units + "?", opts: [["1", "1"], ["3", "2 to 5"], ["12", "6 to 20"], ["35", "21 to 50"], ["75", "50+"]],
      pick: function (k) { S.locs = parseInt(k, 10); S.locLabel = { "1": "1", "3": "2 to 5", "12": "6 to 20", "35": "21 to 50", "75": "50+" }[k]; },
      insight: function () { return { redirect: bill }; },
      next: bill });
  }

  function riseFor(state) {
    var nat = EP.national.augYoY, loc = EP.rateChange[state];
    return (loc != null && loc > nat) ? { pct: loc, local: true } : { pct: nat, local: false };
  }
  function demandShareFor(m) { var base = EP.streams.demand.shareDefault; return Math.min(base, m < 3000 ? 0.15 : m < 10000 ? 0.28 : base); }
  function billInsight() {
    var m = S.monthly, d = demandShareFor(m);
    if (m * S.locs < QUALIFY_MONTHLY) return { redirect: under };
    var dPct = Math.round(d * 100);
    return { h: "About " + dPct + "% of that, roughly " + kmoney(m * d) + " a month, is probably your demand charge.",
      p: "You're billed for the power you use, and again for your busiest 15 minutes of the month, when everything runs at once. That one moment sets this charge for the whole month." + (S.estimated ? " (Your bill is estimated from size.)" : ""),
      viz: bars([["Demand charge", dPct], ["Power used", 100 - dPct]]),
      src: "NREL: demand charges are commonly 30 to 70% of a demand-billed commercial bill. Smaller bills usually carry less." };
  }
  function fmtK(x) { return ENG.fmtK(x).toUpperCase(); }
  function niceRound(x) { var st = x < 10000 ? 500 : x < 100000 ? 1000 : 5000; return Math.max(st, Math.round(x / st) * st); }
  function bill() {
    var F = fac(), edges = engFac().billBands, opts = [];
    for (var i = 0; i < edges.length - 1; i++) opts.push([edges[i] + "-" + edges[i + 1], "$" + fmtK(edges[i]) + " to $" + fmtK(edges[i + 1])]);
    opts.push(["unk", "Not sure, help me estimate"]);
    question({ step: 5, q: "What's a typical monthly electric bill for one " + F.unit + "?", sub: "A rough range is fine. We'll narrow it down next.", opts: opts,
      pick: function (k) { if (k !== "unk") { var p = k.split("-"); S.band = [parseInt(p[0], 10), parseInt(p[1], 10)]; S.estimated = false; S.sqft = null; } },
      insight: function (k) { return k === "unk" ? { redirect: sizeQ } : { redirect: dial }; }, next: season });
  }
  function dial() {
    var lo = S.band[0], hi = S.band[1], e = [];
    for (var i = 0; i <= 4; i++) e.push(niceRound(lo * Math.pow(hi / lo, i / 4)));
    var opts = [];
    for (var j = 0; j < 4; j++) if (e[j + 1] > e[j]) opts.push([String(Math.round(Math.sqrt(e[j] * e[j + 1]))), "$" + fmtK(e[j]) + " to $" + fmtK(e[j + 1])]);
    opts.push([String(Math.round(Math.sqrt(lo * hi))), "Somewhere in that range"]);
    question({ step: 5, q: "Let's dial that in. Which is closest?", sub: "Between $" + fmtK(lo) + " and $" + fmtK(hi) + " a month.", opts: opts,
      pick: function (k) { S.monthly = parseInt(k, 10); },
      insight: billInsight, next: season });
  }
  function sizeQ() {
    var F = fac();
    question({ step: 5, eyebrow: "Your bill", q: "How big is a typical " + F.unit + "?", sub: "We'll estimate the bill from benchmarks and say so.",
      opts: F.sizes.map(function (s, i) { return [String(i), s[0], s[1]]; }),
      pick: function (k) { var s = F.sizes[parseInt(k, 10)]; S.sqft = s[2]; S.monthly = Math.round(s[2] * engFac().eui_kwh_sqft * EP.states[S.state].rate / 100 / 12); S.estimated = true; },
      insight: billInsight, next: season });
  }
  function season() {
    question({ step: 6, eyebrow: "Your bill", q: "Which time of year was that bill from?", opts: [["summer", "Summer"], ["winter", "Winter"], ["mild", "Spring or fall"], ["avg", "Not sure"]],
      pick: function (k) { S.season = k; },
      insight: function (k) { var idx = EP.states[S.state].season[k] || 1, annual = S.monthly / idx * 12; S.annual = annual;
        return { tag: "Your year", h: "That works out to about " + kmoney(annual) + " a year per " + fac().unit + (S.locs > 1 ? ", and " + kmoney(annual * S.locs) + " across all of them." : "."), p: k === "avg" ? "We'll treat it as an average month for your state." : "We adjust for the season using your state's monthly pattern, so one bill can stand in for a year.", viz: '<div class="fig"><span class="big" data-count="' + annual * S.locs + '">$0</span><span class="vs">per year in electricity' + (S.estimated ? ", estimated" : "") + "</span></div>", src: "EIA-861M monthly commercial sales by state" }; },
      next: function () { pathStep(0); } });
  }

  function pathStep(i) {
    if (i >= S.path.length) return capture();
    var q = S.path[i];
    question({ step: 7 + i, eyebrow: q.eyebrow, q: q.q, sub: q.sub, opts: q.opts, pick: q.pick, insight: q.insight, next: function () { pathStep(i + 1); } });
  }

  function under() {
    setProgress(TOTAL, "");
    var n = $('<section class="screen"><h1>Our full program is built for portfolios spending $20K or more a month.</h1><p class="sub">We don\'t want to waste your time with a pitch that doesn\'t fit. Leave your number and we\'ll reach out as we roll out options sized for you.</p><div class="field"><label for="u-name">First name</label><input id="u-name" autocomplete="given-name"></div><div class="field"><label for="u-phone">Mobile</label><input id="u-phone" type="tel" inputmode="tel" autocomplete="tel"></div><div class="err" id="u-err"></div><div class="next" style="justify-content:space-between"><button class="link" id="restart">Start over</button><button class="btn" id="u-go">Keep me posted</button></div></section>');
    n.querySelector("#restart").addEventListener("click", function () { intro(); syncBack(); });
    n.querySelector("#u-go").addEventListener("click", function () {
      var nm = n.querySelector("#u-name").value.trim(), ph = n.querySelector("#u-phone").value.replace(/\D/g, "");
      if (ph.length < 10) { n.querySelector("#u-err").textContent = "Enter a 10-digit mobile number so we can reach you."; return; }
      sendLead({ kind: "under-threshold", name: nm, phone: ph });
      n.querySelector("#u-err").textContent = ""; n.querySelector("#u-go").textContent = "Noted"; n.querySelector("#u-go").disabled = true;
    });
    show(n);
  }

  function capture() {
    setProgress(TOTAL);
    var n = $('<section class="screen"><h1>Where should we text your diagnostic?</h1><p class="sub">No email, no spam. Your report arrives by text, and your strategist is one reply away.</p><div class="field"><label for="c-name">First name</label><input id="c-name" autocomplete="given-name"></div><div class="field"><label for="c-phone">Mobile</label><input id="c-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555"></div><div class="err" id="c-err"></div><div class="next"><button class="btn" id="c-go">Show my diagnostic <span class="ar">&rarr;</span></button></div></section>');
    n.querySelector("#c-go").addEventListener("click", function () {
      var nm = n.querySelector("#c-name").value.trim(), ph = n.querySelector("#c-phone").value.replace(/\D/g, "");
      if (!nm) { n.querySelector("#c-err").textContent = "Add your first name so the report is addressed to you."; return; }
      if (ph.length < 10) { n.querySelector("#c-err").textContent = "Enter a 10-digit mobile number."; return; }
      S.name = nm; S.phone = ph; go(reveal);
    });
    show(n);
    setTimeout(function () { var i = n.querySelector("#c-name"); if (i) i.focus({ preventScroll: true }); }, 600);
  }

  /* ---------- math ---------- */
  function compute() {
    return ENG.compute({ state: S.state, utility: null, facility: engKey(), billMonthly: S.monthly, season: S.season, heat: "unknown",
      hoursWeek: S.hours || null, occupancy: S.occupancy || "typical", locations: S.locs,
      nudges: { age: S.age != null ? S.age : null, sqft: S.sqft != null ? S.sqft : null },
      refrigRange: S.refrigRange || null, loadShape: S.loadShape || null });
  }
  function findings(r) {
    var f = Object.keys(S.pf).map(function (k) { return S.pf[k]; });
    if (S.loadShape === "peaky") f.push(["A summer peak is pricing your whole month", "Everything peaks together on hot afternoons and sets the demand charge."]);
    if (S.cases && S.cases !== "door") f.push(["Your HVAC and refrigeration are fighting each other", "Open cases spill cold into the space and the HVAC pays to reheat it."]);
    if (S.age != null && S.age >= 10) f.push(["Equipment past 10 years old", "Coils have lost about " + Math.round(ENG.lossByAge(S.age) * 100) + "% of their performance, and emergency calls start stacking up."]);
    f.push(["Dirty power on every circuit", "Electronics and drives create distortion that inflates the bill and wears every motor."]);
    if (EP.states[S.state].retailChoice === true) f.push(["Your supply rate is negotiable", "Your state lets businesses shop supply without changing utilities."]);
    return f.slice(0, 3);
  }
  function rng(r) { return kmoney(r[0]) + " to " + kmoney(r[1]); }

  function reveal() {
    setProgress(TOTAL, "");
    var r = compute(), F = fac(), fs = findings(r), multi = S.locs > 1, L = S.locs;
    var lo = r.total[0], hi = r.total[1], typ = r.typical, annualAll = r.annual * L;
    var eq = ENG.R.mul(r.buckets.equipment.range, L), pk = ENG.R.mul(r.buckets.peak.range, L), sp = ENG.R.mul(r.buckets.brokering.range, L);
    var escPct = (r.escRate * 100).toFixed(1);
    var buckets = '<div class="kv"><div><span>Equipment: coils, compressors, refrigeration, power quality</span><b>' + rng(eq) + '</b></div><div><span>Peak: the demand charge</span><b>' + rng(pk) + "</b></div>" + (sp[1] > 0 ? '<div><span>Supply: shopping your rate</span><b>' + rng(sp) + "</b></div>" : "") + "</div>";
    var blocks = {
      where: '<div class="blk"><h2>Where the savings come from</h2>' + buckets + "</div>",
      findings: '<div class="blk"><h2>Top findings for your ' + esc(F.units) + '</h2><ol class="finds">' + fs.map(function (x, i) { return '<li style="animation-delay:' + (i * 120 + 300) + 'ms"><span class="n">' + String(i + 1).padStart(2, "0") + "</span><span><strong>" + esc(x[0]) + "</strong>" + esc(x[1]) + "</span></li>"; }).join("") + "</ol></div>",
      nothing: '<div class="blk"><h2>The cost of waiting</h2><div class="kv"><div><span>Electricity spend, next 10 years</span><b>' + kmoney(annualAll * ENG.escalationFactor(r.escRate, 10)) + "</b></div><div><span>Rate increase we used</span><b>" + escPct + "% / yr</b></div><div><span>Savings left on the table</span><b>" + kmoney(r.typical * ENG.escalationFactor(r.escRate, 10)) + '</b></div></div><p class="sub" style="margin-top:12px">We used a conservative ' + escPct + "% a year for " + esc(S.stateName) + ". " + (riseFor(S.state).local ? "Rates here actually rose " + riseFor(S.state).pct.toFixed(1) + "% in the last 12 months." : "Commercial rates actually rose " + EP.national.augYoY + "% nationally in the last year.") + "</p></div>",
      beyond: '<div class="blk"><h2>Beyond the bill</h2><div class="kv"><div><span>Maintenance cost</span><b>up to 40% lower</b></div><div><span>Added equipment life</span><b>5 to 15 years</b></div>' + (multi ? "<div><span>Per " + esc(F.unit) + ", typical</span><b>" + kmoney(typ / L) + "/yr</b></div>" : "") + '</div><p class="sub" style="margin-top:14px">And it&rsquo;s paid from the savings: projects are structured to be cash flow positive from day one where the numbers support it. We walk through the structure on the call.</p></div>',
    };
    var order = { owner: ["findings", "where", "nothing", "beyond"], fm: ["beyond", "findings", "where", "nothing"], cfo: ["nothing", "where", "findings", "beyond"], pm: ["beyond", "where", "nothing", "findings"], multi: ["where", "findings", "nothing", "beyond"] }[S.role] || ["findings", "where", "nothing", "beyond"];
    var smsBody = "Hi Dan, " + S.name + " here. I just ran the Energy Plus diagnostic: " + F.label + ", " + S.locLabel + " " + (L === 1 ? F.unit : F.units) + " in " + S.stateName + ", about " + kmoney(S.monthly) + "/mo each. It estimated " + kmoney(lo) + " to " + kmoney(hi) + "/yr in savings. Let's talk.";
    var assumptions = [
      S.estimated ? "Your bill was estimated from a typical " + esc(F.unit) + " size and " + esc(F.label.split(" /")[0].toLowerCase()) + " energy benchmarks." : "Your bill uses the middle of the range you picked, adjusted for the season.",
      esc(S.stateName) + " commercial average rate, not your utility's exact tariff.",
      S.age == null ? "Equipment age assumed at 10 years." : "Equipment age as you described it.",
      "Savings use Energy Plus program ranges; your answers set where in the range you land. Typical is the middle of the range, not the top.",
      "This is an estimate. Your building sets your number, verified only by a site pilot."
    ];
    var n = $('<section class="screen readout"><div class="panel"><div class="grat"></div><div class="in"><h2>' + esc(S.name) + ', here&rsquo;s what your ' + esc(multi ? F.units : F.unit) + ' could save each year</h2><div class="range"><span id="lo">$0</span> to <span id="hi">$0</span></div><div class="per">per year &middot; ' + Math.round(r.perSite[0] / r.annual * 100) + " to " + Math.round(r.perSite[1] / r.annual * 100) + '% of your electric spend &middot; typical <span id="typ">$0</span></div><div class="ticks"><div><b id="ten">$0</b><span>10-year savings, typical</span></div><div><b>' + kmoney(annualAll) + "</b><span>annual electric spend" + (S.estimated ? ", est." : "") + "</span></div><div><b>" + escPct + "%</b><span>yearly rate climb used</span></div></div></div></div>" +
      '<div class="blocks">' + order.map(function (k) { return blocks[k]; }).join("") +
      '<div class="blk"><h2>Find out if these numbers hold for your ' + esc(F.units) + '</h2><p class="sub">A 15-minute call turns this estimate into a site-specific number. Text Dan directly.</p><div class="cta" style="margin-top:16px"><a class="btn" id="sms" href="sms:' + PHONE_E164 + "?body=" + encodeURIComponent(smsBody) + '">Text Dan <span class="ar">&rarr;</span></a><div class="num"><span>' + PHONE_DISPLAY + '</span><button class="copy" id="cp">Copy number</button></div><a class="link" href="' + BOOK_URL + '" target="_blank" rel="noopener">Or book a call</a></div></div>' +
      '<div class="blk assume"><h2 style="font-size:22px">How we estimated this</h2><ul>' + assumptions.map(function (a) { return "<li>" + a + "</li>"; }).join("") + '</ul><p style="margin-top:14px"><button class="link" id="again">Run another building</button></p></div></div></section>');
    n.querySelector("#cp").addEventListener("click", function (e) { var b = e.currentTarget; try { navigator.clipboard.writeText(PHONE_DISPLAY).then(function () { b.textContent = "Copied"; }, function () { b.textContent = PHONE_DISPLAY; }); } catch (_) { b.textContent = PHONE_DISPLAY; } });
    n.querySelector("#again").addEventListener("click", function () { intro(); syncBack(); });
    show(n);
    var tenTyp = r.typical * ENG.escalationFactor(r.escRate, 10);
    setTimeout(function () { countUp(document.getElementById("lo"), lo, kmoney, 1600); countUp(document.getElementById("hi"), hi, kmoney, 1900); countUp(document.getElementById("typ"), typ, kmoney, 1900); countUp(document.getElementById("ten"), tenTyp, kmoney, 2200); }, reduce ? 0 : 420);
    sendLead({ kind: S.leadSent ? "diagnostic, updated answers" : "diagnostic", name: S.name, phone: S.phone, role: S.role, facility: F.label, state: S.stateName, locations: S.locLabel,
      monthly_bill_each: S.monthly, bill_estimated: !!S.estimated, season: S.season, age: S.ageKey || "", summer: S.summer || "",
      answers: JSON.stringify(S.answersLog || {}), savings_low: Math.round(lo), savings_high: Math.round(hi), savings_typical: Math.round(typ), ten_year_typical: Math.round(tenTyp) });
  }

  function sendLead(p) {
    if (p.kind && p.kind.indexOf("diagnostic") === 0) S.leadSent = true;
    if (/[?&]nolead=1/.test(location.search)) return;
    p._subject = "Energy Plus diagnostic: " + (p.name || "") + " · " + (p.facility || p.kind);
    p._template = "table"; p._captcha = "false"; p.source = location.href;
    try { fetch(LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(p) }).catch(function () {}); } catch (e) {}
  }

  intro();
})();
