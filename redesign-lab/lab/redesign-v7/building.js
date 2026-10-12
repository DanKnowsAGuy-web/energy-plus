/* Energy+ · redesign v4 · the building in the pinned bill scene
   Folds the isometric building from the motion ad into chapter 1. It does not
   own any scroll logic: v2.js fires "v2:chapter" on the pin section with the
   active chapter (-1 before the first, 0 price, 1 peak, 2 equipment), the same
   moment the bill card changes. Each step lights its part of the building, fixes
   it, and dissolves a third of the ochre overspend shell. Scrolling back
   rebuilds it.

   Desktop only (980px+), where the media column pins. Below that, and with
   reduced motion or ?static, the page keeps v3's per-chapter illustrations;
   reduced/static renders the fixed building as a still.

   Facility: data-facility on .v4-scene = store | restaurant | tower
   (?facility=... overrides, for previews). */
(() => {
  "use strict";
  const scene = document.querySelector(".v4-scene");
  const pin = document.querySelector("[data-pin-scene]");
  const svg = scene && scene.querySelector(".v4-scene__svg");
  if (!scene || !pin || !svg) return;

  const qs = new URLSearchParams(location.search);
  const STILL = qs.has("static") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- palette: the live brand tokens ---------- */
  const C = {
    top: "#ffffff", left: "#e6ebee", right: "#d6dee2", edge: "#9fb3ba",
    win: "#c4d4d8", grid: "#d3d9dd",
    unitTop: "#f4f6f7", unitL: "#dfe5e8", unitR: "#cdd6db", unitEdge: "#8ea3ab",
    petrol: "#174e58", petrol2: "#1f5c67",
    ochre: "#e0a21c", ochreHi: "#f0c45e", ochreDeep: "#b8820f", ochreInk: "#5a3f00"
  };

  /* ---------- small helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const mix = (a, b, p) => { const A = hex(a), B = hex(b); p = clamp(p); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(",") + ")"; };
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const IC = Math.cos(Math.PI / 6);
  const P = (x, y, z = 0) => [(x - y) * IC, (x + y) * 0.5 - z];
  const pts = (a) => a.map((p) => { const q = P(p[0], p[1], p[2]); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ");
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function mkBox(parent, fills, stroke, sw = 1.4) {
    const g = el("g", {}, parent);
    const f = { g };
    f.left = el("polygon", { fill: fills[1], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    f.right = el("polygon", { fill: fills[2], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    f.top = el("polygon", { fill: fills[0], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    f.set = (x, y, z, w, d, h) => {
      f.top.setAttribute("points", pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]));
      f.left.setAttribute("points", pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]));
      f.right.setAttribute("points", pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]));
      return f;
    };
    f.fill = (a, b, c) => { f.top.setAttribute("fill", a); f.left.setAttribute("fill", b); f.right.setAttribute("fill", c); };
    return f;
  }

  /* ---------- facility archetypes ---------- */
  const U = (x, y, m = 0) => ({ x, y, m, w: 64, d: 52, h: 30 });
  const FAC = {
    store: {
      vb: [-320, -370, 640, 590], masses: [{ x: -180, y: -130, z: 0, w: 360, d: 260, h: 130, nl: 6, nr: 4 }],
      units: [U(-160, -110), U(-60, -110), U(40, -110), U(-110, -5), U(-10, -5)],
      peak: { x: 250, y: 120 }, cab: { x: 240, y: -70 }
    },
    restaurant: {
      vb: [-290, -300, 580, 520], masses: [{ x: -150, y: -110, z: 0, w: 300, d: 220, h: 96, nl: 4, nr: 3 }],
      units: [U(-130, -92), U(-40, -92), U(50, -92), U(-90, 10)],
      peak: { x: 220, y: 110 }, cab: { x: 210, y: -60 }
    },
    tower: {
      vb: [-340, -530, 680, 770], masses: [
        { x: -200, y: -150, z: 0, w: 400, d: 300, h: 70, nl: 7, nr: 5 },
        { x: -170, y: -130, z: 70, w: 180, d: 150, h: 240, floors: true }
      ],
      units: [U(50, -130), U(50, -50), U(124, -90), U(-170, 56), U(-80, 56), U(10, 56)],
      peak: { x: 300, y: 40 }, cab: { x: 260, y: -90 }
    }
  };
  const key = FAC[qs.get("facility")] ? qs.get("facility") : (FAC[scene.dataset.facility] ? scene.dataset.facility : "store");
  const F = FAC[key];

  /* ---------- build the drawing ---------- */
  svg.setAttribute("viewBox", F.vb.join(" "));
  svg.innerHTML =
    '<defs>' +
    '<radialGradient id="v4-gfade" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<mask id="v4-gmask" maskUnits="userSpaceOnUse" x="-700" y="-500" width="1400" height="1000"><ellipse cx="0" cy="0" rx="500" ry="280" fill="url(#v4-gfade)"/></mask>' +
    '<filter id="v4-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>' +
    '</defs>';
  const world = el("g", {}, svg);

  const grid = el("g", { mask: "url(#v4-gmask)", stroke: C.grid, "stroke-width": 1.2 }, world);
  for (let i = -9; i <= 9; i++) {
    let a = P(i * 60, -560), b = P(i * 60, 560);
    el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
    a = P(-560, i * 60); b = P(560, i * 60);
    el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
  }
  const B = F.masses.reduce((r, m) => ({ x0: Math.min(r.x0, m.x), y0: Math.min(r.y0, m.y), x1: Math.max(r.x1, m.x + m.w), y1: Math.max(r.y1, m.y + m.d) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  el("polygon", { fill: "rgba(16,20,22,.16)", filter: "url(#v4-soft)", points: pts([[B.x0 + 10, B.y0 + 10, 0], [B.x1 + 70, B.y0 + 10, 0], [B.x1 + 70, B.y1 + 36, 0], [B.x0 + 10, B.y1 + 36, 0]]) }, world);

  // masses + windows (rooftop units live in a layer right after their mass)
  const masses = F.masses.map((m) => {
    const g = el("g", {}, world);
    const box = mkBox(g, [C.top, C.left, C.right], C.edge).set(m.x, m.y, m.z, m.w, m.d, m.h);
    const wins = el("g", { fill: C.win }, g);
    if (m.floors) {
      for (let z = m.z + 14; z + 14 < m.z + m.h - 8; z += 30) {
        el("polygon", { points: pts([[m.x + 12, m.y + m.d, z], [m.x + m.w - 12, m.y + m.d, z], [m.x + m.w - 12, m.y + m.d, z + 13], [m.x + 12, m.y + m.d, z + 13]]) }, wins);
        el("polygon", { points: pts([[m.x + m.w, m.y + 12, z], [m.x + m.w, m.y + m.d - 12, z], [m.x + m.w, m.y + m.d - 12, z + 13], [m.x + m.w, m.y + 12, z + 13]]) }, wins);
      }
    } else {
      const za = m.z + 18, zb = m.z + m.h - 20, sl = (m.w - 30) / m.nl, sr = (m.d - 30) / m.nr;
      for (let j = 0; j < m.nl; j++) { const xa = m.x + 18 + j * sl, xb = xa + sl * 0.62; el("polygon", { points: pts([[xa, m.y + m.d, za], [xb, m.y + m.d, za], [xb, m.y + m.d, zb], [xa, m.y + m.d, zb]]) }, wins); }
      for (let j = 0; j < m.nr; j++) { const ya = m.y + 18 + j * sr, yb = ya + sr * 0.62; el("polygon", { points: pts([[m.x + m.w, ya, za], [m.x + m.w, yb, za], [m.x + m.w, yb, zb], [m.x + m.w, ya, zb]]) }, wins); }
    }
    return { m, g, box, uG: el("g", {}, world) };
  });
  const units = F.units.map((u) => {
    const mm = F.masses[u.m], top = mm.z + mm.h;
    const ug = el("g", {}, masses[u.m].uG);
    const bx = mkBox(ug, [C.unitTop, C.unitL, C.unitR], C.unitEdge, 1.2).set(u.x, u.y, top, u.w, u.d, u.h);
    const c = P(u.x + u.w / 2, u.y + u.d / 2, top + u.h);
    const fan = el("ellipse", { cx: c[0], cy: c[1], rx: 15 * 1.2247, ry: 15 * 0.7071, fill: "#eef2f3", stroke: C.unitEdge, "stroke-width": 1.2 }, ug);
    const bl = el("path", { stroke: C.petrol, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none" }, ug);
    return { u, top, ug, bx, fan, bl, cx: u.x + u.w / 2, cy: u.y + u.d / 2 };
  });
  masses.forEach((me) => { world.appendChild(me.g); world.appendChild(me.uG); });

  // heat shimmer over the units
  const shim = el("g", { fill: "none", "stroke-linecap": "round", stroke: C.ochre, "stroke-width": 2.6, "stroke-dasharray": "16 12" }, world);
  const shimPaths = [];
  units.forEach((U2) => { for (let k = 0; k < 2; k++) shimPaths.push({ U: U2, k, p: el("path", {}, shim) }); });

  // price: utility cabinet + the feeder into the building, with the rate on a pill
  const cab = mkBox(world, ["#f4f6f7", "#dde4e7", "#cbd5da"], C.edge, 1.2).set(F.cab.x, F.cab.y, 0, 34, 28, 48);
  const fa = P(F.cab.x, F.cab.y + 14, 5), fb = P(B.x1, F.cab.y + 14, 5);
  const feedD = `M${fa[0].toFixed(1)},${fa[1].toFixed(1)}L${fb[0].toFixed(1)},${fb[1].toFixed(1)}`;
  el("path", { d: feedD, fill: "none", stroke: "#c3cfd4", "stroke-width": 3.5, "stroke-linecap": "round" }, world);
  const feed = el("path", { d: feedD, fill: "none", "stroke-width": 3.5, "stroke-linecap": "round", "stroke-dasharray": "9 14" }, world);
  const cabTop = P(F.cab.x + 17, F.cab.y + 14, 48);
  const rate = pill(world, cabTop[0], cabTop[1] - 40, 168);

  // peak: the demand column, with the ceiling it gets held to
  const peakG = el("g", {}, world);
  const peakBox = mkBox(peakG, [C.ochreHi, C.ochre, C.ochreDeep], "rgba(16,20,22,.12)", 1);
  const ceil = el("polygon", { fill: "none", stroke: C.petrol, "stroke-width": 2, "stroke-dasharray": "6 5" }, peakG);
  const kw = pill(peakG, 0, 0, 100);

  // the overspend shell: three stacked bands, one per cost (top: price, middle: peak, bottom: equipment)
  const mTop = Math.max(...F.masses.map((m) => m.z + m.h)) + 44;
  const hullG = el("g", {}, world);
  const bands = [2, 1, 0].map((slot) => {
    const g = el("g", {}, hullG);
    const z0 = (slot / 3) * mTop, z1 = ((slot + 1) / 3) * mTop;
    const boxes = F.masses.filter((m) => m.z < z1 && m.z + m.h + 44 > z0).map((m) => {
      const lo = Math.max(z0, m.z), hi = Math.min(z1, m.z + m.h + 44);
      const b = mkBox(g, ["rgba(224,162,28,.10)", "rgba(224,162,28,.20)", "rgba(224,162,28,.14)"], C.ochre, 1.8);
      b.set(m.x - 14, m.y - 14, lo, m.w + 28, m.d + 28, Math.max(0.5, hi - lo));
      return b;
    });
    return { g, boxes, z0, z1 };
  });
  hullG.style.filter = "drop-shadow(0 0 14px rgba(224,162,28,.55))";

  function pill(parent, x, y, w) {
    const g = el("g", { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, parent);
    const r = el("rect", { x: -w / 2, y: -17, width: w, height: 34, rx: 17 }, g);
    const t = el("text", { x: 0, y: 7, "text-anchor": "middle", "font-family": "Geist Mono, ui-monospace, monospace", "font-weight": 700, "font-size": 19 }, g);
    return { g, r, t, set(text, bg, fg) { t.textContent = text; r.setAttribute("fill", bg); t.setAttribute("fill", fg); } };
  }

  /* ---------- particles: each band leaves as ochre dust that cools to petrol ---------- */
  const cvs = scene.querySelector(".v4-scene__fx");
  const ctx = cvs && cvs.getContext ? cvs.getContext("2d") : null;
  const parts = [[], [], []];
  (() => {
    const r = rng(20261011);
    const per = 260;
    bands.forEach((band, bi) => {
      const ms = F.masses.filter((m) => m.z < band.z1 && m.z + m.h + 44 > band.z0);
      for (let n = 0; n < per; n++) {
        const m = ms[Math.floor(r() * ms.length)];
        const lo = Math.max(band.z0, m.z), hi = Math.min(band.z1, m.z + m.h + 44);
        const hx = m.x - 14, hy = m.y - 14, hw = m.w + 28, hd = m.d + 28;
        const f = r(); let p;
        if (f < 0.25 && bi === 0) p = P(hx + r() * hw, hy + r() * hd, hi);
        else if (f < 0.62) p = P(hx + r() * hw, hy + hd, lo + r() * (hi - lo));
        else p = P(hx + hw, hy + r() * hd, lo + r() * (hi - lo));
        parts[bi].push({ x: p[0], y: p[1], vx: (r() - 0.5) * 110, vy: -(60 + r() * 170), s: 1 + r() * 1.8, ph: r() * 6.28, delay: r() * 0.35 });
      }
    });
  })();

  let cw = 0, ch = 0, dpr = 1, sc = 1, ox = 0, oy = 0;
  function size() {
    if (!ctx) return;
    const r = svg.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    cvs.width = Math.round(cw * dpr); cvs.height = Math.round(ch * dpr);
    const [vx, vy, vw, vh] = F.vb;
    sc = Math.min(cw / vw, ch / vh);
    ox = (cw - vw * sc) / 2 - vx * sc;
    oy = (ch - vh * sc) / 2 - vy * sc;
  }

  /* ---------- state: tweened numbers, rendered every frame while on screen ---------- */
  // one object per cost (0 price, 1 peak, 2 equipment): f = fixed (0..1), g = in focus (0..1)
  const S = [{ f: 0, g: 0 }, { f: 0, g: 0 }, { f: 0, g: 0 }];

  // v7: the shaved peak over the fix (f 0..1): drop past the ceiling, rise into it, bounce, settle at 140
  const PK = [[0, 250], [0.55, 128], [0.7, 150], [0.82, 135], [0.91, 144], [1, 140]];
  function peakCurve(f) {
    for (let i = 1; i < PK.length; i++) {
      if (f <= PK[i][0]) {
        const k = (f - PK[i - 1][0]) / (PK[i][0] - PK[i - 1][0]);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        return PK[i - 1][1] + (PK[i][1] - PK[i - 1][1]) * e;
      }
    }
    return 140;
  }

  function render(t) {
    const fP = S[0].f, fK = S[1].f, fE = S[2].f, gP = S[0].g, gK = S[1].g, gE = S[2].g;
    const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);

    // equipment: units warm until calibrated, then settle to petrol
    const heat = (1 - fE) * (0.35 + 0.65 * gE * breathe + 0.25 * breathe);
    units.forEach((U2, i) => {
      U2.bx.fill(mix(C.unitTop, C.ochreHi, heat * 0.85), mix(C.unitL, C.ochre, heat * 0.85), mix(C.unitR, C.ochreDeep, heat * 0.85));
      U2.ug.style.filter = heat > 0.05 ? `drop-shadow(0 0 ${(4 + 12 * heat).toFixed(1)}px rgba(224,162,28,${(0.7 * heat).toFixed(2)}))` : "none";
      const c = P(U2.cx, U2.cy, U2.top + U2.u.h), r = 13;
      const ang = t * (1.2 + 5 * (1 - fE)) + i * 1.3;
      let d = "";
      for (let b = 0; b < 3; b++) { const a = ang + b * 2.094; const q = P(U2.cx + Math.cos(a) * r, U2.cy + Math.sin(a) * r, U2.top + U2.u.h); d += `M${c[0].toFixed(1)},${c[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`; }
      U2.bl.setAttribute("d", d);
      U2.bl.setAttribute("stroke", mix(C.ochreDeep, C.petrol, fE));
    });
    shim.setAttribute("opacity", (heat * 0.75).toFixed(3));
    shim.setAttribute("stroke-dashoffset", (t * 60).toFixed(1));
    if (heat > 0.02) shimPaths.forEach((sp) => {
      const u = sp.U.u, base = P(u.x + 18 + sp.k * 26, u.y + u.d / 2, sp.U.top + u.h);
      let s = "";
      for (let j = 0; j <= 10; j++) { const yy = base[1] - j * 8, xx = base[0] + Math.sin(j * 0.75 - t * 5 + sp.k * 2 + u.x) * (2 + j * 0.5); s += (j ? "L" : "M") + xx.toFixed(1) + "," + yy.toFixed(1); }
      sp.p.setAttribute("d", s);
    });

    // price: the feeder runs ochre until the rate is reset
    feed.setAttribute("stroke", mix(C.ochre, C.petrol, fP));
    feed.setAttribute("stroke-dashoffset", (-t * (30 + 50 * (1 - fP))).toFixed(1));
    feed.setAttribute("opacity", (0.55 + 0.45 * Math.max(gP, fP)).toFixed(3));
    rate.set(fP > 0.5 ? "$0.0590 / kWh" : "$0.0650 / kWh", fP > 0.5 ? C.petrol : C.ochre, fP > 0.5 ? "#fff" : "#101416");
    rate.g.setAttribute("opacity", (0.55 + 0.45 * Math.max(gP, fP > 0.5 ? 1 : 0)).toFixed(3));

    // peak: 250 kW spike, held to a 150 kW ceiling once shaved
    const p = F.peak, unit = 0.8;
    // v7: the cut overshoots, the load rises into the ceiling, bounces off, settles under it;
    // while this chapter is in focus it surges into the ceiling now and then and gets held
    let kwNow = fK <= 0 ? 250 * (1 + 0.03 * Math.sin(t * 6)) : peakCurve(fK);
    if (fK >= 1) {
      const s = (t % 4.2) / 1.4;
      if (s < 1) kwNow += 10 * gK * (s < 0.4 ? Math.sin((s / 0.4) * Math.PI / 2) : Math.exp(-5 * (s - 0.4)) * Math.cos(9 * (s - 0.4)));
    }
    kwNow = Math.min(kwNow, fK > 0.5 ? 150 : 999);
    const hit = fK > 0.5 ? clamp((kwNow - 146) / 4) : 0;
    ceil.setAttribute("stroke-width", (2 + 2.6 * hit).toFixed(2));
    ceil.setAttribute("stroke", mix(C.petrol, C.ochre, hit * 0.85));
    const hNow = kwNow * unit;
    peakBox.set(p.x, p.y, 0, 28, 28, hNow);
    peakBox.fill(mix(C.ochreHi, "#2a6a75", fK), mix(C.ochre, C.petrol2, fK), mix(C.ochreDeep, C.petrol, fK));
    const hc = 150 * unit;
    ceil.setAttribute("points", pts([[p.x - 8, p.y - 8, hc], [p.x + 36, p.y - 8, hc], [p.x + 36, p.y + 36, hc], [p.x - 8, p.y + 36, hc]]));
    ceil.setAttribute("opacity", Math.max(gK, fK).toFixed(3));
    const lp = P(p.x + 14, p.y + 14, Math.max(hNow, hc) + 40);
    kw.g.setAttribute("transform", `translate(${lp[0].toFixed(1)},${lp[1].toFixed(1)})`);
    kw.set((fK > 0.5 ? 150 : Math.round(kwNow / 10) * 10) + " KW", fK > 0.5 ? C.petrol : C.ochre, fK > 0.5 ? "#fff" : "#101416");
    peakG.setAttribute("opacity", (0.6 + 0.4 * Math.max(gK, fK > 0.5 ? 1 : 0)).toFixed(3));

    // the shell: band k fades as cost k is fixed; a lower band shows its lid once the band above is gone
    bands.forEach((band, bi) => {
      const f = S[bi].f;
      band.g.setAttribute("opacity", (Math.pow(1 - f, 1.6) * (0.8 + 0.2 * breathe)).toFixed(3));
      const lid = bi === 0 ? 1 : S[bi - 1].f;
      band.boxes.forEach((b) => b.top.setAttribute("opacity", lid.toFixed(3)));
    });
    scene.style.setProperty("--v4-fixed", ((fP + fK + fE) / 3).toFixed(3));

    // particles
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    parts.forEach((list, bi) => {
      const D = S[bi].f;
      if (D <= 0.001 || D >= 0.999) return;
      for (const o of list) {
        const k = clamp((D - o.delay) / 0.6);
        if (k <= 0 || k >= 1) continue;
        const e = easeOut(k);
        const x = ox + (o.x + o.vx * e + Math.sin(o.ph + t * 2 + k * 6) * 5 * k) * sc;
        const y = oy + (o.y + o.vy * e) * sc;
        ctx.globalAlpha = (1 - k) * Math.min(1, k * 6);
        ctx.fillStyle = mix(C.ochre, C.petrol, k * 1.8);
        const s = o.s * Math.max(0.8, sc * 1.6);
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- drive ---------- */
  let visible = false, raf = 0;
  const t0 = performance.now();
  function frame(now) { raf = 0; render((now - t0) / 1000); if (visible) raf = requestAnimationFrame(frame); }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  scene.classList.add("is-live");
  size();
  addEventListener("resize", () => { size(); kick(); }, { passive: true });

  if (STILL) {
    S.forEach((c) => { c.f = 1; });
    render(0);
    return;
  }

  // chapter changes come from v2.js, in step with the bill card
  let active = -1;
  pin.addEventListener("v2:chapter", (e) => {
    const i = e.detail;
    if (i === active) return;
    const prev = active;
    active = i;
    if (!window.gsap) { S.forEach((c, k) => { c.f = k <= i ? 1 : 0; c.g = k === i ? 1 : 0; }); kick(); return; }
    S.forEach((c) => gsap.killTweensOf(c));
    S.forEach((c, k) => {
      if (k > i) gsap.to(c, { f: 0, g: 0, duration: 0.9, ease: "power2.inOut" });       // going back: the shell reassembles
      else if (k < i) gsap.to(c, { f: 1, g: 0, duration: 0.8, ease: "power2.out" });   // passed (or skipped on a fast scroll)
    });
    if (i >= 0) {
      const c = S[i];
      if (i > prev && c.f < 1) {
        // the active cost lights up, holds a beat, then gets fixed
        gsap.timeline().to(c, { g: 1, duration: 0.45, ease: "power2.out" })
          .to(c, i === 1 ? { f: 1, duration: 2.6, ease: "none" } : { f: 1, duration: 1.5, ease: "power2.inOut" }, "+=0.25");
      } else {
        gsap.to(c, { g: 1, f: 1, duration: 0.6 });
      }
    }
    kick();
  });

  // catch up if v2.js already picked a chapter before this listener existed
  const already = Array.from(pin.querySelectorAll(".v2-chapter")).findIndex((c) => c.classList.contains("is-active"));
  if (already > -1) pin.dispatchEvent(new CustomEvent("v2:chapter", { detail: already }));

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) { size(); kick(); } }, { rootMargin: "80px 0px" }).observe(scene);
  } else { visible = true; }
  render(0);
})();
