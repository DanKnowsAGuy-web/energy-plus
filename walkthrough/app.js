/* Energy Plus walkthrough. Twelve facility paths on the Overspend engine (engine/).
   Shared spine (facility, role, state, locations, bill, season), then three to four path
   questions, then capture and the reveal. Every answer shows an insight. */
(function () {
  "use strict";
  var EP = window.EP, ENG = window.EPEngine;
  var PHONE_DISPLAY = "864-777-0688", PHONE_E164 = "+18647770688";
  var BOOK_URL = "https://book.slashyourenergycost.com/";
  var LEAD_ENDPOINT = "https://formsubmit.co/ajax/dan@danknowsaguy.org";
  var QUALIFY_MONTHLY = 10000;

  /* ---------- shared path questions ---------- */
  var AGE = {
    id: "age", eyebrow: "Equipment", q: "How old is most of your main equipment?",
    sub: "Your rooftop AC units, chillers, or refrigeration systems. Your best guess is fine.",
    opts: [["3", "Under 5 years"], ["7", "5 to 10 years"], ["12", "10 to 15 years"], ["15", "15+ years"], ["unk", "Not sure"]],
    pick: function (k) { S.age = k === "unk" ? null : parseInt(k, 10); S.ageKey = k; },
    insight: function (k) {
      var age = k === "unk" ? EP.streams.ageDefault : parseInt(k, 10);
      var loss = Math.round(ENG.lossByAge(age) * 100);
      if (k === "unk") return { tag: "Equipment", h: "That's normal. It's one of the first things we check.", p: "At a typical 10 years, your units have lost about " + loss + "% of their cooling power to buildup inside the system. It works like insulation, so heat can't get out, the unit runs longer, and the compressor works harder to cool the same space." };
      if (age < 5) return { tag: "Equipment", h: "Newer equipment, so the opportunity is keeping it new.", p: "Even at " + age + " years, your units have lost about " + loss + "% of their cooling power. Over the years, the compressor slowly leaks oil into the refrigerant, and it coats the inside of the coils, where a normal cleaning can't reach. It works like insulation, so heat can't get out, the unit runs longer, and the compressor works harder to cool the same space. Stopping that early, and keeping the power feeding them clean, is what adds 5 to 15 years of life." };
      return { tag: "Equipment", h: "At " + (age >= 15 ? "15+" : age) + " years, your units have typically lost about " + loss + "% of their cooling power.", p: "Over the years, the compressor slowly leaks oil into the refrigerant, and it coats the inside of the coils, where a normal cleaning can't reach. It works like insulation, so heat can't get out, the unit runs longer, and the compressor works harder to cool the same space. " + (age >= 10 ? "This is also the age where emergency calls and premium parts pricing start stacking up." : "Restoring that is usually the fastest payback on the roof.") };
    }
  };
  var _ageInsight = AGE.insight; AGE.insight = function (k) { var r = _ageInsight(k); r.viz = coilViz(); return r; };
  var SUMMER = {
    id: "summer", eyebrow: "Pattern", q: "Is your summer electric bill noticeably higher than winter?",
    opts: [["much", "Much higher"], ["little", "A little higher"], ["same", "About the same"], ["unk", "Not sure"]],
    pick: function (k) { S.summer = k; S.loadShape = (k === "much" || k === "little") ? "peaky" : null; },
    insight: function (k) {
      if (k === "much") return { tag: "Pattern", h: "That's the sign of a big demand charge.", p: "On hot afternoons everything runs at once. Your busiest 15 minutes of the month sets an extra charge for the whole month, and summer is when that 15 minutes gets expensive." };
      if (k === "little") return { tag: "Pattern", h: "Even a small summer bump usually means your equipment is all running at the same moments.", p: "Spreading that out lowers the busiest-15-minutes charge on every bill." };
      if (k === "same") return { tag: "Pattern", h: "A steady bill means the always-on equipment is doing the damage.", p: "When the bill barely changes with the seasons, the savings are in the equipment that runs around the clock, even when you're closed." };
      return { tag: "Pattern", h: "Worth a look next time it crosses your desk.", p: "A summer spike is the clearest sign that your busiest-15-minutes charge is driving your bill. We look at 12 months of history on a walkthrough." };
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
        if (k === "door") return { tag: "Case setup", h: "Doors help. The next leak is in the machines that keep your cases cold.", p: "Doors stop cold air spilling out, but the refrigeration equipment behind them still runs every hour of the year, and it loses power to the same buildup inside." };
        return { viz: casesViz(), tag: "Case setup", h: "Open cases spill cold air into your aisles. Your HVAC then pays to reheat the space while refrigeration pays to replace the cold.", p: "You're paying twice for the same air." };
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
        return k === "168" ? { tag: "Hours", h: "Every system you run is on the clock every hour of the year.", p: "Round-the-clock stores wear equipment fastest, so every point of efficiency is worth more." } : { tag: "Hours", h: "Your compressors don't know you're closed.", p: "Lights and AC may turn down overnight, but refrigeration runs every hour of the year." }; })]; },
      signature: "Your HVAC and your refrigeration are fighting each other, and you're paying both sides." },
    cold: { label: "Cold Storage / Food Distribution", eng: "coldstorage", unit: "facility", units: "facilities",
      sizes: [["Small", "under 50K sq ft", 25000], ["Mid-size", "50K to 150K sq ft", 75000], ["Large", "150K+ sq ft", 200000]],
      path: function () { return [
        info("stored", "What you store", "What do you mostly store?", [["frozen", "Mostly frozen"], ["chilled", "Mostly chilled or fresh"], ["mix", "A mix"]], function (k) {
          return k === "frozen" ? { tag: "Where your power goes", h: "At frozen sites, refrigeration can be around three quarters of the electric bill.", p: "Small efficiency gains move big dollars." } : { tag: "Where your power goes", h: "Refrigeration is still the biggest line on your bill.", p: "The rest is lighting, docks, and material handling." }; }),
        info("docks", "Docks", "How busy are your dock doors?", [["constant", "Constant traffic"], ["moderate", "Moderate"], ["closed", "Mostly closed"]], function (k) {
          if (k === "constant") { S.refrigRange = [0.08, 0.12]; return { tag: "Docks", h: "Every open door pulls warm, wet air into a space you paid to freeze.", p: "Your refrigeration runs longer to pull that heat back out, and has to defrost more often from the moisture." }; }
          S.refrigRange = k === "moderate" ? [0.06, 0.10] : [0.05, 0.08];
          return { tag: "Docks", h: "Fewer openings, so the leak is inside the system.", p: "How often your refrigeration kicks on, and how it's set to defrost, is where the money hides." }; },
          function (k) { return k === "constant" ? ["Dock traffic is overworking your refrigeration", "Warm, wet air at every door makes it run longer and defrost more."] : null; }),
        AGE, SUMMER]; },
      signature: "Your frozen inventory can hold cold like a battery, so you can run refrigeration when power is cheap. Most facilities never use it." },
    hotel: { label: "Hotels / Hospitality", eng: "hotel", unit: "property", units: "properties",
      sizes: [["Under 80 rooms", "select service", 40000], ["80 to 200 rooms", "full service", 100000], ["200+ rooms", "large or resort", 250000]],
      path: function () { return [
        info("occ", "Occupancy", "Was the bill you gave from a busy, typical, or slow month?", [["busy", "Busy month"], ["typical", "Typical month"], ["slow", "Slow month"]], function (k) {
          S.occupancy = k; return { tag: "Occupancy", h: "Your HVAC runs whether the rooms are full or not.", p: "Empty rooms still get cooled, and corridors, lobbies, and kitchens run every hour." }; }),
        info("rooms", "Guest rooms", "How are guest rooms mostly cooled?", [["ptac", "A unit under each window"], ["central", "Central system"], ["mix", "A mix"]], function (k) {
          return k === "ptac" ? { tag: "Guest rooms", h: "Hundreds of small units, each tuned by nobody.", p: "Those window units age fast and run hard. Small gains per room add up across the property." } : { tag: "Guest rooms", h: "One central plant means one big lever.", p: "Chillers and air handlers are where a single fix moves the whole bill." }; }),
        AGE, SUMMER]; },
      signature: "Your building is paying full price for rooms nobody is in." },
    qsr: { label: "Multi-Unit Restaurants", eng: "qsr", unit: "restaurant", units: "restaurants",
      sizes: [["Small", "under 2,500 sq ft", 2500], ["Standard", "2,500 to 4,500 sq ft", 3500], ["Large", "4,500+ sq ft", 6000]],
      path: function () { return [
        HOURS("How many hours a day is the kitchen running?", [["70", "Under 12"], ["98", "12 to 16"], ["126", "16 or more"]], function () { return { tag: "Hours", h: "Your kitchen heats the building your HVAC is trying to cool.", p: "Fryers, grills, and hoods make your rooftop AC work harder than almost any other kind of building." }; }),
        info("walkin", "Cold storage", "How many walk-in coolers or freezers per restaurant?", [["1", "One"], ["2", "Two"], ["3", "Three or more"]], function (k) {
          return { tag: "Cold storage", h: "Walk-ins run every hour of the year, even after close.", p: "A struggling walk-in is both an energy leak and a food-cost risk." }; }),
        AGE, SUMMER]; },
      signature: "Whatever we find in one kitchen, you have in every location." },
    cstore: { label: "Convenience / Fuel", eng: "cstore", unit: "store", units: "stores",
      sizes: [["Small", "under 3K sq ft", 2500], ["Standard", "3K to 5K sq ft", 4000], ["Travel center", "5K+ sq ft", 6000]],
      path: function () { return [
        CASES("coolers and cases"),
        HOURS("How many hours a day are your stores open?", [["168", "24 hours"], ["126", "18 or more"], ["84", "Under 18"]], function () { return { tag: "Hours", h: "Your coolers use more power than anything else in the store.", p: "They run every hour of the year, and so does the canopy lighting." }; }),
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
        HOURS("How many shifts do you run?", [["40", "One shift"], ["80", "Two shifts"], ["120", "Three shifts or 24/7"]], function () { return { tag: "Shifts", h: "Motors and compressed air use most of your power.", p: "Every time a big motor starts, it can set a new busiest-15-minutes charge for the month." }; }),
        info("motors", "Process", "How much of your power goes to large motors, pumps, or compressed air?", [["most", "Most of it"], ["some", "Some"], ["little", "Very little"]], function (k) {
          return k === "little" ? { tag: "Process", h: "Then HVAC and lighting are the levers.", p: "We size those first." } : { viz: dirtyViz(), tag: "Process", h: "Plants with big motors have the dirtiest power.", p: "Big motors and their speed controls send dirty power back through your wiring. It wastes electricity you pay for and wears out equipment early." }; },
          function (k) { return k !== "little" ? ["Big motors, dirty power", "Your motors send dirty power through your wiring and set expensive startup spikes."] : null; }),
        AGE, SUMMER]; },
      signature: "Your demand charge is set by the moment your biggest motors start." },
    fit: { label: "Fitness Centers", eng: "fitness", unit: "club", units: "clubs",
      sizes: [["Studio", "under 15K sq ft", 10000], ["Club", "15K to 35K sq ft", 25000], ["Large club", "35K+ sq ft", 45000]],
      path: function () { return [
        HOURS("How many hours a day is the club open?", [["168", "24 hours"], ["100", "16 or more"], ["70", "Under 16"]], function () { return { tag: "Hours", h: "Bodies are heat. Your HVAC fights a full room all day.", p: "Fitness has one of the highest cooling shares of any building type." }; }),
        info("pool", "Amenities", "Any pool, hot tub, or sauna?", [["yes", "Yes"], ["no", "No"]], function (k) {
          return k === "yes" ? { tag: "Amenities", h: "Pools and spas run around the clock.", p: "Their pumps and heaters are steady, always-on costs worth looking at." } : { tag: "Amenities", h: "Then HVAC is the story.", p: "Cooling and ventilation are where nearly all your savings sit." }; }),
        AGE, SUMMER]; },
      signature: "Your members generate the heat. Your HVAC pays to remove it." },
    dc: { label: "Data Centers", eng: "datacenter", unit: "site", units: "sites",
      sizes: [["Edge or small", "under 10K sq ft", 5000], ["Mid-size", "10K to 40K sq ft", 20000], ["Large", "40K+ sq ft", 60000]],
      path: function () { return [
        info("cool", "Cooling", "How are your server rooms cooled?", [["crac", "Cooling units in the room"], ["chiller", "A central chilled-water plant"], ["unk", "Not sure"]], function () { return { tag: "Cooling", h: "After the servers themselves, cooling is your biggest cost.", p: "Every bit of cooling efficiency drops straight to the bottom line, every hour of the year." }; }),
        AGE, SUMMER]; },
      signature: "Every bit of heat your servers give off, you pay again to remove." },
    mf: { label: "Multifamily", eng: "multifamily", unit: "property", units: "properties",
      sizes: [["Under 100 units", "", 60000], ["100 to 300 units", "", 150000], ["300+ units", "", 350000]],
      path: function () { return [
        info("cooling", "Cooling", "How is the building cooled?", [["central", "Central plant"], ["units", "Individual units"], ["mix", "A mix"]], function (k) {
          return k === "central" ? { tag: "Cooling", h: "A central plant is one big lever.", p: "One fix moves the whole common bill." } : { tag: "Cooling", h: "Your common areas still run on your meter.", p: "Corridors, lobbies, and amenities run every hour, on your dime." }; }),
        info("amen", "Amenities", "Which of these run on the building's own meter?", [["many", "Pool, gym, and garage"], ["some", "One or two of those"], ["few", "Mostly corridors and lighting"]], function () {
          return { tag: "Amenities", h: "Your common areas are a 24/7 building inside your building.", p: "Every dollar saved on the building's own meter goes straight to your bottom line (NOI)." }; }),
        AGE, SUMMER]; },
      signature: "Your common areas are a 24/7 building inside your building." },
    office: { label: "Office / School / General", eng: "office", unit: "building", units: "buildings",
      sizes: [["Small", "under 30K sq ft", 20000], ["Mid-size", "30K to 100K sq ft", 60000], ["Large", "100K+ sq ft", 150000]],
      path: function () { return [
        info("type", "Your building", "What best describes it?", [["office", "Office"], ["school", "School or campus"], ["other", "Government or other"]], function (k) {
          S.engOverride = k === "school" ? "education" : null;
          return k === "school" ? { tag: "Your building", h: "Schools run hardest when the calendar says they're closed.", p: "Summer cooling and weekend hours are where the waste hides." } : { tag: "Your building", h: "Ventilation is often the biggest HVAC line in an office.", p: "Fans moving air when nobody's breathing it cost real money." }; }),
        info("setback", "Schedules", "Does the AC and heat turn down nights and weekends?", [["yes", "Yes, it's scheduled"], ["unk", "Not sure"], ["no", "It runs all the time"]], function (k) {
          S.hours = k === "yes" ? null : 100;
          return k === "yes" ? { tag: "Schedules", h: "Good. The next leak is how hard it runs when it's on.", p: "Equipment that was never matched to the building burns power without adding comfort." } : { tag: "Schedules", h: "You could be paying full price for about two thirds of the week with no one inside.", p: "It's one of the cheapest fixes there is." }; },
          function (k) { return k !== "yes" ? ["Running when nobody's there", "Nights and weekends are about two thirds of the week."] : null; }),
        AGE, SUMMER]; },
      signature: "Your building is working hardest when no one's in it." },
    retail: { label: "Retail Centers / Multi-Tenant", eng: "retail", unit: "center", units: "centers",
      sizes: [["Strip center", "under 30K sq ft", 15000], ["Community center", "30K to 150K sq ft", 60000], ["Regional", "150K+ sq ft", 200000]],
      path: function () { return [
        info("pays", "Who pays", "Who pays for tenant energy?", [["tenants", "Tenants, on their own meters"], ["house", "House meter, we bill back"], ["mix", "A mix"]], function (k) {
          return k === "tenants" ? { tag: "Who pays", h: "Then your bill is the common areas, and it's all yours.", p: "Parking lots, corridors, and vacant suites still send you a bill." } : { tag: "Who pays", h: "Every dollar you can't bill back comes out of your bottom line (NOI).", p: "Savings on the building's own meter are pure profit." }; }),
        info("vacancy", "Vacancy", "Roughly how much is vacant?", [["low", "Under 5%"], ["mid", "5 to 15%"], ["high", "Over 15%"]], function (k) {
          return k === "low" ? { tag: "Vacancy", h: "Even full centers waste power in the common areas.", p: "Lighting and rooftop units run on your schedule, not your tenants'." } : { tag: "Vacancy", h: "Vacant suites still pull power for HVAC and lighting.", p: "That cost lands on you, not a tenant." }; },
          function (k) { return k !== "low" ? ["Vacant suites on your meter", "Empty spaces still pull HVAC and lighting, and the cost is yours."] : null; }),
        AGE, SUMMER]; },
      signature: "Vacant suites and parking lots still send you a bill. That's NOI leaking out." }
  };
  var FAC_ORDER = ["grocery", "cold", "hotel", "qsr", "cstore", "health", "ind", "fit", "dc", "mf", "office", "retail"];
  var ROLES = [["owner", "Owner / Operator"], ["fm", "Facility Manager"], ["cfo", "CFO / Finance"], ["pm", "Property Manager"], ["multi", "Multi-Site Operator"]];
  var ROLE_INSIGHT = {
    owner: { h: "Most owners treat energy as a fixed cost. It's one of the few large lines you can actually move.", p: "I'll lead your report with the dollars, then what's driving them." },
    fm: { h: "The units that get the most service calls are usually the ones driving the bill.", p: "I'll lead your report with the equipment, then tie it to cost." },
    cfo: { h: "On most business accounts, 30 to 70% of the bill is set by your single busiest 15 minutes of the month.", p: "That's a cost you can control, sitting in a line most budgets treat as fixed. I'll lead your report with the 10-year number." },
    pm: { h: "Every dollar of energy you save goes straight to your bottom line (NOI).", p: "I'll lead your report with that, and the equipment replacements you can push further out." },
    multi: { h: "Whatever we find in one location, you have in every location.", p: "Small leaks at each site add up to real money across all of them. I'll lead your report with the total." }
  };
  var STATE_NAMES = {}; Object.keys(EP.states).forEach(function (a) { STATE_NAMES[EP.states[a].name] = a; });

  /* ---------- state ---------- */
  var hist = [], current = null;
  function go(fn) { if (current) { hist.push(current); try { history.pushState({ wt: hist.length }, ""); } catch (e) {} } current = fn; fn(); syncBack(); }
  function back() { if (!hist.length) return; current = hist.pop(); S._back = true; current(); syncBack(); }
  window.addEventListener("popstate", function () { back(); });
  function syncBack() { var b = document.getElementById("back"); if (b) b.hidden = !hist.length; }
  var S, app = document.getElementById("app"), prog = document.getElementById("prog"), countEl = document.getElementById("count");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---------- Watt runs the conversation ----------
     Watt sits at the top of the stage. Every step is one turn: Watt asks (a speech bubble),
     the person taps a reply, Watt "thinks" for a beat, then answers with what that reply means.
     A "Your building" strip fills in along the bottom as they go. */
  /* one live Watt; each time he speaks he moves to sit beside that message */
  var LOOK = "a";
  document.body.classList.add("look-a");
  var wl = $('<div class="wattline" aria-hidden="true"><span class="watt-live"></span><span class="wname"><b>Watt</b><span class="wstat"></span></span></div>');
  var seat = wl.querySelector(".watt-live");
  if (window.Watt) Watt.mount(seat, 64);
  /* when his message scrolls out of view, a small Watt shows in the header so he never leaves */
  var mini = document.getElementById("mini");
  if (mini && window.Watt) Watt.mount(mini, 36);
  if (mini && "IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { mini.classList.toggle("on", !e.isIntersecting && wl.isConnected); }); }, { rootMargin: "-70px 0px 0px 0px" }).observe(wl);
  /* Watt's live status under his name, like a chat header */
  var STATUS = { hello: "Hi there", listen: "Listening", work: "Thinking\u2026", found: "Found something", verify: "Verified by engineers" };
  var statusEl = wl.querySelector(".wstat");
  function setStatus(t) { statusEl.textContent = t; }
  function stage(s) { if (window.Watt) Watt.set(s); setStatus(STATUS[s] || ""); }

  /* the dock: one solid footer for the next action and "Your building" */
  var actEl = document.getElementById("act"), dockEl = document.getElementById("dock"), topEl = document.getElementById("top");
  function syncDock() {
    if (!dockEl) return;
    var empty = actEl.hidden;
    if (empty) dockEl.setAttribute("data-empty", ""); else dockEl.removeAttribute("data-empty");
    var h = empty ? 0 : dockEl.offsetHeight;
    document.body.style.paddingBottom = (h + 28) + "px";
    document.documentElement.style.scrollPaddingBottom = (h + 12) + "px";
    document.documentElement.style.scrollPaddingTop = ((topEl ? topEl.offsetHeight : 0) + 8) + "px";
    document.documentElement.style.setProperty("--toph", (topEl ? topEl.offsetHeight : 0) + "px");
  }
  function setAction(label, fn, opt) {
    opt = opt || {};
    var tag = opt.href ? '<a class="btn" href="' + opt.href + '">' : '<button class="btn" type="button"' + (opt.disabled ? " disabled" : "") + ">";
    actEl.innerHTML = (opt.left || "") + tag + label + ' <span class="ar">&rarr;</span>' + (opt.href ? "</a>" : "</button>");
    var b = actEl.querySelector(".btn"); if (fn) b.addEventListener("click", fn);
    actEl.hidden = false; syncDock(); return b;
  }
  function clearAction() { actEl.innerHTML = ""; actEl.hidden = true; syncDock(); }
  /* forms keep their own button for logic; the dock button presses it */
  function dockProxy(node, sel, label) {
    var inline = node.querySelector(sel); if (!inline) return;
    setAction(label, function () { inline.click(); if (inline.disabled) setAction(inline.textContent, null, { disabled: true }); });
  }
  window.addEventListener("resize", syncDock);
  function talk() { if (reduce) return; seat.classList.remove("talk"); void seat.offsetWidth; seat.classList.add("talk"); }
  function wattIn(node, sel, size, opt) { var h = node.querySelector(sel); if (h && window.Watt) Watt.mount(h, size, opt); }
  function reset() { S = { pf: {}, ans: {}, chip: {}, order: [], locs: 1 }; hist = []; current = null; renderProfile(); }

  /* the "Your building" strip */
  function setChip(q, text) { if (S.order.indexOf(q) < 0) S.order.push(q); S.chip[q] = text; renderProfile(); }
  function renderProfile() {
    var bar = document.getElementById("profile"), box = document.getElementById("chips");
    if (!bar || !box || !S) return;
    var items = S.order.filter(function (q) { return S.ans[q] != null && S.chip[q]; });
    bar.hidden = !items.length;
    document.body.classList.toggle("has-profile", !!items.length);
    box.innerHTML = items.map(function (q, i) { return '<span class="chip' + (i === items.length - 1 ? " new" : "") + '">' + esc(S.chip[q]) + "</span>"; }).join("");
    box.scrollLeft = box.scrollWidth;
    syncDock();
  }
  reset();

  function $(h) { var d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function kmoney(n) { if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M"; if (n >= 1e3) return "$" + Math.round(n / 1e3) + "K"; return "$" + Math.round(n).toLocaleString("en-US"); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function fac() { return FAC[S.fac]; }
  function engKey() { return S.engOverride || fac().eng; }
  function engFac() { return EP.facilities[engKey()]; }

  var TOTAL = 13;
  function setProgress(i, label) { prog.style.width = Math.min(100, i / TOTAL * 100) + "%"; countEl.textContent = label != null ? label : (i > 0 ? i + " of " + TOTAL : ""); }
  function countUp(el, to, fmt, dur) { if (reduce) { el.textContent = fmt(to); return; } var t0 = performance.now(); dur = dur || 1100; (function st(t) { var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(st); })(t0); }
  function fillBars(root) { requestAnimationFrame(function () { requestAnimationFrame(function () { root.querySelectorAll(".bt i").forEach(function (i) { i.style.width = i.dataset.w + "%"; }); }); }); }
  /* give each turn a gutter for Watt, so he sits beside what he's saying */
  function seatIn(node) {
    var a = node.querySelector(".bubble.ask, .bubble.say");
    if (!a) return;
    a.parentNode.insertBefore(wl, a);
  }
  /* the conversation builds up: earlier turns stay above, quieter; Back takes the last turn off */
  function show(node, fresh) {
    clearAction();
    if (fresh) app.innerHTML = "";
    else if (S._back) { if (app.lastElementChild) app.removeChild(app.lastElementChild); if (app.lastElementChild) app.removeChild(app.lastElementChild); }
    else if (app.lastElementChild) app.lastElementChild.classList.add("past");
    S._back = false;
    seatIn(node);
    app.appendChild(node); talk();
    var y = fresh ? 0 : node.getBoundingClientRect().top + window.scrollY - (topEl ? topEl.offsetHeight : 0) - 6;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce || fresh ? "auto" : "smooth" });
  }
  function bars(rows) { return '<div class="bars">' + rows.map(function (r, i) { return '<div class="brow' + (i === 0 ? " lead" : "") + '"><span class="lbl">' + r[0] + '</span><span class="bt"><i data-w="' + r[1] + '"></i></span><span class="pv">' + r[1] + '%</span></div>'; }).join("") + "</div>"; }

  /* Watt's question bubble */
  function ask(q, sub, eyebrow) {
    return '<div class="bubble ask">' + (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + "</p>" : "") + "<h1>" + q + "</h1>" + (sub ? '<p class="sub">' + sub + "</p>" : "") + "</div>";
  }

  /* Watt's answer: what the reply means, with anything worth showing inside it */
  function card(res, next, quiet) {
    var c = $('<div class="bubble say">' + (res.tag ? '<p class="eyebrow">' + esc(res.tag) + "</p>" : "") + "<h3>" + res.h + "</h3>" + (res.p ? "<p>" + res.p + "</p>" : "") + (res.viz ? '<div class="shown">' + res.viz + "</div>" : "") + (res.src ? '<div class="src">' + esc(res.src) + "</div>" : "") + "</div>");
    var nb = setAction("Next", next);
    wireReplay(c);
    setTimeout(function () {
      fillBars(c);
      c.querySelectorAll("[data-count]").forEach(function (el) { var v = parseFloat(el.dataset.count), f = el.dataset.fmt; countUp(el, v, f === "cents" ? function (x) { return x.toFixed(2) + "¢"; } : f === "pct" ? function (x) { return (x >= 0 ? "+" : "") + x.toFixed(1) + "%"; } : kmoney); });
      if (!quiet) c.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }, 120);
    if (!quiet) setTimeout(function () { nb.focus({ preventScroll: true }); }, 500);
    return c;
  }

  /* a beat of "thinking" before Watt answers; found = Watt lights up as the spark */
  function respond(slot, res, next, quiet, found) {
    slot.innerHTML = "";
    if (quiet || reduce) { stage(found ? "found" : "listen"); slot.appendChild(card(res, next, true)); return; }
    var typing = $('<div class="bubble say typing" aria-label="Watt is thinking"><i></i><i></i><i></i></div>');
    slot.appendChild(typing); clearAction(); setStatus(STATUS.work);
    typing.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (window.Watt) Watt.blink();
    setTimeout(function () {
      if (!typing.isConnected) return;
      slot.innerHTML = "";
      stage(found ? "found" : "listen"); talk();
      slot.appendChild(card(res, next, false));
    }, 750);
  }

  /* generic question: Watt asks, the person replies, Watt answers */
  function question(cfg) {
    setProgress(cfg.step);
    stage("listen");
    var html = '<section class="screen turn">' + ask(esc(cfg.q), cfg.sub ? esc(cfg.sub) : "", cfg.eyebrow) +
      '<div class="opts' + (cfg.grid ? " grid2" : "") + '">' + cfg.opts.map(function (o) { return '<button class="opt" data-k="' + o[0] + '"><span>' + esc(o[1]) + "</span>" + (o[2] ? '<span class="hint">' + esc(o[2]) + "</span>" : "") + "</button>"; }).join("") + '</div><button class="link change" type="button" hidden>Change my answer</button><div class="slot"></div></section>';
    var node = $(html), opts = node.querySelector(".opts"), slot = node.querySelector(".slot"), change = node.querySelector(".change");
    change.addEventListener("click", function () { opts.classList.remove("answered"); change.hidden = true; slot.innerHTML = ""; clearAction(); stage("listen"); });
    function choose(b, quiet) {
      if (!b) return;
      opts.querySelectorAll(".opt").forEach(function (x) { x.classList.toggle("chosen", x === b); });
      opts.classList.add("answered"); change.hidden = false;
      var k = b.dataset.k; S.ans[cfg.q] = k; if (cfg.pick) cfg.pick(k);
      var label = b.querySelector("span").textContent;
      setChip(cfg.q, cfg.chip ? cfg.chip(k, label) : (cfg.eyebrow ? cfg.eyebrow + ": " : "") + label);
      var res = cfg.insight(k);
      if (res && res.redirect) {
        slot.innerHTML = "";
        if (!quiet) { setTimeout(function () { go(res.redirect); }, 450); return; }
        setAction("Next", function () { go(res.redirect); }); return;
      }
      respond(slot, res, function () { go(cfg.next); }, quiet, res.found || (cfg.id && S.pf[cfg.id]));
    }
    opts.addEventListener("click", function (e) { var b = e.target.closest(".opt"); if (b && !opts.classList.contains("answered")) choose(b); });
    show(node);
    var saved = S.ans[cfg.q];
    if (saved != null) setTimeout(function () { choose(opts.querySelector('[data-k="' + saved + '"]'), true); }, reduce ? 0 : 280);
    else if (cfg.preselect) setTimeout(function () { choose(opts.querySelector('[data-k="' + cfg.preselect + '"]')); }, reduce ? 0 : 900);
  }

  /* ---------- screens ---------- */
  function intro() {
    reset();
    var pre = new URLSearchParams(location.search).get("f");
    if (pre && FAC[pre]) S.preFac = pre;
    setProgress(0, "");
    stage("hello");
    var what = S.preFac ? "your " + FAC[S.preFac].units : "your building";
    var n = $('<section class="screen turn">' + ask("Hi, I&rsquo;m Watt, your Energy+ AI.",
      "I&rsquo;ll ask you about ten quick questions, the same ones a senior energy strategist asks on a first call. Every answer, I&rsquo;ll show you something about " + esc(what) + ". About two minutes.") + "</section>");
    show(n, true);
    setAction("Let&rsquo;s start", function () { go(why); });
  }

  /* opens like a discovery call: what brought them here, reflected back */
  var WHY = [["rising", "My bills keep going up"], ["budget", "We need to cut costs"], ["equip", "Equipment keeps breaking down"], ["referred", "Someone told me to look"], ["curious", "Just curious"]];
  var WHY_SAY = {
    rising: { h: "Then I&rsquo;ll look hardest at what&rsquo;s driving the increases.", p: "Commercial power rose " + EP.national.augYoY + "% nationally last year. Part of that is the utility raising rates, and part is your building using more than it should. I&rsquo;ll separate the two." },
    budget: { h: "Then I&rsquo;ll focus on savings that pay for themselves.", p: "Most of what I&rsquo;ll show you can be paid for out of the savings, so it doesn&rsquo;t need a new line in your budget." },
    equip: { h: "Then we&rsquo;re probably looking at the same problem twice.", p: "The equipment that breaks down most is usually also the equipment wasting the most power. I&rsquo;ll point you to where the two overlap." },
    referred: { h: "Glad they did. I&rsquo;ll show you what they probably saw.", p: "Most buildings overspend in the same few places. Let&rsquo;s find yours." },
    curious: { h: "Fair enough. I&rsquo;ll make it worth your two minutes.", p: "With every answer, I&rsquo;ll show you something most operators never see on their bill." }
  };
  var WHY_OPEN = { rising: "You said your bills keep going up. Here&rsquo;s what&rsquo;s driving it.", budget: "You said you need to cut costs. Here&rsquo;s where the money is.", equip: "You said equipment keeps breaking down. Here&rsquo;s where it&rsquo;s also costing you power.", referred: "Here&rsquo;s what I found.", curious: "Here&rsquo;s what I found." };
  function why() {
    question({ step: 1, eyebrow: "Getting started", q: "What brought you here today?", opts: WHY,
      chip: function (k, l) { return "Why: " + l; },
      pick: function (k) { S.why = k; },
      insight: function (k) { var w = WHY_SAY[k]; return { tag: "Got it", h: w.h, p: w.p }; }, next: facility });
  }

  function facility() {
    question({ step: 2, eyebrow: "Facility", q: "What kind of facility are we looking at?", grid: true,
      opts: FAC_ORDER.map(function (k) { return [k, FAC[k].label]; }), preselect: S.preFac, chip: function (k) { return FAC[k].label.split(" /")[0]; },
      pick: function (k) {
        if (S.fac && S.fac !== k) { S.path.forEach(function (q) { if (q.id !== "age" && q.id !== "summer") delete S.ans[q.q]; }); S.pf = {}; ["cases", "refrigRange", "occupancy", "engOverride", "hours"].forEach(function (x) { delete S[x]; }); }
        S.fac = k; S.path = FAC[k].path(); TOTAL = 9 + S.path.length; },
      insight: function () {
        var f = engFac(), sh = f.hvac.cooling + f.hvac.ventilation + f.hvac.heat;
        var rows = [];
        if (f.refrigShare) rows.push(["Refrigeration", Math.round(f.refrigShare * 100)]);
        rows.push(["Heating & cooling", Math.round(sh * 100)]);
        if (f.motorShare >= 0.3) rows.push(["Motors & process", Math.round(f.motorShare * 100)]);
        rows.push(["Lighting", Math.round(f.lightingShare * 100)]);
        rows.sort(function (a, b) { return b[1] - a[1]; });
        var other = 100 - rows.reduce(function (s, r) { return s + r[1]; }, 0); if (other > 0) rows.push(["Everything else", other]);
        return { tag: "Where your power goes", h: fac().signature, p: "Typical share of the electric bill for this kind of building:", viz: bars(rows), src: "Source: U.S. Energy Department building survey (EIA CBECS 2018); Energy Plus estimates where federal data is thin" };
      }, next: locations });
  }

  function role() {
    question({ step: 9 + S.path.length, eyebrow: "Your report", q: "Last question: who's going to read your report?", sub: "I'll put what matters most to them first.", opts: ROLES, chip: function (k, l) { return "Report for: " + l; },
      pick: function (k) { S.role = k; },
      insight: function (k) { var r = ROLE_INSIGHT[k]; return { tag: "Your report", h: r.h, p: r.p }; }, next: capture });
  }

  /* ---------- where: one state, a region, a handful of states, or nationwide ---------- */
  var REGIONS = [
    ["Northeast", ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"]],
    ["Mid-Atlantic", ["DE", "DC", "MD", "VA", "WV"]],
    ["Southeast", ["AL", "FL", "GA", "KY", "MS", "NC", "SC", "TN"]],
    ["Midwest", ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"]],
    ["South Central", ["AR", "LA", "OK", "TX"]],
    ["Mountain & Southwest", ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY"]],
    ["West Coast", ["AK", "CA", "HI", "OR", "WA"]]
  ];
  var ALL_STATES = Object.keys(EP.states);
  var LOWER48 = ALL_STATES.filter(function (c) { return c !== "AK" && c !== "HI"; }); /* nationwide = the lower 48 plus DC, so Hawaii's rates don't skew it */
  function nationwide() { return S.spread === "nation"; }
  function multiState() { return !!(S.states && S.states.length > 1); }
  function regionOf(codes) { var set = codes.slice().sort().join(); for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i][1].slice().sort().join() === set) return REGIONS[i][0]; return null; }
  function placeName() {
    var c = S.states || [];
    if (c.length <= 1) return S.state ? EP.states[S.state].name : "your state";
    if (nationwide()) return "the U.S.";
    var reg = regionOf(c); if (reg) return "the " + reg;
    if (c.length <= 3) { var n = c.map(function (x) { return EP.states[x].name; }); return n.length === 2 ? n.join(" and ") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1]; }
    return c.length + " states";
  }
  function placePoss() { return multiState() ? (nationwide() ? "U.S." : "your states&rsquo;") : esc(placeName()) + "&rsquo;s"; }
  function placeChip() {
    if (nationwide()) return "Nationwide";
    var c = S.states, full = REGIONS.filter(function (r) { return r[1].every(function (x) { return c.indexOf(x) >= 0; }); });
    var inFull = {}; full.forEach(function (r) { r[1].forEach(function (x) { inFull[x] = true; }); });
    var rest = c.filter(function (x) { return !inFull[x]; }).map(function (x) { return EP.states[x].name; }).sort();
    var parts = full.map(function (r) { return r[0]; });
    if (parts.length + rest.length <= 3) return parts.concat(rest).join(", ");
    var shown = parts.concat(rest).slice(0, 2); return shown.join(", ") + " +" + (parts.length + rest.length - 2);
  }
  function anyChoice() { return (S.states || [S.state]).some(function (c) { return EP.states[c].retailChoice === true; }); }
  /* the state with the middle rate anchors the per-question insights; the readout averages them all */
  function setStates(codes) {
    codes = codes.slice().sort(function (a, b) { return EP.states[a].rate - EP.states[b].rate; });
    S.states = codes; S.state = codes[Math.floor((codes.length - 1) / 2)];
    S.stateName = placeName();
  }
  function ratesInsight() {
    var st = EP.states[S.state], nat = EP.national, rise = riseFor(S.state);
    if (!multiState()) {
      var rate = st.rate, diff = (rate / nat.rate12mo - 1) * 100, name = esc(st.name);
      var h = diff >= 3 ? "Commercial power in " + name + " already costs about " + Math.round(diff) + "% more than the national average."
        : diff <= -3 ? "Power in " + name + " is cheaper than average. That makes waste easy to ignore, and it still compounds."
        : "Commercial power in " + name + " runs close to the national average.";
      var p = (rise.local ? "And it's climbing: rates here rose " + rise.pct.toFixed(1) + "% in the last 12 months." : "And it's climbing: commercial rates rose " + rise.pct.toFixed(1) + "% nationally in the last year. Yours may vary.") +
        (st.retailChoice === true ? " Your state also lets businesses choose who sells them power, like switching phone carriers. Most never shop it, so I'll include that." : "");
      return { tag: "Your rates", h: h, p: p,
        viz: '<div class="fig"><span class="big metered" data-count="' + rate + '" data-fmt="cents">0¢</span><span class="vs">what you pay per unit of power here, vs ' + nat.rate12mo.toFixed(2) + '¢ nationally</span></div><div class="fig" style="margin-top:8px"><span class="big" style="font-size:30px" data-count="' + rise.pct + '" data-fmt="pct">0%</span><span class="vs">' + (rise.local ? "rate rise here, last 12 months" : "rate rise nationally, last 12 months") + '</span></div>',
        src: "EIA commercial retail prices, 12 months to Aug 2026; national change Aug 2026 vs Aug 2025" };
    }
    var c = S.states, lo = EP.states[c[0]], hi = EP.states[c[c.length - 1]];
    var avg = c.reduce(function (t, x) { return t + EP.states[x].rate; }, 0) / c.length;
    var choice = c.filter(function (x) { return EP.states[x].retailChoice === true; }).length;
    if (nationwide()) return { tag: "Your rates", h: "Across the country, commercial power runs from " + lo.rate.toFixed(1) + "¢ in " + esc(lo.name) + " to " + hi.rate.toFixed(1) + "¢ in " + esc(hi.name) + ".",
      p: "With " + esc(fac().units) + " everywhere, the fixes that pay back first are in your highest-rate states. And rates are climbing: commercial power rose " + EP.national.augYoY + "% nationally in the last year.",
      viz: '<div class="fig"><span class="big metered" data-count="' + EP.national.rate12mo + '" data-fmt="cents">0¢</span><span class="vs">per kWh, national commercial average</span></div>',
      src: "EIA commercial retail prices, 12 months to Aug 2026; we use the lower 48 states and DC, each weighted equally" };
    return { tag: "Your rates", h: "Your " + esc(fac().units) + " pay anywhere from " + lo.rate.toFixed(1) + "¢ in " + esc(lo.name) + " to " + hi.rate.toFixed(1) + "¢ in " + esc(hi.name) + ".",
      p: "The same fix pays back fastest where power costs the most, so that's usually where we start. And rates are climbing: commercial power rose " + EP.national.augYoY + "% nationally in the last year." +
        (choice ? " " + (choice === c.length ? "All" : choice + " of") + " your states let businesses choose who sells them power. Most never shop it, so I'll include that." : ""),
      viz: '<div class="fig"><span class="big metered" data-count="' + avg + '" data-fmt="cents">0¢</span><span class="vs">per kWh, average of your ' + c.length + " states vs " + EP.national.rate12mo.toFixed(2) + "¢ national</span></div>",
      src: "EIA commercial retail prices, 12 months to Aug 2026; each state weighted equally" };
  }

  function stateQ() {
    if (S.locs === 1) return singleState();
    var F = fac();
    question({ step: 4, eyebrow: "Location", q: "Where are your " + F.units + "?",
      opts: [["one", "All in one state"], ["multi", "In more than one state"], ["nation", "Nationwide"]],
      chip: function () { return ""; },
      pick: function (k) { S.spread = k; if (k === "nation") { setStates(LOWER48); S.ans.__state = "nation"; setChip("__state", "Nationwide"); } },
      insight: function (k) { return k === "one" ? { redirect: singleState } : k === "multi" ? { redirect: pickStates } : ratesInsight(); },
      next: statusQ });
  }

  function singleState() {
    setProgress(4);
    stage("listen");
    var names = Object.keys(STATE_NAMES).sort(), quietNext = false;
    var n = $('<section class="screen turn">' + ask(S.locs > 1 ? "Which state are they in?" : "Which state is it in?", "", "Location") + '<select class="state" id="stsel" aria-label="State"><option value="">Choose a state</option>' + names.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select><div class="slot"></div></section>');
    var sel = n.querySelector("#stsel"), slot = n.querySelector(".slot");
    sel.addEventListener("change", function () {
      var quiet = quietNext; quietNext = false;
      if (!sel.value) return;
      if (S.locs === 1) S.spread = "one"; setStates([STATE_NAMES[sel.value]]); S.ans.__state = sel.value; setChip("__state", sel.value);
      var rp = n.querySelector(".replypill"); if (!rp) { rp = $('<div class="replypill"></div>'); sel.insertAdjacentElement("afterend", rp); } rp.textContent = sel.value;
      respond(slot, ratesInsight(), function () { go(statusQ); }, quiet, false);
    });
    show(n);
    if (S.states && S.states.length === 1) setTimeout(function () { quietNext = true; sel.value = EP.states[S.states[0]].name; sel.dispatchEvent(new Event("change")); }, reduce ? 0 : 280);
    else setTimeout(function () { sel.focus({ preventScroll: true }); }, 600);
  }

  /* a handful of states or a region: tap a region to take all of it, tap a state to add or remove it */
  function pickStates() {
    setProgress(4);
    stage("listen");
    var F = fac(), chosen = {};
    if (multiState() && S.states.length < ALL_STATES.length) S.states.forEach(function (c) { chosen[c] = true; });
    var html = '<section class="screen turn">' + ask("Which states are your " + esc(F.units) + " in?", "Tap a region to select all of it, then tap any state to add or remove it.", "Location") + '<div class="regions">' +
      REGIONS.map(function (r, i) {
        return '<div class="region"><button class="reg-h" type="button" data-r="' + i + '"><span>' + esc(r[0]) + '</span><span class="reg-all">Select all</span></button><div class="reg-states">' +
          r[1].map(function (c) { return '<button class="st" type="button" data-c="' + c + '">' + esc(EP.states[c].name) + "</button>"; }).join("") + "</div></div>";
      }).join("") + '</div><div class="next done-row"><span class="picked mono" id="picked"></span><button class="btn" id="st-go" disabled>Done <span class="ar">&rarr;</span></button></div><button class="link change" type="button" hidden>Change my answer</button><div class="slot"></div></section>';
    var node = $(html), box = node.querySelector(".regions"), goB = node.querySelector("#st-go"), row = node.querySelector(".done-row"), slot = node.querySelector(".slot"), change = node.querySelector(".change"), cnt = node.querySelector("#picked");
    function list() { return Object.keys(chosen).filter(function (c) { return chosen[c]; }); }
    function paint() {
      box.querySelectorAll(".st").forEach(function (b) { b.classList.toggle("on", !!chosen[b.dataset.c]); });
      box.querySelectorAll(".reg-h").forEach(function (h) { var r = REGIONS[h.dataset.r][1], all = r.every(function (c) { return chosen[c]; }); h.classList.toggle("on", all); h.querySelector(".reg-all").textContent = all ? "Clear" : "Select all"; });
      var n = list().length; cnt.textContent = n ? n + (n === 1 ? " state" : " states") : ""; goB.disabled = n < 2;
      if (!box.classList.contains("answered")) setAction("Done", function () { finish(list(), false); }, { disabled: n < 2, left: '<span class="picked">' + (n ? n + (n === 1 ? " state" : " states") : "Tap a region or states") + "</span>" });
    }
    box.addEventListener("click", function (e) {
      if (box.classList.contains("answered")) return;
      var h = e.target.closest(".reg-h"), b = e.target.closest(".st");
      if (h) { var r = REGIONS[h.dataset.r][1], all = r.every(function (c) { return chosen[c]; }); r.forEach(function (c) { chosen[c] = !all; }); }
      else if (b) chosen[b.dataset.c] = !chosen[b.dataset.c];
      paint();
    });
    function finish(codes, quiet) {
      setStates(codes); S.ans.__state = codes.join(","); setChip("__state", placeChip());
      box.classList.add("answered"); row.hidden = true; change.hidden = false;
      respond(slot, ratesInsight(), function () { go(statusQ); }, quiet, false);
    }
    change.addEventListener("click", function () { box.classList.remove("answered"); row.hidden = false; change.hidden = true; slot.innerHTML = ""; stage("listen"); paint(); });
    goB.addEventListener("click", function () { finish(list(), false); });
    show(node); paint();
    if (list().length > 1 && S.spread === "multi") setTimeout(function () { finish(list(), true); }, reduce ? 0 : 280);
  }

  function locations() {
    var F = fac();
    question({ step: 3, eyebrow: "Footprint", q: "How many " + F.units + "?", opts: [["1", "1"], ["3", "2 to 5"], ["12", "6 to 20"], ["35", "21 to 50"], ["75", "50+"]], chip: function (k, l) { return l + " " + (k === "1" ? F.unit : F.units); },
      pick: function (k) { S.locs = parseInt(k, 10); S.locLabel = { "1": "1", "3": "2 to 5", "12": "6 to 20", "35": "21 to 50", "75": "50+" }[k]; },
      insight: function () { return { redirect: stateQ }; },
      next: stateQ });
  }

  function riseFor(state) {
    var nat = EP.national.augYoY, loc = EP.rateChange[state];
    return (loc != null && loc > nat) ? { pct: loc, local: true } : { pct: nat, local: false };
  }
  function demandInfo(m) {
    var sd = ENG.demandShare(S.state, engKey()), base = sd ? sd.share : EP.streams.demand.shareDefault;
    var tier = m < 3000 ? 0.15 : m < 10000 ? 0.28 : 1;
    return { d: Math.min(base, tier), capped: tier < base, sd: sd };
  }
  function demandShareFor(m) { return demandInfo(m).d; }
  function billInsight() {
    var m = S.monthly, di = demandInfo(m), d = di.d, sd = di.sd;
    if (m * S.locs < QUALIFY_MONTHLY) return { redirect: under };
    var dPct = Math.round(d * 100), name = EP.states[S.state].name;
    var src = "Based on demand rates at " + name + "'s largest utilities and how a typical " + fac().unit + " uses power through the day." + (di.capped ? " Smaller bills usually carry less, so we scaled it down." : "");
    return { found: true, tag: "Your demand charge", h: "About " + dPct + "% of that bill, roughly " + kmoney(m * d) + " a month, is probably a demand charge.",
      p: "Your utility charges you twice: once for how much power you use, and again for your busiest 15 minutes of the month, when everything runs at once. It&rsquo;s like a speeding ticket priced on your top speed, not your average. That second charge is called a demand charge, and it&rsquo;s one of the easiest parts of the bill to bring down." + (S.estimated ? " (Your bill is estimated from your building&rsquo;s size.)" : ""),
      viz: demandViz(),
      src: src };
  }
  /* motion: a month of power use; one spike; the ruler at that spike stretches across the whole month */
  function demandViz() {
    var X0 = 16, X1 = 344, Y0 = 40, YB = 172, perDay = 6, n = 30 * perDay, spikeAt = 18 * perDay + 3, pts = [], seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < n; i++) {
      var ph = (i % perDay) / perDay, v = 0.22 + 0.2 * Math.max(0, Math.sin(ph * 2 * Math.PI)) + 0.05 * rnd();
      if (i === spikeAt) v = 0.96; else if (Math.abs(i - spikeAt) === 1) v = 0.6;
      pts.push([X0 + (X1 - X0) * i / (n - 1), YB - (YB - Y0) * Math.max(0.08, Math.min(v, 1))]);
    }
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    var sx = pts[spikeAt][0], sy = pts[spikeAt][1];
    return '<div class="dviz" aria-label="A month of power use with one spike. The spike sets the charge for the whole month.">' +
      '<svg viewBox="0 0 360 206" role="img">' +
        '<rect class="dv-band" x="' + X0 + '" y="' + sy.toFixed(1) + '" width="' + (X1 - X0) + '" height="' + (YB - sy).toFixed(1) + '"/>' +
        '<line class="dv-axis" x1="' + X0 + '" y1="' + YB + '" x2="' + X1 + '" y2="' + YB + '"/>' +
        '<path class="dv-line" pathLength="1" d="' + d + '"/>' +
        '<line class="dv-ruler" x1="' + X0 + '" y1="' + sy.toFixed(1) + '" x2="' + X1 + '" y2="' + sy.toFixed(1) + '" style="transform-origin:' + sx.toFixed(1) + 'px ' + sy.toFixed(1) + 'px"/>' +
        '<circle class="dv-dot" cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="6" style="transform-origin:' + sx.toFixed(1) + 'px ' + sy.toFixed(1) + 'px"/>' +
        '<text class="dv-t1" x="' + (sx - 10).toFixed(1) + '" y="' + (sy - 12).toFixed(1) + '" text-anchor="end">Busiest 15 minutes</text>' +
        '<text class="dv-t2" x="' + X0 + '" y="' + (sy + 26).toFixed(1) + '">You&rsquo;re billed at this level</text>' +
        '<text class="dv-t2 dv-t3" x="' + X0 + '" y="' + (sy + 46).toFixed(1) + '">for the whole month</text>' +
        '<text class="dv-day" x="' + X0 + '" y="198">Day 1</text><text class="dv-day" x="' + X1 + '" y="198" text-anchor="end">Day 30</text>' +
      "</svg>" +
      '<button class="link dv-replay" type="button">Replay</button></div>';
  }
  /* motion: oil building up inside the coil, where an outside cleaning can't reach */
  var vizN = 0;
  function coilViz() {
    var id = "cvc" + (++vizN), cx = 104, cy = 108, f = function (n) { return n.toFixed(1); }, fins = "", heat = "";
    for (var i = 0; i < 18; i++) { var a = i / 18 * 2 * Math.PI; fins += '<line class="cv-fin" x1="' + f(cx + 66 * Math.cos(a)) + '" y1="' + f(cy + 66 * Math.sin(a)) + '" x2="' + f(cx + 80 * Math.cos(a)) + '" y2="' + f(cy + 80 * Math.sin(a)) + '"/>'; }
    for (var j = 0; j < 6; j++) {
      var b = (j / 6) * 2 * Math.PI + 0.26, x1 = cx + 86 * Math.cos(b), y1 = cy + 86 * Math.sin(b), x2 = cx + 104 * Math.cos(b), y2 = cy + 104 * Math.sin(b);
      var l = b + 2.6, r = b - 2.6;
      heat += '<path d="M' + f(x1) + "," + f(y1) + " L" + f(x2) + "," + f(y2) + " M" + f(x2 + 7 * Math.cos(l)) + "," + f(y2 + 7 * Math.sin(l)) + " L" + f(x2) + "," + f(y2) + " L" + f(x2 + 7 * Math.cos(r)) + "," + f(y2 + 7 * Math.sin(r)) + '"/>';
    }
    return '<div class="dviz cviz" aria-label="Inside a coil: oil builds up on the inside wall, heat cannot escape, and the unit runs longer.">' +
      '<svg viewBox="0 0 360 222" role="img"><defs><clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="56"/></clipPath></defs>' +
        '<g class="cv-heat" style="transform-origin:' + cx + 'px ' + cy + 'px">' + heat + "</g>" +
        fins +
        '<circle class="cv-in" cx="' + cx + '" cy="' + cy + '" r="56"/>' +
        '<circle class="cv-oil" cx="' + cx + '" cy="' + cy + '" r="56" clip-path="url(#' + id + ')"/>' +
        '<circle class="cv-wall" cx="' + cx + '" cy="' + cy + '" r="60"/>' +
        '<text class="cv-a" x="204" y="52">Outside cleaning</text><text class="cv-a" x="204" y="70">only reaches the fins</text>' +
        '<text class="cv-b" x="204" y="112">Oil builds up inside,</text><text class="cv-b" x="204" y="130">where it can&rsquo;t reach</text>' +
        '<text class="cv-c" x="204" y="172">Heat can&rsquo;t get out,</text><text class="cv-c" x="204" y="190">so the unit runs longer</text>' +
      '</svg><button class="link dv-replay" type="button">Replay</button></div>';
  }

  /* motion: open cases spill cold into the aisle while the heat pushes back */
  function casesViz() {
    var wisps = "", warm = "";
    [146, 156, 166].forEach(function (y, i) { wisps += '<path class="cs-cold" pathLength="1" style="animation-delay:' + (0.4 + i * 0.18) + 's" d="M90,' + (y - 22) + " C130," + (y - 6) + " 160," + (y + 2) + " 210," + (y - 4) + " S280," + (y - 2) + " 318," + (y - 6) + '"/>'; });
    [258, 290, 322].forEach(function (x, i) { warm += '<path class="cs-warm" pathLength="1" style="animation-delay:' + (1.6 + i * 0.15) + 's" d="M' + x + ",34 L" + x + ",104 M" + (x - 7) + ",96 L" + x + ",106 L" + (x + 7) + ',96"/>'; });
    return '<div class="dviz csviz" aria-label="Cold air spills out of an open case into the aisle, and the store heat pushes back. You pay for both.">' +
      '<svg viewBox="0 0 360 214" role="img">' +
        '<rect class="cs-case" x="16" y="58" width="72" height="116" rx="6"/>' +
        '<line class="cs-shelf" x1="22" y1="92" x2="82" y2="92"/><line class="cs-shelf" x1="22" y1="124" x2="82" y2="124"/><line class="cs-shelf" x1="22" y1="154" x2="82" y2="154"/>' +
        '<rect class="cs-vent" x="240" y="16" width="100" height="14" rx="4"/>' +
        wisps + warm +
        '<line class="cs-floor" x1="16" y1="176" x2="344" y2="176"/>' +
        '<text class="cs-t1" x="100" y="86">Cold air spills</text><text class="cs-t1" x="100" y="104">into the aisle</text>' +
        '<text class="cs-t2" x="344" y="128" text-anchor="end">Your heat pushes back</text>' +
        '<text class="cs-t3" x="180" y="204" text-anchor="middle">You pay for both</text>' +
      '</svg><button class="link dv-replay" type="button">Replay</button></div>';
  }

  /* motion: a clean wave turns jagged, and the motor heats up */
  function dirtyViz() {
    var X0 = 16, X1 = 344, cy = 62, A = 32, n = 220, c = [], d = [];
    for (var i = 0; i < n; i++) {
      var x = X0 + (X1 - X0) * i / (n - 1), t = i / (n - 1) * 3 * 2 * Math.PI, s = Math.sin(t);
      var j = s + 0.32 * Math.sin(5 * t) + 0.2 * Math.sin(7 * t) + 0.12 * Math.sin(11 * t);
      c.push(x.toFixed(1) + "," + (cy - A * s).toFixed(1)); d.push(x.toFixed(1) + "," + (cy - A * 0.85 * j).toFixed(1));
    }
    return '<div class="dviz dpviz" aria-label="A smooth power wave turns jagged when motors and electronics switch on. Dirty power wastes electricity and heats up equipment.">' +
      '<svg viewBox="0 0 360 196" role="img">' +
        '<line class="dp-axis" x1="' + X0 + '" y1="' + cy + '" x2="' + X1 + '" y2="' + cy + '"/>' +
        '<path class="dp-clean" pathLength="1" d="M' + c.join(" L") + '"/>' +
        '<path class="dp-dirty" pathLength="1" d="M' + d.join(" L") + '"/>' +
        '<text class="dp-t1" x="' + X0 + '" y="12">Clean power</text>' +
        '<text class="dp-t2" x="' + X0 + '" y="12">Dirty power from motors and electronics</text>' +
        '<circle class="dp-glow" cx="52" cy="152" r="34" style="transform-origin:52px 152px"/>' +
        '<circle class="dp-motor" cx="52" cy="152" r="22"/><circle class="dp-motor" cx="52" cy="152" r="8"/>' +
        '<text class="dp-t3" x="96" y="146">Wastes power you pay for</text><text class="dp-t4" x="96" y="166">and wears out equipment early</text>' +
      '</svg><button class="link dv-replay" type="button">Replay</button></div>';
  }

  /* plays when the chart is actually on screen, so a phone user doesn't miss it */
  var dvObs = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("play"); dvObs.unobserve(e.target); } }); }, { threshold: 0.75 }) : null;
  function wireReplay(root) {
    root.querySelectorAll(".dviz").forEach(function (v) { if (dvObs) dvObs.observe(v); else v.classList.add("play"); });
    root.querySelectorAll(".dv-replay").forEach(function (b) {
      b.addEventListener("click", function () { var v = b.closest(".dviz"), svg = v.querySelector("svg"), c = svg.cloneNode(true); svg.parentNode.replaceChild(c, svg); });
    });
  }
  function fmtK(x) { return ENG.fmtK(x).toUpperCase(); }
  function niceRound(x) { var st = x < 10000 ? 500 : x < 100000 ? 1000 : 5000; return Math.max(st, Math.round(x / st) * st); }
  function bill() {
    var F = fac(), edges = engFac().billBands, opts = [];
    for (var i = 0; i < edges.length - 1; i++) opts.push([edges[i] + "-" + edges[i + 1], "$" + fmtK(edges[i]) + " to $" + fmtK(edges[i + 1])]);
    opts.push(["unk", "Not sure, help me estimate"]);
    question({ step: 6, q: "What's a typical monthly electric bill for one " + F.unit + "?", sub: S.monthsOpen ? "Pick a typical month when you're open. A rough range is fine." : "A rough range is fine. We'll narrow it down next.", opts: opts, chip: function () { return ""; },
      pick: function (k) { if (k !== "unk") { var p = k.split("-"); S.band = [parseInt(p[0], 10), parseInt(p[1], 10)]; S.estimated = false; S.sqft = null; } },
      insight: function (k) { return k === "unk" ? { redirect: sizeQ } : { redirect: dial }; }, next: season });
  }
  function dial() {
    var lo = S.band[0], hi = S.band[1], e = [];
    for (var i = 0; i <= 4; i++) e.push(niceRound(lo * Math.pow(hi / lo, i / 4)));
    var opts = [];
    for (var j = 0; j < 4; j++) if (e[j + 1] > e[j]) opts.push([String(Math.round(Math.sqrt(e[j] * e[j + 1]))), "$" + fmtK(e[j]) + " to $" + fmtK(e[j + 1])]);
    opts.push([String(Math.round(Math.sqrt(lo * hi))), "Somewhere in that range"]);
    question({ step: 6, q: "Let's dial that in. Which is closest?", sub: "Between $" + fmtK(lo) + " and $" + fmtK(hi) + " a month.", opts: opts, chip: function (k) { return "About " + kmoney(parseInt(k, 10)) + "/mo per " + fac().unit; },
      pick: function (k) { S.monthly = parseInt(k, 10); },
      insight: billInsight, next: afterBill });
  }
  function sizeQ() {
    var F = fac();
    question({ step: 6, eyebrow: "Your bill", q: "How big is a typical " + F.unit + "?", sub: "We'll estimate the bill from benchmarks and say so.",
      opts: F.sizes.map(function (s, i) { return [String(i), s[0], s[1]]; }), chip: function (k, l) { return l + " " + F.unit + ", bill estimated"; },
      pick: function (k) { var s = F.sizes[parseInt(k, 10)]; S.sqft = s[2]; S.monthly = Math.round(s[2] * engFac().eui_kwh_sqft * EP.states[S.state].rate / 100 / 12); S.estimated = true; },
      insight: billInsight, next: afterBill });
  }
  function season() {
    question({ step: 7, eyebrow: "Your bill", q: "Which time of year was that bill from?", opts: [["summer", "Summer"], ["winter", "Winter"], ["mild", "Spring or fall"], ["avg", "Not sure"]], chip: function () { return ""; },
      pick: function (k) { S.season = k; },
      insight: function (k) { var idx = EP.states[S.state].season[k] || 1, annual = S.monthly / idx * 12; S.annual = annual;
        return { tag: "Your year", h: "That works out to about " + kmoney(annual) + " a year per " + fac().unit + (S.locs > 1 ? ", and " + kmoney(annual * S.locs) + " across all of them." : "."), p: k === "avg" ? "We'll treat it as an average month for your state." : "We adjust for the season using your state's monthly pattern, so one bill can stand in for a year.", viz: '<div class="fig"><span class="big" data-count="' + annual * S.locs + '">$0</span><span class="vs">per year in electricity' + (S.estimated ? ", estimated" : "") + "</span></div>", src: "EIA-861M monthly commercial sales by state" }; },
      next: function () { pathStep(0); } });
  }


  /* is it open year-round, seasonal, brand new, or not built yet? */
  function statusQ() {
    var F = fac();
    question({ step: 5, eyebrow: "Your " + F.units, q: "Which best describes your " + (S.locs > 1 ? F.units : F.unit) + "?",
      opts: [["year", "Open year-round"], ["seasonal", "Seasonal, closed part of the year"], ["new", "Opened in the last year"], ["planning", "Not built yet, still planning"]],
      chip: function (k, l) { return k === "year" ? "" : l; },
      pick: function (k) { S.status = k; if (k !== "seasonal") { delete S.monthsOpen; delete S.ans["__months"]; } if (k === "new") { S.age = 1; S.ageKey = "new"; } else if (S.ageKey === "new") { S.age = null; S.ageKey = null; } },
      insight: function (k) { return { redirect: k === "seasonal" ? monthsQ : k === "planning" ? planning : bill }; }, next: bill });
  }
  function monthsQ() {
    question({ step: 5, eyebrow: "Season", q: "About how many months a year are you open?", opts: [["4", "3 to 5 months"], ["7", "6 to 8 months"], ["10", "9 to 11 months"]],
      chip: function (k, l) { return "Open " + l; },
      pick: function (k) { S.monthsOpen = parseInt(k, 10); },
      insight: function (k) { return { tag: "Your season", h: "Then the savings are packed into fewer months.", p: "A seasonal building runs hard while it's open, so peaks and wear stack up faster. I'll count only the months you're open, plus what sits idle while you're closed.", src: "We scale the year to " + k + " open months." }; },
      next: bill });
  }
  function afterBill() { if (S.monthsOpen) { S.season = "avg"; pathStep(0); } else season(); }

  /* what they've already done, so we don't count savings they already have */
  function doneQ() {
    var F = fac();
    var opts = [["battery", "Battery storage"], ["solar", "Solar panels"], ["controls", "Smart controls or an energy management system"]];
    if (engFac().refrigShare) opts.push(["refrig", "Refrigeration upgrades in the last 5 years"]);
    if (anyChoice()) opts.push(["supply", "A contract with a power supplier, or an energy broker"]);
    opts.push(["led", "LED lighting"], ["none", "None of these"]);
    var LABEL = {}; opts.forEach(function (o) { LABEL[o[0]] = o[1]; });
    setProgress(8 + S.path.length);
    stage("listen");
    var q = "What have you already upgraded?";
    var node = $('<section class="screen turn">' + ask(q, "Tap all that apply, then Done. I&rsquo;ll leave out anything you already have.", "Already done") +
      '<div class="opts multi">' + opts.map(function (o) { return '<button class="opt" data-k="' + o[0] + '"><span>' + esc(o[1]) + "</span></button>"; }).join("") +
      '</div><div class="next done-row"><button class="btn" id="done-go" disabled>Done <span class="ar">&rarr;</span></button></div><button class="link change" type="button" hidden>Change my answer</button><div class="slot"></div></section>');
    var box = node.querySelector(".opts"), go_ = node.querySelector("#done-go"), row = node.querySelector(".done-row"), slot = node.querySelector(".slot"), change = node.querySelector(".change");
    function picked() { return Array.prototype.map.call(box.querySelectorAll(".opt.chosen"), function (b) { return b.dataset.k; }); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".opt"); if (!b || box.classList.contains("answered")) return;
      if (b.dataset.k === "none") box.querySelectorAll(".opt").forEach(function (x) { if (x !== b) x.classList.remove("chosen"); });
      else { var nb = box.querySelector('[data-k="none"]'); if (nb) nb.classList.remove("chosen"); }
      b.classList.toggle("chosen");
      go_.disabled = !picked().length; updateDone();
    });
    function updateDone() { if (box.classList.contains("answered")) return; var n = picked().length; setAction("Done", function () { finish(picked(), false); }, { disabled: !n, left: '<span class="picked">' + (n ? "" : "Tap all that apply") + "</span>" }); }
    change.addEventListener("click", function () { box.classList.remove("answered"); row.hidden = false; change.hidden = true; slot.innerHTML = ""; stage("listen"); updateDone(); });
    function finish(keys, quiet) {
      box.querySelectorAll(".opt").forEach(function (x) { x.classList.toggle("chosen", keys.indexOf(x.dataset.k) >= 0); });
      box.classList.add("answered"); row.hidden = true; change.hidden = false;
      S.done = {}; keys.forEach(function (k) { if (k !== "none") S.done[k] = true; });
      S.ans[q] = keys.join(",");
      var names = keys.filter(function (k) { return k !== "none"; }).map(function (k) { return LABEL[k]; });
      setChip(q, names.length ? "Already has: " + names.join(", ") : "No upgrades yet");
      var counted = ["battery", "controls", "refrig", "supply"].filter(function (k) { return S.done[k]; });
      var res;
      if (!names.length) res = { tag: "Already done", h: "Then everything I found is still on the table.", p: "Nothing in your number overlaps with work you've already paid for." };
      else res = { tag: "Already done", h: counted.length ? "Good. I took those out of your number so I'm not counting savings you already have." : "Good to know. Those already show up in the bill you gave me.",
        p: (S.done.solar || S.done.led ? "Solar and LED lower your bill, and the bill you gave already reflects them. " : "") + (counted.length ? "What's left is the work your current upgrades don't cover." : "None of them overlap with the fixes in your number.") };
      respond(slot, res, function () { go(role); }, quiet, false);
    }
    go_.addEventListener("click", function () { finish(picked(), false); });
    show(node);
    if (!S.ans[q]) updateDone();
    if (S.ans[q]) setTimeout(function () { finish(S.ans[q].split(","), true); }, reduce ? 0 : 280);
  }

  /* not built yet: no bill to read, so the conversation is about design, not a number */
  function planning() {
    setProgress(TOTAL, "");
    stage("found");
    var F = fac();
    var n = $('<section class="screen turn">' + ask("The cheapest savings are the ones designed in.", "Before equipment is specced is the best time to talk. A " + esc(F.unit) + " built right from day one avoids the overspend I&rsquo;d otherwise be finding in five years. Leave your name and number and an Energy Plus engineer will reach out about your plans.") +
      '<div class="field"><label for="p-name">First name</label><input id="p-name" autocomplete="given-name"></div><div class="field"><label for="p-phone">Mobile</label><input id="p-phone" type="tel" inputmode="tel" autocomplete="tel"></div><div class="err" id="p-err"></div><div class="next"><button class="btn" id="p-go">Talk to an engineer <span class="ar">&rarr;</span></button></div></section>');
    n.querySelector("#p-go").addEventListener("click", function () {
      var nm = n.querySelector("#p-name").value.trim(), ph = n.querySelector("#p-phone").value.replace(/\D/g, "");
      if (ph.length < 10) { n.querySelector("#p-err").textContent = "Enter a 10-digit mobile number so we can reach you."; return; }
      sendLead({ kind: "planning (not built yet)", name: nm, phone: ph, role: S.role, facility: F.label, state: S.stateName, states: (S.states || []).join(" "), locations: S.locLabel });
      n.querySelector("#p-err").textContent = ""; n.querySelector("#p-go").textContent = "Thanks, we'll be in touch"; n.querySelector("#p-go").disabled = true;
      stage("verify");
    });
    show(n); dockProxy(n, "#p-go", "Talk to an engineer");
  }

  function pathStep(i) {
    if (i >= S.path.length) return doneQ();
    var q = S.path[i];
    if (q.id === "age" && S.status === "new") return pathStep(i + 1);
    question({ step: 8 + i, eyebrow: q.eyebrow, q: q.q, sub: q.sub, opts: q.opts, pick: q.pick, insight: q.insight, next: function () { pathStep(i + 1); } });
  }

  function under() {
    stage("listen");
    setProgress(TOTAL, "");
    var n = $('<section class="screen turn">' + ask("Our full program is built for portfolios spending $10K or more a month.", "I don&rsquo;t want to waste your time with a pitch that doesn&rsquo;t fit. Leave your number and we&rsquo;ll reach out as we roll out options sized for you.") + '<div class="field"><label for="u-name">First name</label><input id="u-name" autocomplete="given-name"></div><div class="field"><label for="u-phone">Mobile</label><input id="u-phone" type="tel" inputmode="tel" autocomplete="tel"></div><div class="err" id="u-err"></div><div class="next" style="justify-content:space-between"><button class="link" id="restart">Start over</button><button class="btn" id="u-go">Keep me posted</button></div></section>');
    n.querySelector("#restart").addEventListener("click", function () { intro(); syncBack(); });
    n.querySelector("#u-go").addEventListener("click", function () {
      var nm = n.querySelector("#u-name").value.trim(), ph = n.querySelector("#u-phone").value.replace(/\D/g, "");
      if (ph.length < 10) { n.querySelector("#u-err").textContent = "Enter a 10-digit mobile number so we can reach you."; return; }
      sendLead({ kind: "under-threshold", name: nm, phone: ph });
      n.querySelector("#u-err").textContent = ""; n.querySelector("#u-go").textContent = "Noted"; n.querySelector("#u-go").disabled = true;
    });
    show(n); dockProxy(n, "#u-go", "Keep me posted");
  }

  function capture() {
    stage("listen");
    setProgress(TOTAL);
    var fs = findings(compute()), F = fac();
    var tease = '<div class="bubble say"><p class="eyebrow">What I found</p><h3>I found ' + fs.length + ' ways your ' + esc(S.locs > 1 ? F.units : F.unit) + ' ' + (S.locs > 1 ? "are" : "is") + ' overspending.</h3><ol class="tease">' + fs.map(function (x) { return "<li>" + esc(x[0]) + "</li>"; }).join("") + '</ol><p>Your report puts a dollar amount on each one.</p></div>';
    var n = $('<section class="screen turn">' + tease + ask("Where should I text your report?", "No email, no spam. Your report arrives by text, and your strategist is one reply away.") + '<div class="field"><label for="c-name">First name</label><input id="c-name" autocomplete="given-name"></div><div class="field"><label for="c-phone">Mobile</label><input id="c-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555"></div><div class="err" id="c-err"></div><div class="next"><button class="btn" id="c-go">Show my diagnostic <span class="ar">&rarr;</span></button></div></section>');
    n.querySelector("#c-go").addEventListener("click", function () {
      var nm = n.querySelector("#c-name").value.trim(), ph = n.querySelector("#c-phone").value.replace(/\D/g, "");
      if (!nm) { n.querySelector("#c-err").textContent = "Add your first name so the report is addressed to you."; return; }
      if (ph.length < 10) { n.querySelector("#c-err").textContent = "Enter a 10-digit mobile number."; return; }
      S.name = nm; S.phone = ph; working(function () { go(reveal); });
    });
    show(n); dockProxy(n, "#c-go", "Show my report");
    setTimeout(function () { var i = n.querySelector("#c-name"); if (i) i.focus({ preventScroll: true }); }, 600);
  }

  /* ---------- math ---------- */
  function computeOne(code) {
    return ENG.compute({ state: code, utility: null, facility: engKey(), billMonthly: S.monthsOpen ? S.monthly * S.monthsOpen / 12 : S.monthly, season: S.monthsOpen ? "avg" : S.season, heat: "unknown", done: S.done || {},
      hoursWeek: S.hours || null, occupancy: S.occupancy || "typical", locations: S.locs,
      nudges: { age: S.age != null ? S.age : null, sqft: S.sqft != null ? S.sqft : null },
      refrigRange: S.refrigRange || null, loadShape: S.loadShape || null });
  }
  function avgDeep(list) {
    var a = list[0];
    if (typeof a === "number") return list.reduce(function (t, x) { return t + x; }, 0) / list.length;
    if (Array.isArray(a)) return a.map(function (_, i) { return avgDeep(list.map(function (x) { return x[i]; })); });
    if (a && typeof a === "object") { var o = {}; Object.keys(a).forEach(function (k) { o[k] = (k === "flags" || typeof a[k] === "string" || typeof a[k] === "boolean" || a[k] == null) ? a[k] : avgDeep(list.map(function (x) { return x[k]; })); }); return o; }
    return a;
  }
  /* several states: run the building in each one and average, every state weighted equally */
  function compute() {
    if (!multiState()) return computeOne(S.state);
    return avgDeep(S.states.map(computeOne));
  }

  function findings(r) {
    var f = Object.keys(S.pf).map(function (k) { return S.pf[k]; });
    if (S.loadShape === "peaky") f.push(["One hot afternoon is pricing your whole month", "Everything runs at once on hot afternoons, and that busiest 15 minutes sets your demand charge for the month."]);
    if (S.cases && S.cases !== "door") f.push(["Your AC and refrigeration are fighting each other", "Open cases spill cold air into the aisles, and your heating pays to warm it back up."]);
    if (S.age != null && S.age >= 10) f.push(["Equipment past 10 years old", "Buildup inside the system has likely cost your units about " + Math.round(ENG.lossByAge(S.age) * 100) + "% of their cooling power, and emergency repairs start stacking up."]);
    f.push(["Dirty power on every circuit", "Modern electronics and motors send dirty power back through your wiring. It wastes electricity and wears out equipment early."]);
    if (anyChoice()) f.push(["Your supply rate is negotiable", multiState() ? "Some of your states let you choose who sells you power, without changing utilities." : "Your state lets you choose who sells you power, without changing utilities."]);
    return f.slice(0, 4);
  }
  function rng(r) { return kmoney(r[0]) + " to " + kmoney(r[1]); }

  /* a short working beat: Watt reads the answers before the readout */
  function working(done) {
    stage("work");
    var n = $('<section class="screen turn">' + ask("Give me a second.", "I&rsquo;m reading your answers against " + placePoss() + " rates and demand charges, and matching your " + esc(fac().units) + " to the fixes that pay back first.") + '<div class="bubble say typing slow" aria-hidden="true"><i></i><i></i><i></i></div></section>');
    show(n, true);
    setTimeout(done, reduce ? 400 : 2400);
  }

    function reveal() {
    stage("found");
    setProgress(TOTAL, "");
    var r = compute(), F = fac(), fs = findings(r), multi = S.locs > 1, L = S.locs;
    var lo = r.total[0], hi = r.total[1], typ = r.typical, annualAll = r.annual * L;
    var eq = ENG.R.mul(r.buckets.equipment.range, L), pk = ENG.R.mul(r.buckets.peak.range, L), sp = ENG.R.mul(r.buckets.brokering.range, L);
    var escPct = (r.escRate * 100).toFixed(1);
    var buckets = '<div class="kv"><div><span>Fixing equipment that&rsquo;s wasting power</span><b>' + rng(eq) + '</b></div><div><span>Lowering your busiest-15-minutes charge</span><b>' + rng(pk) + "</b></div>" + (sp[1] > 0 ? '<div><span>Buying your power for less</span><b>' + rng(sp) + "</b></div>" : "") + "</div>";
    var blocks = {
      where: '<div class="blk"><h2>Where the savings come from</h2>' + buckets + "</div>",
      findings: '<div class="blk"><h2>Top findings for your ' + esc(F.units) + '</h2><ol class="finds">' + fs.map(function (x, i) { return '<li style="animation-delay:' + (i * 120 + 300) + 'ms"><span class="n">' + String(i + 1).padStart(2, "0") + "</span><span><strong>" + esc(x[0]) + "</strong>" + esc(x[1]) + (x[0] === "Dirty power on every circuit" ? dirtyViz() : "") + "</span></li>"; }).join("") + "</ol></div>",
      nothing: '<div class="blk"><h2>The cost of waiting</h2><div class="kv"><div><span>Electricity spend, next 10 years</span><b>' + kmoney(annualAll * ENG.escalationFactor(r.escRate, 10)) + "</b></div><div><span>Rate increase we used</span><b>" + escPct + "% / yr</b></div><div><span>Savings left on the table</span><b>" + kmoney(r.typical * ENG.escalationFactor(r.escRate, 10)) + '</b></div></div><p class="sub" style="margin-top:12px">We used a conservative ' + escPct + "% a year for " + esc(placeName()) + ". " + (riseFor(S.state).local && !multiState() ? "Rates here actually rose " + riseFor(S.state).pct.toFixed(1) + "% in the last 12 months." : "Commercial rates actually rose " + EP.national.augYoY + "% nationally in the last year.") + "</p></div>",
      beyond: '<div class="blk"><h2>Beyond the bill</h2><div class="kv"><div><span>Maintenance cost</span><b>up to 40% lower</b></div><div><span>Added equipment life</span><b>5 to 15 years</b></div>' + (multi ? "<div><span>Per " + esc(F.unit) + ", typical</span><b>" + kmoney(typ / L) + "/yr</b></div>" : "") + '</div><p class="sub" style="margin-top:14px">And it&rsquo;s paid from the savings: projects are structured to be cash flow positive from day one where the numbers support it. We walk through the structure on the call.</p></div>',
    };
    var order = { owner: ["findings", "where", "nothing", "beyond"], fm: ["beyond", "findings", "where", "nothing"], cfo: ["nothing", "where", "findings", "beyond"], pm: ["beyond", "where", "nothing", "findings"], multi: ["where", "findings", "nothing", "beyond"] }[S.role] || ["findings", "where", "nothing", "beyond"];
    var smsBody = "Hi Dan, " + S.name + " here. I just ran the Energy Plus diagnostic: " + F.label + ", " + S.locLabel + " " + (L === 1 ? F.unit : F.units) + " in " + S.stateName + ", about " + kmoney(S.monthly) + "/mo each. It estimated " + kmoney(lo) + " to " + kmoney(hi) + "/yr in savings. Let's talk.";
    var assumptions = [
      S.monthsOpen && !S.estimated ? "Your bill is a typical month when you're open, counted across your open months." : S.estimated ? "Your bill was estimated from a typical " + esc(F.unit) + " size and " + esc(F.label.split(" /")[0].toLowerCase()) + " energy benchmarks." : "Your bill uses the middle of the range you picked, adjusted for the season.",
      multiState() ? (nationwide() ? "Average commercial rate across the lower 48 states and DC, each weighted equally." : "Average commercial rate across your " + S.states.length + " states, each weighted equally, not your utilities' exact tariffs.") : esc(S.stateName) + " commercial average rate, not your utility's exact tariff.",
      "Demand charge of about " + Math.round(demandShareFor(S.monthly) * 100) + "% of the bill, from the demand rates of " + placePoss() + " largest utilities.",
      S.age == null ? "Equipment age assumed at 10 years." : S.ageKey === "new" ? "Equipment treated as new, since the building opened in the last year." : "Equipment age as you described it.",
      S.monthsOpen ? "Counted " + S.monthsOpen + " open months a year." : "",
      S.done && Object.keys(S.done).length ? "Left out savings from upgrades you already have." : "",
      "Savings use Energy Plus program ranges; your answers set where in the range you land. Typical is the middle of the range, not the top.",
      "This is an estimate. Your building sets your number, verified only by a site pilot."
    ];
    var n = $('<section class="screen readout">' + ask(esc(S.name) + ", " + (WHY_OPEN[S.why] || "here&rsquo;s what I found.").replace(/^./, function (c) { return c.toLowerCase(); }), "Based on your answers. Our Chief Engineer, Cliff, checks every number with you before anything is installed.") + '<div class="panel"><div class="grat"></div><div class="in"><h2>Here&rsquo;s what your ' + esc(multi ? F.units : F.unit) + ' could save each year</h2><div class="range"><span id="lo">$0</span> to <span id="hi">$0</span></div><div class="per">per year &middot; ' + Math.round(r.perSite[0] / r.annual * 100) + " to " + Math.round(r.perSite[1] / r.annual * 100) + '% of your electric spend &middot; typical <span id="typ">$0</span></div><div class="ticks"><div><b id="ten">$0</b><span>10-year savings, typical</span></div><div><b>' + kmoney(annualAll) + "</b><span>annual electric spend" + (S.estimated ? ", est." : "") + "</span></div><div><b>" + escPct + "%</b><span>yearly rate climb used</span></div></div></div></div>" +
      '<div class="blocks">' + order.map(function (k) { return blocks[k]; }).join("") +
      '<div class="blk"><h2>Find out if these numbers hold for your ' + esc(F.units) + '</h2><p class="sub">A 15-minute call turns this estimate into a site-specific number. Text Dan directly.</p><div class="verifier"><div class="vf-pics"><img src="../assets/img/cliff-head.jpg" alt="Cliff Suljak" width="72" height="72"><span id="w-ver" class="vf-watt"></span></div><div class="vf-t"><p class="vf-role">Your verifier</p><p class="vf-name">Cliff Suljak</p><p class="vf-title">Chief Engineer, Energy Plus</p><p class="vf-say">Watt finds it. Cliff checks it. Every number in your report is verified by Cliff before anything is installed.</p></div></div><div class="cta" style="margin-top:16px"><a class="btn" id="sms" href="sms:' + PHONE_E164 + "?body=" + encodeURIComponent(smsBody) + '">Text Dan <span class="ar">&rarr;</span></a><div class="num"><span>' + PHONE_DISPLAY + '</span><button class="copy" id="cp">Copy number</button></div><a class="link" href="' + bookUrl(r) + '" target="_blank" rel="noopener">Or book a call</a></div></div>' +
      '<div class="blk"><h2 style="font-size:22px">What you told Watt</h2><div class="told">' + S.order.filter(function (q) { return S.ans[q] != null && S.chip[q]; }).map(function (q) { return '<span class="chip">' + esc(S.chip[q]) + "</span>"; }).join("") + "</div></div>" +
      '<div class="blk assume"><h2 style="font-size:22px">How we estimated this</h2><ul>' + assumptions.filter(Boolean).map(function (a) { return "<li>" + a + "</li>"; }).join("") + '</ul><p style="margin-top:14px"><button class="link" id="again">Run another building</button></p></div></div></section>');
    n.querySelector("#cp").addEventListener("click", function (e) { var b = e.currentTarget; try { navigator.clipboard.writeText(PHONE_DISPLAY).then(function () { b.textContent = "Copied"; }, function () { b.textContent = PHONE_DISPLAY; }); } catch (_) { b.textContent = PHONE_DISPLAY; } });
    n.querySelector("#again").addEventListener("click", function () { intro(); syncBack(); });
    wattIn(n, "#w-ver", 34, { state: "verify", fixed: true });
    wireReplay(n); show(n, true); setAction("Text Dan", null, { href: n.querySelector("#sms").getAttribute("href") });
    var tenTyp = r.typical * ENG.escalationFactor(r.escRate, 10);
    setTimeout(function () { countUp(document.getElementById("lo"), lo, kmoney, 1600); countUp(document.getElementById("hi"), hi, kmoney, 1900); countUp(document.getElementById("typ"), typ, kmoney, 1900); countUp(document.getElementById("ten"), tenTyp, kmoney, 2200); }, reduce ? 0 : 420);
    sendLead({ kind: S.leadSent ? "diagnostic, updated answers" : "diagnostic", name: S.name, phone: S.phone, role: S.role, facility: F.label, state: S.stateName, states: (S.states || []).join(" "), locations: S.locLabel,
      monthly_bill_each: S.monthly, bill_estimated: !!S.estimated, season: S.season, age: S.ageKey || "", summer: S.summer || "",
      why: S.why || "", status: S.status || "", months_open: S.monthsOpen || "", already_done: Object.keys(S.done || {}).join(", "), answers: JSON.stringify(S.answersLog || {}), savings_low: Math.round(lo), savings_high: Math.round(hi), savings_typical: Math.round(typ), ten_year_typical: Math.round(tenTyp) });
  }

  /* Booking hand-off: carry the walkthrough answers to book.slashyourenergycost.com so the
     visitor isn't asked them again. src=calc is the booking page's existing hand-off (skips
     facility, bill and locations); wt=1 tells the updated booking page to also skip name,
     phone, state and the extra questions the walkthrough already covered. */
  var BOOK_FAC = { grocery: "supermarket", cold: "coldstorage", hotel: "hotel", qsr: "qsr", cstore: "cstore", health: "healthcare",
    ind: "manufacturing", fit: "fitness", dc: "datacenter", mf: "multifamily", office: "office", retail: "retail" };
  function bookUrl(r) {
    var q = { src: "calc", wt: "1", f: BOOK_FAC[S.fac] || "other", b: Math.round(S.monthly || 0), n: S.locs || 1, st: S.state || "",
      name: S.name || "", phone: S.phone || "", est_lo: Math.round(r.total[0]), est_hi: Math.round(r.total[1]),
      role: S.role || "", age: S.ageKey || "", summer: S.summer || "" };
    return BOOK_URL + "?" + Object.keys(q).filter(function (k) { return q[k] !== "" && q[k] != null; })
      .map(function (k) { return k + "=" + encodeURIComponent(q[k]); }).join("&");
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
