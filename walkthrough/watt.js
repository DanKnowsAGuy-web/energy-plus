/* Watt, your Energy+ AI: the walkthrough's avatar. One identity, five stage states.
   Watt.mount(el, size, {onPetrol, state, fixed}) draws an instance; Watt.set(state) morphs every instance.
   States: hello (round), listen (hexagon), work (bolt), found (spark), verify (hexagon + glowing plus).
   Watt.lookAt(el) glances his eyes at something; Watt.fly(el, done) sends a small spark from him to it. */
(function () {
  var SH = {"power":[0.5,0.14,0.5209,0.1406,0.5418,0.1422,0.5626,0.1449,0.5832,0.1488,0.6035,0.1536,0.6236,0.1596,0.6433,0.1666,0.6627,0.1746,0.6816,0.1836,0.7,0.1936,0.7178,0.2045,0.7351,0.2164,0.7517,0.2292,0.7676,0.2428,0.7828,0.2572,0.7972,0.2724,0.8108,0.2883,0.8236,0.3049,0.8355,0.3222,0.8464,0.34,0.8564,0.3584,0.8654,0.3773,0.8734,0.3967,0.8804,0.4164,0.8864,0.4365,0.8912,0.4568,0.8951,0.4774,0.8978,0.4982,0.8994,0.5191,0.9,0.54,0.8994,0.5609,0.8978,0.5818,0.8951,0.6026,0.8912,0.6232,0.8864,0.6435,0.8804,0.6636,0.8734,0.6833,0.8654,0.7027,0.8564,0.7216,0.8464,0.74,0.8355,0.7578,0.8236,0.7751,0.8108,0.7917,0.7972,0.8076,0.7828,0.8228,0.7676,0.8372,0.7517,0.8508,0.7351,0.8636,0.7178,0.8755,0.7,0.8864,0.6816,0.8964,0.6627,0.9054,0.6433,0.9134,0.6236,0.9204,0.6035,0.9264,0.5832,0.9312,0.5626,0.9351,0.5418,0.9378,0.5209,0.9394,0.5,0.94,0.4791,0.9394,0.4582,0.9378,0.4374,0.9351,0.4168,0.9312,0.3965,0.9264,0.3764,0.9204,0.3567,0.9134,0.3373,0.9054,0.3184,0.8964,0.3,0.8864,0.2822,0.8755,0.2649,0.8636,0.2483,0.8508,0.2324,0.8372,0.2172,0.8228,0.2028,0.8076,0.1892,0.7917,0.1764,0.7751,0.1645,0.7578,0.1536,0.74,0.1436,0.7216,0.1346,0.7027,0.1266,0.6833,0.1196,0.6636,0.1136,0.6435,0.1088,0.6232,0.1049,0.6026,0.1022,0.5818,0.1006,0.5609,0.1,0.54,0.1006,0.5191,0.1022,0.4982,0.1049,0.4774,0.1088,0.4568,0.1136,0.4365,0.1196,0.4164,0.1266,0.3967,0.1346,0.3773,0.1436,0.3584,0.1536,0.34,0.1645,0.3222,0.1764,0.3049,0.1892,0.2883,0.2028,0.2724,0.2172,0.2572,0.2324,0.2428,0.2483,0.2292,0.2649,0.2164,0.2822,0.2045,0.3,0.1936,0.3184,0.1836,0.3373,0.1746,0.3567,0.1666,0.3764,0.1596,0.3965,0.1536,0.4168,0.1488,0.4374,0.1449,0.4582,0.1422,0.4791,0.1406],"cell":[0.5,0.0678,0.5195,0.0695,0.539,0.0749,0.5585,0.0838,0.5779,0.095,0.5974,0.1062,0.6169,0.1175,0.6364,0.1288,0.6559,0.14,0.6754,0.1512,0.6949,0.1625,0.7143,0.1737,0.7338,0.185,0.7533,0.1963,0.7728,0.2075,0.7923,0.2188,0.8118,0.23,0.8313,0.2412,0.8487,0.2537,0.863,0.2679,0.8743,0.2839,0.8825,0.3016,0.8877,0.3212,0.8897,0.3425,0.8897,0.365,0.8897,0.3875,0.8897,0.41,0.8897,0.4325,0.8897,0.455,0.8897,0.4775,0.8897,0.5,0.8897,0.5225,0.8897,0.545,0.8897,0.5675,0.8897,0.59,0.8897,0.6125,0.8897,0.635,0.8897,0.6575,0.8877,0.6788,0.8825,0.6984,0.8743,0.7161,0.863,0.7321,0.8487,0.7463,0.8313,0.7588,0.8118,0.77,0.7923,0.7812,0.7728,0.7925,0.7533,0.8038,0.7338,0.815,0.7143,0.8263,0.6949,0.8375,0.6754,0.8488,0.6559,0.86,0.6364,0.8712,0.6169,0.8825,0.5974,0.8937,0.5779,0.905,0.5585,0.9162,0.539,0.9251,0.5195,0.9305,0.5,0.9322,0.4805,0.9305,0.461,0.9251,0.4415,0.9162,0.4221,0.905,0.4026,0.8937,0.3831,0.8825,0.3636,0.8713,0.3441,0.86,0.3246,0.8487,0.3051,0.8375,0.2857,0.8263,0.2662,0.815,0.2467,0.8037,0.2272,0.7925,0.2077,0.7812,0.1882,0.77,0.1687,0.7587,0.1513,0.7463,0.137,0.7321,0.1257,0.7161,0.1175,0.6984,0.1123,0.6788,0.1103,0.6575,0.1103,0.635,0.1103,0.6125,0.1103,0.59,0.1103,0.5675,0.1103,0.545,0.1103,0.5225,0.1103,0.5,0.1103,0.4775,0.1103,0.455,0.1103,0.4325,0.1103,0.41,0.1103,0.3875,0.1103,0.365,0.1103,0.3425,0.1123,0.3212,0.1175,0.3016,0.1257,0.2839,0.137,0.2679,0.1513,0.2537,0.1687,0.2412,0.1882,0.23,0.2077,0.2187,0.2272,0.2075,0.2467,0.1962,0.2662,0.185,0.2857,0.1737,0.3051,0.1625,0.3246,0.1512,0.3441,0.14,0.3636,0.1287,0.3831,0.1175,0.4026,0.1062,0.4221,0.095,0.4415,0.0837,0.461,0.0749,0.4805,0.0695],"bolt":[0.5056,0.1535,0.5219,0.1344,0.5383,0.1153,0.5546,0.0963,0.571,0.0772,0.5873,0.0581,0.6045,0.0408,0.624,0.0287,0.6459,0.0217,0.6683,0.0213,0.6828,0.0287,0.6881,0.0425,0.6842,0.0628,0.6756,0.0863,0.6669,0.1099,0.6582,0.1335,0.6495,0.157,0.6408,0.1806,0.6321,0.2042,0.6235,0.2277,0.6148,0.2513,0.6061,0.2749,0.5974,0.2984,0.5887,0.322,0.5801,0.3456,0.5725,0.3683,0.5733,0.3853,0.5833,0.3959,0.6024,0.4,0.6276,0.4,0.6527,0.4,0.6778,0.4,0.7029,0.4,0.728,0.4,0.7531,0.4,0.7783,0.4,0.8034,0.4,0.8266,0.4008,0.8394,0.4063,0.8408,0.4169,0.8307,0.4326,0.814,0.4513,0.7972,0.47,0.7804,0.4887,0.7637,0.5074,0.7469,0.5261,0.7301,0.5448,0.7134,0.5635,0.6966,0.5822,0.6799,0.6009,0.6631,0.6196,0.6463,0.6383,0.6296,0.657,0.6128,0.6757,0.596,0.6944,0.5793,0.7131,0.5625,0.7318,0.5457,0.7505,0.529,0.7692,0.5122,0.7879,0.4954,0.8066,0.4787,0.8253,0.4619,0.844,0.4451,0.8627,0.4284,0.8814,0.4116,0.9001,0.3948,0.9188,0.3781,0.9375,0.3623,0.9544,0.3521,0.9607,0.3482,0.9551,0.3505,0.9379,0.3566,0.9135,0.3627,0.8891,0.3688,0.8648,0.3749,0.8404,0.381,0.816,0.3871,0.7917,0.3932,0.7673,0.3993,0.7429,0.4054,0.7186,0.4114,0.6942,0.4175,0.6699,0.4236,0.6455,0.4297,0.6211,0.4303,0.601,0.4224,0.5876,0.406,0.5808,0.3819,0.58,0.3568,0.58,0.3317,0.58,0.3066,0.58,0.2815,0.58,0.2564,0.58,0.2312,0.58,0.2061,0.58,0.1811,0.5799,0.1639,0.5763,0.1581,0.5675,0.1635,0.5534,0.1787,0.5349,0.195,0.5158,0.2114,0.4967,0.2277,0.4777,0.2441,0.4586,0.2604,0.4395,0.2768,0.4204,0.2931,0.4014,0.3095,0.3823,0.3258,0.3632,0.3421,0.3442,0.3585,0.3251,0.3748,0.306,0.3912,0.287,0.4075,0.2679,0.4239,0.2488,0.4402,0.2298,0.4566,0.2107,0.4729,0.1916,0.4892,0.1726],"spark":[0.5,0.0331,0.5065,0.0429,0.5135,0.0657,0.5212,0.0883,0.5296,0.1106,0.5386,0.1327,0.5484,0.1545,0.5589,0.1759,0.5702,0.1969,0.5822,0.2175,0.5949,0.2376,0.6085,0.2572,0.6228,0.2763,0.6379,0.2948,0.6536,0.3126,0.6702,0.3298,0.6874,0.3464,0.7052,0.3621,0.7237,0.3772,0.7428,0.3915,0.7624,0.4051,0.7825,0.4178,0.8031,0.4298,0.8241,0.4411,0.8455,0.4516,0.8673,0.4614,0.8894,0.4704,0.9117,0.4788,0.9343,0.4865,0.9571,0.4935,0.9669,0.5,0.9571,0.5065,0.9343,0.5135,0.9117,0.5212,0.8894,0.5296,0.8673,0.5386,0.8455,0.5484,0.8241,0.5589,0.8031,0.5702,0.7825,0.5822,0.7624,0.5949,0.7428,0.6085,0.7237,0.6228,0.7052,0.6379,0.6874,0.6536,0.6702,0.6702,0.6536,0.6874,0.6379,0.7052,0.6228,0.7237,0.6085,0.7428,0.5949,0.7624,0.5822,0.7825,0.5702,0.8031,0.5589,0.8241,0.5484,0.8455,0.5386,0.8673,0.5296,0.8894,0.5212,0.9117,0.5135,0.9343,0.5065,0.9571,0.5,0.9669,0.4935,0.9571,0.4865,0.9343,0.4788,0.9117,0.4704,0.8894,0.4614,0.8673,0.4516,0.8455,0.4411,0.8241,0.4298,0.8031,0.4178,0.7825,0.4051,0.7624,0.3915,0.7428,0.3772,0.7237,0.3621,0.7052,0.3464,0.6874,0.3298,0.6702,0.3126,0.6536,0.2948,0.6379,0.2763,0.6228,0.2572,0.6085,0.2376,0.5949,0.2175,0.5822,0.1969,0.5702,0.1759,0.5589,0.1545,0.5484,0.1327,0.5386,0.1106,0.5296,0.0883,0.5212,0.0657,0.5135,0.0429,0.5065,0.0331,0.5,0.0429,0.4935,0.0657,0.4865,0.0883,0.4788,0.1106,0.4704,0.1327,0.4614,0.1545,0.4516,0.1759,0.4411,0.1969,0.4298,0.2175,0.4178,0.2376,0.4051,0.2572,0.3915,0.2763,0.3772,0.2948,0.3621,0.3126,0.3464,0.3298,0.3298,0.3464,0.3126,0.3621,0.2948,0.3772,0.2763,0.3915,0.2572,0.4051,0.2376,0.4178,0.2175,0.4298,0.1969,0.4411,0.1759,0.4516,0.1545,0.4614,0.1327,0.4704,0.1106,0.4788,0.0883,0.4865,0.0657,0.4935,0.0429]};
  var STATES = {
    hello:  { shape: "power", eyes: [0.50, 0.56, 0.15, 0.075, 0.15], acc: "plug" },
    listen: { shape: "cell",  eyes: [0.50, 0.50, 0.15, 0.075, 0.15], acc: "plus" },
    work:   { shape: "bolt",  eyes: [0.50, 0.49, 0.075, 0.055, 0.045], acc: "dot" },
    found:  { shape: "spark", eyes: [0.50, 0.50, 0.075, 0.055, 0.11], acc: "dot" },
    verify: { shape: "cell",  eyes: [0.50, 0.50, 0.15, 0.075, 0.15], acc: "glow" }
  };
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = [], cur = "listen";

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function pathD(pts) { var d = "M" + pts[0].toFixed(3) + "," + pts[1].toFixed(3); for (var i = 2; i < pts.length; i += 2) d += "L" + pts[i].toFixed(3) + "," + pts[i + 1].toFixed(3); return d + "Z"; }
  function ease(t) { return t * t * (3 - 2 * t); }

  function plus(g, cx, cy, pl) {
    el("rect", { x: cx - pl * 0.35, y: cy - pl, width: pl * 0.7, height: pl * 2, rx: pl * 0.2 }, g);
    el("rect", { x: cx - pl, y: cy - pl * 0.35, width: pl * 2, height: pl * 0.7, rx: pl * 0.2 }, g);
  }

  function mount(host, size, opt) {
    opt = opt || {};
    var svg = el("svg", { viewBox: "-0.08 -0.08 1.16 1.16", width: size, height: size, "aria-hidden": "true", focusable: "false", "class": "watt" + (opt.onPetrol ? " on-petrol" : "") });
    var acc = {};
    acc.glow = el("g", { "class": "w-acc w-glow" }, svg);
    el("circle", { cx: 0.5, cy: 0.03, r: 0.13, opacity: 0.18 }, acc.glow); el("circle", { cx: 0.5, cy: 0.03, r: 0.09, opacity: 0.3 }, acc.glow); plus(acc.glow, 0.5, 0.03, 0.075);
    acc.plug = el("g", { "class": "w-acc" }, svg); el("rect", { x: 0.455, y: 0.02, width: 0.09, height: 0.16, rx: 0.045 }, acc.plug);
    var body = el("path", { "class": "w-body", "stroke-width": 0.03, "stroke-linejoin": "round" }, svg);
    acc.plus = el("g", { "class": "w-acc" }, svg); plus(acc.plus, 0.5, 0.03, 0.06);
    acc.dot = el("g", { "class": "w-acc" }, svg); el("circle", { cx: 0.88, cy: 0.10, r: 0.05 }, acc.dot);
    var eyes = [el("rect", { "class": "w-eye" }, svg), el("rect", { "class": "w-eye" }, svg)];
    host.appendChild(svg);
    var st = STATES[opt.state] ? opt.state : cur;
    var inst = { svg: svg, body: body, eyes: eyes, acc: acc, pts: SH[STATES[st].shape].slice(), e: STATES[st].eyes.slice(), blink: 1, raf: 0, fixed: !!opt.fixed, lx: 0, ly: 0, lraf: 0 };
    draw(inst); showAcc(inst, STATES[st].acc, true);
    all.push(inst);
    return inst;
  }

  function draw(inst) {
    inst.body.setAttribute("d", pathD(inst.pts));
    var e = inst.e, cx = e[0] + (inst.lx || 0), cy = e[1] + (inst.ly || 0), gap = e[2], w = e[3], h = Math.max(e[4] * inst.blink, w * 0.6);
    for (var i = 0; i < 2; i++) {
      var ex = cx + (i ? gap : -gap), r = inst.eyes[i];
      r.setAttribute("x", (ex - w / 2).toFixed(4)); r.setAttribute("y", (cy - h / 2).toFixed(4));
      r.setAttribute("width", w.toFixed(4)); r.setAttribute("height", h.toFixed(4)); r.setAttribute("rx", (Math.min(w, h) / 2).toFixed(4));
    }
  }

  function showAcc(inst, which, instant) {
    for (var k in inst.acc) { var g = inst.acc[k]; if (instant) g.style.transition = "none"; g.style.opacity = k === which ? "1" : "0"; if (instant) { void g.getBoundingClientRect(); g.style.transition = ""; } }
  }

  function morph(inst, to) {
    cancelAnimationFrame(inst.raf);
    var S = STATES[to], p0 = inst.pts.slice(), p1 = SH[S.shape], e0 = inst.e.slice(), e1 = S.eyes;
    showAcc(inst, S.acc, reduce);
    if (reduce) { inst.pts = p1.slice(); inst.e = e1.slice(); draw(inst); return; }
    var t0 = performance.now(), dur = 620;
    (function step(now) {
      var t = Math.min((now - t0) / dur, 1), k = ease(t);
      for (var i = 0; i < p1.length; i++) inst.pts[i] = p0[i] + (p1[i] - p0[i]) * k;
      for (var j = 0; j < 5; j++) inst.e[j] = e0[j] + (e1[j] - e0[j]) * k;
      draw(inst);
      if (t < 1) inst.raf = requestAnimationFrame(step);
    })(t0);
  }

  function set(state, only) {
    if (!STATES[state]) return;
    if (!only && state === cur) return;
    if (!only) cur = state;
    (only ? [only] : all.filter(function (x) { return !x.fixed; })).forEach(function (inst) { morph(inst, state); });
  }

  function blink() {
    if (reduce) return;
    all.forEach(function (inst) {
      if (!inst.svg.isConnected) return;
      var t0 = performance.now();
      (function step(now) { var t = Math.min((now - t0) / 180, 1); inst.blink = Math.max(0.08, Math.abs(1 - 2 * t)); draw(inst); if (t < 1) requestAnimationFrame(step); else { inst.blink = 1; draw(inst); } })(t0);
    });
  }

  /* an idle blink every few seconds keeps Watt alive without stealing attention */
  setInterval(function () { if (!document.hidden && (cur === "listen" || cur === "hello")) blink(); }, 5200);

  /* where he's looking: eyes slide toward a point on the page, then come back to the visitor */
  function visible() {
    return all.filter(function (i) { if (!i.svg.isConnected) return false; var r = i.svg.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(i.svg).visibility !== "hidden" && i.svg.closest("[hidden]") === null; })
      .sort(function (a, b) { return b.svg.getBoundingClientRect().width - a.svg.getBoundingClientRect().width; });
  }
  function glide(inst, tx, ty, dur) {
    cancelAnimationFrame(inst.lraf);
    var x0 = inst.lx, y0 = inst.ly, t0 = performance.now();
    (function step(now) {
      var t = Math.min((now - t0) / dur, 1), k = ease(t);
      inst.lx = x0 + (tx - x0) * k; inst.ly = y0 + (ty - y0) * k; draw(inst);
      if (t < 1) inst.lraf = requestAnimationFrame(step);
    })(t0);
  }
  var lookTimer = 0;
  function lookAt(target, hold) {
    if (reduce || !target || !target.getBoundingClientRect) return;
    var tr = target.getBoundingClientRect(), tx = tr.left + tr.width / 2, ty = tr.top + Math.min(tr.height / 2, 60);
    all.forEach(function (inst) {
      if (!inst.svg.isConnected) return;
      var r = inst.svg.getBoundingClientRect(); if (!r.width) return;
      var dx = tx - (r.left + r.width / 2), dy = ty - (r.top + r.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1;
      glide(inst, dx / d * 0.055, dy / d * 0.05, 220);
    });
    clearTimeout(lookTimer);
    lookTimer = setTimeout(function () { all.forEach(function (inst) { glide(inst, 0, 0, 320); }); }, hold || 900);
  }
  /* a small ochre spark leaves Watt and lands on something he's handing over (a number, a note) */
  var sparkCss = false;
  function fly(target, done, opt) {
    opt = opt || {};
    var src = visible()[0];
    if (reduce || !src || !target || !target.getBoundingClientRect) { if (done) done(); return; }
    var a = src.svg.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (b.bottom < 0 || b.top > innerHeight) { if (done) done(); return; }
    if (!sparkCss) {
      sparkCss = true;
      var st = document.createElement("style");
      st.textContent = ".watt-spark{position:fixed;left:0;top:0;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#e0a21c;box-shadow:0 0 0 4px rgba(224,162,28,.25),0 0 14px 2px rgba(224,162,28,.55);pointer-events:none;z-index:9999}" +
        ".watt-land{animation:wattLand .45s cubic-bezier(.3,1.6,.5,1)}@keyframes wattLand{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}";
      document.head.appendChild(st);
    }
    lookAt(target, 700);
    var dot = document.createElement("i"); dot.className = "watt-spark"; document.body.appendChild(dot);
    var x0 = a.left + a.width / 2, y0 = a.top + a.height * 0.3, x1 = opt.x != null ? opt.x : b.left + Math.min(b.width / 2, 40), y1 = opt.y != null ? opt.y : b.top + b.height / 2;
    var cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 40, t0 = performance.now(), dur = opt.dur || 460;
    (function step(now) {
      var t = Math.min((now - t0) / dur, 1), k = ease(t), u = 1 - k;
      var x = u * u * x0 + 2 * u * k * cx + k * k * x1, y = u * u * y0 + 2 * u * k * cy + k * k * y1;
      dot.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (1 - k * 0.35).toFixed(2) + ")";
      if (t < 1) return requestAnimationFrame(step);
      dot.remove();
      if (!opt.noLand) { target.classList.remove("watt-land"); void target.offsetWidth; target.classList.add("watt-land"); }
      if (done) done();
    })(t0);
  }
  window.Watt = { mount: mount, set: set, blink: blink, lookAt: lookAt, fly: fly, state: function () { return cur; } };
})();
