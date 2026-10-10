/* Energy Plus · the building (motion preview)
   The pinned, scroll-scrubbed set piece for #method. Ported from the vertical
   ad's engine (ad-video/common.js on the ad branch: iso geometry, the building,
   the clip-on meter, the waste layer that dissolves into particles) and
   re-cut for the site: the gallery palette, scroll as the clock, and the three
   levers the partner pages already use (cooling -> the meter, peak -> the
   demand charge, distortion -> equipment life).

   Scroll position is the timeline, so scrubbing back reassembles the waste.
   Ambient life (fans, heat shimmer, meter pings) runs on rAF only while the
   stage is on screen.

   White-label slots (all on #method):
     data-facility="store | restaurant | tower"   building archetype
     ?facility=... in the URL overrides it, for previews
   Copy lives in the HTML beats, so a partner page swaps words, not code.

   Progressive enhancement: without JS the beats read as a plain stack; with
   reduced motion the scene renders one still frame and nothing pins. */
(function () {
  "use strict";
  var root = document.getElementById("method");
  var stage = document.getElementById("bld-stage");
  var svg = root && root.querySelector(".bld-svg");
  if (!root || !stage || !svg) return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var VW = 1000, VH = 820;

  /* ---------- palette (cinema ground, site heat + verdigris) ---------- */
  var C = {
    top: "#2c3c48", left: "#1f2d38", right: "#17232c", edge: "#4a6374",
    win: "#2f4a58", winHot: "#e0a070", grid: "#2b3a45",
    unitTop: "#3a4f5e", unitL: "#2b3d4a", unitR: "#22313c", unitEdge: "#6a8597",
    heat: "#e0864e", heatHi: "#f1b07f", heatDeep: "#b4532a",
    verd: "#5fc7b7", verdHi: "#9be3d6"
  };

  /* ---------- math ---------- */
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v)); };
  var lerp = function (a, b, p) { return a + (b - a) * p; };
  var ease = {
    io: function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
    out: function (p) { return 1 - Math.pow(1 - p, 3); },
    back: function (p) { var c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
  };
  var prog = function (p, a, b, e) { var q = clamp((p - a) / (b - a)); return e ? ease[e](q) : q; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
  function mix(a, b, p) { var A = hex(a), B = hex(b); p = clamp(p); return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * p); }).join(",") + ")"; }

  /* ---------- iso helpers ---------- */
  var IC = Math.cos(Math.PI / 6);
  var P = function (x, y, z) { return [(x - y) * IC, (x + y) * 0.5 - (z || 0)]; };
  var pts = function (a) { return a.map(function (p) { var q = P(p[0], p[1], p[2]); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "); };
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function mkBox(parent, fills, stroke, sw) {
    var g = el("g", {}, parent), f = { g: g };
    f.left = el("polygon", { fill: fills[1], stroke: stroke, "stroke-width": sw || 1.4, "stroke-linejoin": "round" }, g);
    f.right = el("polygon", { fill: fills[2], stroke: stroke, "stroke-width": sw || 1.4, "stroke-linejoin": "round" }, g);
    f.top = el("polygon", { fill: fills[0], stroke: stroke, "stroke-width": sw || 1.4, "stroke-linejoin": "round" }, g);
    f.set = function (x, y, z, w, d, h) {
      f.top.setAttribute("points", pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]));
      f.left.setAttribute("points", pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]));
      f.right.setAttribute("points", pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]));
      return f;
    };
    f.fill = function (a, b, c) { f.top.setAttribute("fill", a); f.left.setAttribute("fill", b); f.right.setAttribute("fill", c); };
    return f;
  }

  /* ---------- facility archetypes ----------
     masses: extruded volumes, drawn in order. units: rooftop equipment, each
     sitting on mass m. peak: the demand column on the ground. */
  var U = function (x, y, m, kind) { return { x: x, y: y, m: m || 0, w: kind === "hood" ? 78 : 66, d: kind === "hood" ? 46 : 54, h: kind === "hood" ? 20 : 32, kind: kind || "rtu" }; };
  var FAC = {
    store: {
      oy: 500, masses: [{ x: -180, y: -130, z: 0, w: 360, d: 260, h: 150, win: "strip", nl: 6, nr: 4 }],
      units: [U(-160, -110), U(-60, -110), U(40, -110), U(-110, 0), U(-10, 0)],
      peak: { x: 250, y: 120 }, cab: { x: 230, y: -60 }
    },
    restaurant: {
      oy: 520, masses: [{ x: -150, y: -110, z: 0, w: 300, d: 220, h: 104, win: "strip", nl: 4, nr: 3 }],
      units: [U(-130, -92), U(-40, -92), U(50, -92), U(-120, 10, 0, "hood"), U(-20, 20)],
      peak: { x: 220, y: 110 }, cab: { x: 200, y: -50 }
    },
    tower: {
      oy: 600, masses: [
        { x: -200, y: -150, z: 0, w: 400, d: 300, h: 78, win: "strip", nl: 7, nr: 5 },
        { x: -170, y: -130, z: 78, w: 180, d: 150, h: 290, win: "floors", nl: 3, nr: 3 }
      ],
      units: [U(50, -130, 0), U(50, -50, 0), U(122, -90, 0), U(-170, 52, 0), U(-80, 52, 0), U(10, 52, 0)],
      peak: { x: 300, y: 50 }, cab: { x: 250, y: -60 }
    }
  };
  var q = new URLSearchParams(location.search).get("facility");
  var key = FAC[q] ? q : (FAC[root.getAttribute("data-facility")] ? root.getAttribute("data-facility") : "store");
  var F = FAC[key];
  root.setAttribute("data-facility", key);

  /* ---------- build the scene ---------- */
  svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
  svg.innerHTML =
    '<defs>' +
    '<radialGradient id="bld-gfade" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<mask id="bld-gmask" maskUnits="userSpaceOnUse" x="-700" y="-500" width="1400" height="1000"><ellipse cx="0" cy="0" rx="520" ry="300" fill="url(#bld-gfade)"/></mask>' +
    '<filter id="bld-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>' +
    '<linearGradient id="bld-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.verd + '" stop-opacity=".0"/><stop offset="1" stop-color="' + C.verd + '" stop-opacity=".35"/></linearGradient>' +
    '</defs>';
  var world = el("g", { transform: "translate(" + VW / 2 + "," + F.oy + ")" }, svg);

  // floor grid
  var grid = el("g", { mask: "url(#bld-gmask)", stroke: C.grid, "stroke-width": 1.2 }, world);
  for (var i = -9; i <= 9; i++) {
    var a = P(i * 60, -560), b = P(i * 60, 560);
    el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
    a = P(-560, i * 60); b = P(560, i * 60);
    el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
  }

  // ground shadow
  var bounds = F.masses.reduce(function (r, m) {
    return { x0: Math.min(r.x0, m.x), y0: Math.min(r.y0, m.y), x1: Math.max(r.x1, m.x + m.w), y1: Math.max(r.y1, m.y + m.d) };
  }, { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  var shadow = el("polygon", { fill: "rgba(3,7,10,.55)", filter: "url(#bld-soft)" }, world);
  shadow.setAttribute("points", pts([[bounds.x0 + 10, bounds.y0 + 10, 0], [bounds.x1 + 80, bounds.y0 + 10, 0], [bounds.x1 + 80, bounds.y1 + 40, 0], [bounds.x0 + 10, bounds.y1 + 40, 0]]));

  // service cabinet + feeder (distortion arrives on this line)
  var cab = mkBox(world, ["#34444f", "#26343e", "#1d2932"], C.edge, 1.2);
  var feedBase = el("path", { fill: "none", stroke: "#3a4b57", "stroke-width": 3, "stroke-linecap": "round" }, world);
  var feedPulse = el("path", { fill: "none", "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "10 18" }, world);

  // peak demand column (spikes on the peak beat, flattens on the fix, leaves a ghost)
  var peakG = el("g", {}, world);
  var peakBox = mkBox(peakG, [C.heatHi, C.heat, C.heatDeep], "rgba(255,255,255,.18)", 1);
  var peakGhost = el("polygon", { fill: "none", stroke: C.heatHi, "stroke-width": 1.5, "stroke-dasharray": "6 6" }, peakG);
  var peakLbl = el("text", { "class": "bld-tag", "text-anchor": "middle" }, peakG);
  peakLbl.textContent = "PEAK kW";

  // masses (+ windows), units interleaved in draw order
  var massEls = F.masses.map(function (m) {
    var g = el("g", {}, world);
    var box = mkBox(g, [C.top, C.left, C.right], C.edge);
    var wins = el("g", {}, g);
    var winL = [], winR = [];
    var nl = m.win === "floors" ? Math.floor(m.h / 30) : m.nl, nr = m.win === "floors" ? nl : m.nr;
    for (var k = 0; k < nl; k++) winL.push(el("polygon", { fill: C.win }, wins));
    for (k = 0; k < nr; k++) winR.push(el("polygon", { fill: C.win }, wins));
    return { m: m, g: g, box: box, wins: wins, winL: winL, winR: winR, uG: el("g", {}, world) };
  });
  var units = F.units.map(function (u) {
    var host = massEls[u.m].uG;
    var ug = el("g", {}, host);
    var bx = mkBox(ug, [C.unitTop, C.unitL, C.unitR], C.unitEdge, 1.2);
    var fan = u.kind === "rtu" ? el("ellipse", { fill: "#101820", stroke: C.unitEdge, "stroke-width": 1.2 }, ug) : null;
    var bl = u.kind === "rtu" ? el("path", { stroke: "#9fb6c6", "stroke-width": 2.6, "stroke-linecap": "round", fill: "none" }, ug) : null;
    return { u: u, ug: ug, bx: bx, fan: fan, bl: bl };
  });
  // a tower draws over the podium units behind it: move later masses' unit layers after their mass
  massEls.forEach(function (me) { world.appendChild(me.g); world.appendChild(me.uG); });
  // cabinet, feeder and the peak column stand in front of the building
  [cab.g, feedBase, feedPulse, peakG].forEach(function (n) { world.appendChild(n); });

  // heat shimmer over the rooftop units
  var shim = el("g", { fill: "none", "stroke-linecap": "round", stroke: C.heat, "stroke-width": 3, "stroke-dasharray": "18 14" }, world);
  var shimPaths = [];
  units.forEach(function (U, ui) { if (U.u.kind !== "rtu") return; for (var k = 0; k < 2; k++) shimPaths.push({ U: U, k: k, p: el("path", {}, shim) }); });

  // the overspend layer: a glowing shell per mass, clipped by the dissolve sweep
  var clip = el("clipPath", { id: "bld-hull-clip" }, svg.querySelector("defs"));
  var clipRect = el("rect", { x: -600, y: -700, width: 1200, height: 1600 }, clip);
  var hullWrap = el("g", { "clip-path": "url(#bld-hull-clip)" }, world);
  var hulls = F.masses.map(function (m) {
    var hb = mkBox(hullWrap, ["rgba(224,134,78,.12)", "rgba(224,134,78,.22)", "rgba(224,134,78,.16)"], C.heat, 2.2);
    var lines = el("g", { stroke: "rgba(241,176,127,.32)", "stroke-width": 1.5, fill: "none" }, hullWrap);
    for (var k = 1; k < 6; k++) el("polyline", {}, lines);
    return { m: m, hb: hb, lines: lines };
  });
  hullWrap.style.filter = "drop-shadow(0 0 18px rgba(224,134,78,.75))";
  var hullDims = function (m) { return [m.x - 14, m.y - 14, m.z, m.w + 28, m.d + 28, m.h + 46]; };

  // the exam's scan plane
  var scan = el("polygon", { fill: "url(#bld-scan)", stroke: C.verd, "stroke-width": 1.5, opacity: 0 }, world);

  // the clip-on meter, on the front face
  var mBase = F.masses[0];
  var mAt = P(mBase.x + mBase.w * 0.72, mBase.y + mBase.d, 26);
  var meterWrap = el("g", { transform: "translate(" + mAt[0].toFixed(1) + "," + mAt[1].toFixed(1) + ")" }, world);
  var meter = el("g", {}, meterWrap);
  var face = el("g", { transform: "matrix(0.866,0.5,0,1,0,0)" }, meter);
  el("rect", { x: -4, y: -62, width: 56, height: 70, rx: 9, fill: "#0f1a21", stroke: C.verd, "stroke-width": 2.4 }, face);
  el("rect", { x: 5, y: -53, width: 38, height: 26, rx: 4, fill: "#081116" }, face);
  var trace = el("polyline", { points: "8,-40 15,-40 18,-49 22,-33 26,-47 30,-40 40,-40", fill: "none", stroke: C.verd, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, face);
  el("circle", { cx: 24, cy: -10, r: 6.5, fill: "none", stroke: C.verd, "stroke-width": 2 }, face);
  el("path", { d: "M12 -62 V-72 H36 V-62", fill: "none", stroke: "#9fb6c6", "stroke-width": 3, "stroke-linecap": "round" }, face);
  var rings = [0, 1, 2].map(function () { return el("circle", { cx: 20, cy: 4, r: 6, fill: "none", stroke: C.verd, "stroke-width": 2, opacity: 0 }, meterWrap); });
  meter.style.filter = "drop-shadow(0 0 10px rgba(95,199,183,.55))";

  /* ---------- particles (canvas over the svg) ---------- */
  var cvs = root.querySelector(".bld-fx");
  var ctx = cvs && cvs.getContext ? cvs.getContext("2d") : null;
  var small = matchMedia("(max-width: 860px)").matches;
  var N = small ? 420 : 900;
  var parts = [];
  (function seed() {
    var r = rng(20260710);
    var areas = F.masses.map(function (m) { return m.w * m.d + (m.w + m.d) * (m.h + 46); });
    var tot = areas.reduce(function (s, v) { return s + v; }, 0);
    for (var n = 0; n < N; n++) {
      var pick = r() * tot, mi = 0;
      while (pick > areas[mi] && mi < areas.length - 1) { pick -= areas[mi]; mi++; }
      var h = hullDims(F.masses[mi]), f = r(), p;
      if (f < 0.3) p = P(h[0] + r() * h[3], h[1] + r() * h[4], h[2] + h[5]);
      else if (f < 0.68) p = P(h[0] + r() * h[3], h[1] + h[4], h[2] + r() * h[5]);
      else p = P(h[0] + h[3], h[1] + r() * h[4], h[2] + r() * h[5]);
      parts.push({ x: p[0], y: p[1], vx: (r() - 0.5) * 120, vy: -(70 + r() * 200), s: 0.8 + r() * 1.8, ph: r() * 6.28, j: r() * 0.08 });
    }
  })();
  var yTop = Math.min.apply(null, parts.map(function (o) { return o.y; }));
  var yBot = Math.max.apply(null, parts.map(function (o) { return o.y; }));
  parts.forEach(function (o) { o.delay = 0.55 * (o.y - yTop) / (yBot - yTop || 1) + o.j; });

  var cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oyc = 0;
  function sizeCanvas() {
    if (!ctx) return;
    var r = svg.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    cvs.width = Math.round(cw * dpr); cvs.height = Math.round(ch * dpr);
    sc = Math.min(cw / VW, ch / VH);
    ox = (cw - VW * sc) / 2 + (VW / 2) * sc;
    oyc = (ch - VH * sc) / 2 + F.oy * sc;
  }
  function drawParticles(D, t) {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    if (D <= 0 || D >= 1.6) return;
    for (var n = 0; n < parts.length; n++) {
      var o = parts[n], k = clamp((D - o.delay) / 0.45);
      if (k <= 0 || k >= 1) continue;
      var e = ease.out(k);
      var x = ox + (o.x + o.vx * e + Math.sin(o.ph + t * 2 + k * 6) * 6 * k) * sc;
      var y = oyc + (o.y + o.vy * e) * sc;
      ctx.globalAlpha = (1 - k) * Math.min(1, k * 7);
      ctx.fillStyle = mix(C.heatHi, C.verdHi, k * 2.4);
      var s = o.s * (1 - k * 0.4) * Math.max(0.7, sc * 1.4);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- the timeline ----------
     beats:  0 build + meter on | 1 cooling | 2 peak | 3 distortion | 4 the fix */
  var WIN = [[0, 0.16], [0.16, 0.36], [0.36, 0.55], [0.55, 0.74], [0.74, 1.01]];
  var beats = [].slice.call(root.querySelectorAll(".bld-beat"));
  var rail = [].slice.call(root.querySelectorAll(".bld-rail i"));
  var hud = {};
  [].slice.call(root.querySelectorAll("[data-hud]")).forEach(function (n) { hud[n.getAttribute("data-hud")] = n; });
  var sigPath = root.querySelector(".bld-sig path");
  var lastBeat = -1, lastHud = "";

  // the incoming-power trace: dirty when distortion is found, clean after the fix
  var SN = 64, sx = [], sd = [], scl = [];
  (function () {
    var hsh = function (i) { var s = Math.sin(i * 12.9898) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
    for (var i = 0; i <= SN; i++) { sx.push(i / SN * 240); sd.push(hsh(i)); scl.push(Math.sin(i / SN * Math.PI * 2 * 4)); }
  })();
  function drawSignal(dirt, clean) {
    if (!sigPath) return;
    var d = "";
    for (var i = 0; i <= SN; i++) {
      var y = 14 + 9 * lerp(scl[i] * (0.55 + 0.45 * (1 - dirt)) + sd[i] * dirt * 0.9, scl[i], clean);
      d += (i ? "L" : "M") + sx[i].toFixed(1) + " " + y.toFixed(2);
    }
    sigPath.setAttribute("d", d);
    sigPath.setAttribute("stroke", clean > 0.5 ? C.verd : mix("#7f97a6", C.heat, dirt));
  }

  function setHud(state) {
    if (state === lastHud) return;
    lastHud = state;
    var s = state.split("|");
    ["cool", "peak", "dist"].forEach(function (k, i) {
      var n = hud[k]; if (!n) return;
      n.setAttribute("data-state", s[i]);
      var v = n.querySelector(".v");
      if (v) v.textContent = s[i] === "found" ? "Overspend" : s[i] === "fixed" ? "Recovered" : s[i] === "scan" ? "Measuring" : "Not measured";
    });
  }

  function render(p, t) {
    // beat + rail
    var b = 0;
    for (var i = WIN.length - 1; i >= 0; i--) { if (p >= WIN[i][0]) { b = i; break; } }
    if (b !== lastBeat) {
      beats.forEach(function (el, k) { el.classList.toggle("on", k === b); });
      root.setAttribute("data-beat", b);
      lastBeat = b;
    }
    rail.forEach(function (r, k) { r.style.setProperty("--f", clamp((p - WIN[k][0]) / (Math.min(1, WIN[k][1]) - WIN[k][0])).toFixed(3)); });

    // story channels
    var build = prog(p, 0.0, 0.1, "io");
    var meterIn = prog(p, 0.1, 0.14, "back");
    var cool = prog(p, 0.17, 0.26, "out");
    var pk = prog(p, 0.37, 0.45, "out");
    var dist = prog(p, 0.56, 0.64, "out");
    var D = prog(p, 0.76, 0.93);             // dissolve
    var fix = prog(p, 0.76, 0.9, "io");
    var waste = Math.max(cool * 0.5, pk * 0.72, dist) * (1 - prog(p, 0.9, 0.95));
    var heat = cool * (1 - fix);
    var dirt = dist * (1 - fix);
    var scanZ = prog(p, 0.1, 0.17);          // the exam sweeps once as the meter goes on

    var breathe = 0.5 + 0.5 * Math.sin(t * 2.6);
    var k = heat * (0.45 + 0.55 * breathe);

    // masses + windows
    massEls.forEach(function (me, mi) {
      var m = me.m, n = F.masses.length;
      var mp = clamp((build - mi * (0.55 / n)) / (1 - 0.55 * (n - 1) / n));
      var h = Math.max(0.5, m.h * ease.out(mp));
      me.cur = h;
      me.box.set(m.x, m.y, m.z, m.w, m.d, h);
      me.g.setAttribute("opacity", mp > 0 ? 1 : 0);
      var wv = clamp((h - 40) / 40);
      me.wins.setAttribute("opacity", wv);
      var winFill = mix(C.win, C.winHot, heat * 0.35 * breathe);
      if (m.win === "floors") {
        // ribbon windows: one band per finished floor, on both faces
        me.winL.forEach(function (w, j) {
          var za = m.z + 12 + j * 30, zb = za + 14, show = zb < m.z + h - 6;
          w.setAttribute("points", show ? pts([[m.x + 10, m.y + m.d, za], [m.x + m.w - 10, m.y + m.d, za], [m.x + m.w - 10, m.y + m.d, zb], [m.x + 10, m.y + m.d, zb]]) : "");
          w.setAttribute("fill", winFill);
        });
        me.winR.forEach(function (w, j) {
          var za = m.z + 12 + j * 30, zb = za + 14, show = zb < m.z + h - 6;
          w.setAttribute("points", show ? pts([[m.x + m.w, m.y + 10, za], [m.x + m.w, m.y + m.d - 10, za], [m.x + m.w, m.y + m.d - 10, zb], [m.x + m.w, m.y + 10, zb]]) : "");
          w.setAttribute("fill", winFill);
        });
      } else {
        var za2 = m.z + 20, zb2 = Math.max(za2 + 2, m.z + h - 22);
        var stepL = (m.w - 30) / m.nl, stepR = (m.d - 30) / m.nr;
        me.winL.forEach(function (w, j) { var xa = m.x + 18 + j * stepL, xb = xa + stepL * 0.66; w.setAttribute("points", pts([[xa, m.y + m.d, za2], [xb, m.y + m.d, za2], [xb, m.y + m.d, zb2], [xa, m.y + m.d, zb2]])); w.setAttribute("fill", winFill); });
        me.winR.forEach(function (w, j) { var ya = m.y + 18 + j * stepR, yb = ya + stepR * 0.66; w.setAttribute("points", pts([[m.x + m.w, ya, za2], [m.x + m.w, yb, za2], [m.x + m.w, yb, zb2], [m.x + m.w, ya, zb2]])); w.setAttribute("fill", winFill); });
      }
    });

    // rooftop units
    var fanSpeed = 1.4 + 6 * heat + 2 * pk * (1 - fix) - 0.8 * fix;
    var surge = pk * (1 - fix) * (0.5 + 0.5 * Math.sin(t * 9));
    units.forEach(function (U, ui) {
      var u = U.u, me = massEls[u.m];
      var top = me.m.z + me.cur;
      var us = clamp((me.cur - me.m.h * 0.85) / (me.m.h * 0.15));
      var uh = Math.max(0.5, u.h * us);
      U.ug.setAttribute("opacity", us > 0.01 ? 1 : 0);
      U.bx.set(u.x, u.y, top, u.w, u.d, uh);
      var kk = clamp(k + surge * 0.35);
      U.bx.fill(mix(C.unitTop, C.heatHi, kk), mix(C.unitL, C.heat, kk), mix(C.unitR, C.heatDeep, kk));
      U.ug.style.filter = kk > 0.03 ? "drop-shadow(0 0 " + (5 + 16 * kk).toFixed(1) + "px rgba(224,134,78," + (0.85 * kk).toFixed(2) + "))" : "none";
      if (!U.fan) return;
      var cx = u.x + u.w / 2, cy = u.y + u.d / 2, z = top + uh, r = 16;
      var c = P(cx, cy, z);
      U.fan.setAttribute("cx", c[0]); U.fan.setAttribute("cy", c[1]);
      U.fan.setAttribute("rx", r * 1.2247 * us); U.fan.setAttribute("ry", r * 0.7071 * us);
      var ang = t * fanSpeed + ui * 1.3, dstr = "";
      for (var bb = 0; bb < 3; bb++) { var aa = ang + bb * 2.094; var qq = P(cx + Math.cos(aa) * r * 0.9, cy + Math.sin(aa) * r * 0.9, z); dstr += "M" + c[0].toFixed(1) + "," + c[1].toFixed(1) + "L" + qq[0].toFixed(1) + "," + qq[1].toFixed(1); }
      U.bl.setAttribute("d", us > 0.3 ? dstr : "");
      U.bl.setAttribute("stroke", fix > 0.5 ? mix("#9fb6c6", C.verdHi, fix) : mix("#9fb6c6", "#ffd9c2", kk));
    });

    // heat shimmer
    shim.setAttribute("opacity", (heat * 0.7).toFixed(3));
    shim.setAttribute("stroke-dashoffset", (t * 70).toFixed(1));
    if (heat > 0.01) {
      shimPaths.forEach(function (sp) {
        var u = sp.U.u, me = massEls[u.m];
        var base = P(u.x + 20 + sp.k * 26, u.y + u.d / 2, me.m.z + me.cur + u.h);
        var s = "";
        for (var j = 0; j <= 12; j++) {
          var yy = base[1] - j * 9;
          var xx = base[0] + Math.sin(j * 0.75 - t * 5 + sp.k * 2 + u.x) * (2.5 + j * 0.55);
          s += (j ? "L" : "M") + xx.toFixed(1) + "," + yy.toFixed(1);
        }
        sp.p.setAttribute("d", s);
      });
    }

    // cabinet + feeder
    var c0 = F.cab, cabOn = clamp(build * 1.4 - 0.3);
    cab.set(c0.x, c0.y, 0, 34, 28, 46 * ease.out(cabOn) + 0.5);
    cab.g.setAttribute("opacity", cabOn > 0 ? 1 : 0);
    var fa = P(c0.x, c0.y + 14, 6), fb = P(bounds.x1, c0.y + 14, 6);
    var fd = "M" + fa[0].toFixed(1) + "," + fa[1].toFixed(1) + "L" + fb[0].toFixed(1) + "," + fb[1].toFixed(1);
    feedBase.setAttribute("d", fd); feedPulse.setAttribute("d", fd);
    feedBase.setAttribute("opacity", cabOn);
    var live = Math.max(dirt, fix);
    feedPulse.setAttribute("opacity", (live * cabOn).toFixed(3));
    feedPulse.setAttribute("stroke", fix > 0.5 ? C.verd : C.heat);
    feedPulse.setAttribute("stroke-dashoffset", (t * (fix > 0.5 ? 40 : 120)).toFixed(1));
    feedPulse.style.filter = dirt > 0.05 ? "drop-shadow(0 0 6px rgba(224,134,78,.9))" : "drop-shadow(0 0 5px rgba(95,199,183,.7))";

    // peak column: rises on the peak beat, flattens on the fix, leaves its ghost
    var pkH = 30 + 250 * pk * (0.92 + 0.08 * Math.sin(t * 7)) * (1 - 0.55 * fix);
    var pp = F.peak, peakVis = clamp(build * 1.6 - 0.6);
    peakG.setAttribute("opacity", peakVis.toFixed(3));
    peakBox.set(pp.x, pp.y, 0, 30, 30, pkH);
    peakBox.fill(mix("#6d8494", C.heatHi, pk * (1 - fix)), mix("#4d6271", C.heat, pk * (1 - fix)), mix("#3d505d", C.heatDeep, pk * (1 - fix)));
    if (fix > 0.5) peakBox.fill(mix(C.heatHi, C.verdHi, fix), mix(C.heat, C.verd, fix), mix(C.heatDeep, "#3f8f84", fix));
    var gh = 30 + 250 * pk;
    peakGhost.setAttribute("points", pts([[pp.x, pp.y, gh], [pp.x + 30, pp.y, gh], [pp.x + 30, pp.y + 30, gh], [pp.x, pp.y + 30, gh]]));
    peakGhost.setAttribute("opacity", (fix * 0.9).toFixed(3));
    var lp = P(pp.x + 15, pp.y + 15, Math.max(pkH, gh * fix) + 22);
    peakLbl.setAttribute("x", lp[0].toFixed(1)); peakLbl.setAttribute("y", lp[1].toFixed(1));
    peakLbl.setAttribute("opacity", (clamp(pk * 2) * peakVis).toFixed(3));

    // the overspend shell
    var jit = dirt > 0.02 ? (Math.floor(t * 14) % 2 ? 1 : -1) * dirt * 2.5 * (Math.sin(t * 31) > 0.2 ? 1 : 0) : 0;
    hulls.forEach(function (H, hi) {
      var me = massEls[hi], hd = hullDims(H.m);
      var hh = (me.cur / H.m.h) * hd[5];
      H.hb.set(hd[0], hd[1], hd[2], hd[3], hd[4], Math.max(0.5, hh));
      var ls = H.lines.children;
      for (var j = 0; j < ls.length; j++) {
        var zz = hd[2] + (j + 1) / 6 * hh;
        ls[j].setAttribute("points", pts([[hd[0], hd[1] + hd[4], zz], [hd[0] + hd[3], hd[1] + hd[4], zz], [hd[0] + hd[3], hd[1], zz]]));
      }
    });
    hullWrap.setAttribute("opacity", (waste * (0.78 + 0.22 * breathe)).toFixed(3));
    hullWrap.setAttribute("transform", "translate(" + jit.toFixed(2) + ",0)");
    clipRect.setAttribute("y", lerp(yTop - 40, yBot + 40, clamp(D / 0.55)).toFixed(1));

    // scan plane, rising through the building as the meter goes on
    if (scanZ > 0 && scanZ < 1) {
      var tz = F.masses.reduce(function (s, m) { return Math.max(s, m.z + m.h); }, 0) + 20;
      var z = scanZ * tz, sm = F.masses[0];
      for (var mi2 = F.masses.length - 1; mi2 >= 0; mi2--) { if (z >= F.masses[mi2].z) { sm = F.masses[mi2]; break; } }
      scan.setAttribute("points", pts([[sm.x - 16, sm.y - 16, z], [sm.x + sm.w + 16, sm.y - 16, z], [sm.x + sm.w + 16, sm.y + sm.d + 16, z], [sm.x - 16, sm.y + sm.d + 16, z]]));
      scan.setAttribute("opacity", (Math.sin(scanZ * Math.PI) * 0.9).toFixed(3));
    } else scan.setAttribute("opacity", 0);

    // meter
    meterWrap.setAttribute("opacity", clamp(meterIn * 3).toFixed(3));
    meter.setAttribute("transform", "translate(0," + ((1 - meterIn) * -70).toFixed(1) + ")");
    trace.setAttribute("transform", "translate(0," + (dirt * Math.sin(t * 23) * 2).toFixed(2) + ")");
    var pinging = meterIn > 0.9 && fix < 1;
    rings.forEach(function (rg, j) {
      if (!pinging) { rg.setAttribute("opacity", 0); return; }
      var ph = ((t * 0.7 + j / 3) % 1);
      rg.setAttribute("r", (6 + ph * 34).toFixed(1));
      rg.setAttribute("opacity", ((1 - ph) * 0.7).toFixed(3));
      rg.setAttribute("stroke", dirt > 0.3 ? C.heat : C.verd);
    });

    // hud + signal
    var st = function (found) { return fix > 0.5 ? "fixed" : found > 0.5 ? "found" : meterIn > 0.5 ? "scan" : "off"; };
    setHud(st(cool) + "|" + st(pk) + "|" + st(dist));
    drawSignal(dirt, fix);
    root.style.setProperty("--bld-fix", fix.toFixed(3));

    drawParticles(D, t);
  }

  /* ---------- drive ---------- */
  root.classList.add("bld-live");
  sizeCanvas();
  addEventListener("resize", function () { sizeCanvas(); kick(); }, { passive: true });

  if (reduced) {
    root.classList.add("bld-still");
    beats.forEach(function (el) { el.classList.add("on"); });
    render(0.68, 0);             // all three found, meter on: the honest still
    return;
  }

  function progress() {
    var r = stage.getBoundingClientRect(), span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }
  var visible = false, raf = 0, t0 = performance.now(), html = document.documentElement;
  function frame(now) {
    raf = 0;
    var p = progress();
    html.classList.toggle("bld-pinned", visible && p > 0 && p < 1);
    render(p, (now - t0) / 1000);
    if (visible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { sizeCanvas(); kick(); } else html.classList.remove("bld-pinned");
    }, { rootMargin: "100px 0px" }).observe(stage);
  } else { visible = true; }
  addEventListener("scroll", kick, { passive: true });
  render(progress(), 0);
})();
