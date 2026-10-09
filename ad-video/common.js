/* Shared engine for every cut of the ad: easing and color helpers, isometric geometry,
   the commercial building, fitted type, film grain, camera shake and the render/preview boot. */
(() => {
"use strict";
const W = 1080, H = 1920, FPS = 30, BEAT = 0.5;
const GREEN = "#3DFF8A", RED = "#FF4D2E", NAVY = "#0A1A33";
const NS = "http://www.w3.org/2000/svg";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const easeCache = {};
const E = n => easeCache[n] || (easeCache[n] = gsap.parseEase(n));
const prog = (t, a, b, ease) => { const p = clamp((t - a) / (b - a)); return ease ? E(ease)(p) : p; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mixRGB = (a, b, p) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(v + (B[i] - v) * clamp(p))); };
const mix = (a, b, p) => `rgb(${mixRGB(a, b, p).join(",")})`;
const beatPulse = (t, decay = 0.16) => Math.exp(-((t % BEAT + BEAT) % BEAT) / decay);

/* ---------- SVG + iso helpers ---------- */
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const IC = Math.cos(Math.PI / 6);
const P = (x, y, z = 0) => [(x - y) * IC, (x + y) * 0.5 - z];
const pts = a => a.map(p => P(...p).map(v => v.toFixed(1)).join(",")).join(" ");
function boxFaces(x, y, z, w, d, h) {
  return {
    top: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]),
    left: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]),
    right: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])
  };
}
function mkBox(parent, fills, stroke, sw = 1.5) {
  const g = el("g", {}, parent), f = { g };
  f.left = el("polygon", { fill: fills[1], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
  f.right = el("polygon", { fill: fills[2], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
  f.top = el("polygon", { fill: fills[0], stroke, "stroke-width": sw, "stroke-linejoin": "round" }, g);
  f.set = (x, y, z, w, d, h) => { const F = boxFaces(x, y, z, w, d, h); f.top.setAttribute("points", F.top); f.left.setAttribute("points", F.left); f.right.setAttribute("points", F.right); return f; };
  f.fill = (a, b, c) => { f.top.setAttribute("fill", a); f.left.setAttribute("fill", b); f.right.setAttribute("fill", c); };
  return f;
}
const quad = (parent, arr, attrs) => el("polygon", { points: pts(arr), ...attrs }, parent);

/* ---------- Commercial building (scenes 1 and 4) ---------- */
class Building {
  constructor(parent, ox, oy) {
    this.ox = ox; this.oy = oy;
    this.w = 360; this.d = 260; this.H = 150; this.x0 = -180; this.y0 = -130;
    const g = this.g = el("g", { transform: `translate(${ox},${oy})` }, parent);
    const grid = el("g", { mask: "url(#gridMask)", stroke: "#1F4275", "stroke-width": 1.6 }, g);
    for (let i = -9; i <= 9; i++) {
      let a = P(i * 60, -560), b = P(i * 60, 560); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
      a = P(-560, i * 60); b = P(560, i * 60); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grid);
    }
    this.grid = grid;
    this.shadow = el("polygon", { fill: "rgba(1,6,16,.6)", filter: "url(#soft)" }, g);
    this.body = mkBox(g, ["#1F3D6E", "#162E57", "#102447"], "#3C67A6");
    this.wins = el("g", {}, g);
    this.winL = [...Array(6)].map(() => el("polygon", { fill: "#2E6AAB" }, this.wins));
    this.winR = [...Array(4)].map(() => el("polygon", { fill: "#255B95" }, this.wins));
    this.unitsG = el("g", {}, g);
    this.units = [[-160, -110], [-60, -110], [40, -110], [-110, 0], [-10, 0]].map(([x, y]) => {
      const ug = el("g", {}, this.unitsG);
      const b = mkBox(ug, ["#2E4D80", "#223F6B", "#1B3459"], "#5A80BE");
      const fan = el("ellipse", { fill: "#0B1A33", stroke: "#5A80BE", "stroke-width": 1.5 }, ug);
      const bl = el("path", { stroke: "#89AEE6", "stroke-width": 3, "stroke-linecap": "round", fill: "none" }, ug);
      return { x, y, w: 70, d: 56, h: 34, ug, b, fan, bl };
    });
    this.shim = el("g", { fill: "none", "stroke-linecap": "round", stroke: "#FF6A45", "stroke-width": 4, "stroke-dasharray": "22 16" }, g);
    this.shimPaths = [];
    this.units.forEach((u, ui) => { for (let k = 0; k < 2; k++) this.shimPaths.push({ u, k, ui, p: el("path", {}, this.shim) }); });
    this.hullWrap = el("g", {}, g);
    this.hullClip = el("clipPath", { id: "hc" + Math.round(ox + oy) }, g);
    this.hullClipRect = el("rect", { x: -500, y: -600, width: 1000, height: 1400 }, this.hullClip);
    this.hullWrap.setAttribute("clip-path", `url(#hc${Math.round(ox + oy)})`);
    this.hull = mkBox(this.hullWrap, ["rgba(255,77,46,.13)", "rgba(255,77,46,.24)", "rgba(255,77,46,.17)"], "#FF4D2E", 3);
    this.hullLines = el("g", { stroke: "rgba(255,110,80,.35)", "stroke-width": 2, fill: "none" }, this.hullWrap);
    for (let i = 1; i < 6; i++) el("polyline", {}, this.hullLines);
    this.hullWrap.style.filter = "drop-shadow(0 0 22px rgba(255,77,46,.85))";
    this.hullDims = () => [this.x0 - 18, this.y0 - 18, 0, this.w + 36, this.d + 36, this.H + 62];
  }
  update(t, { h = this.H, heat = 0, waste = 0, fan = 1, sweep = 0 } = {}) {
    const { x0, y0, w, d } = this;
    this.shadow.setAttribute("points", pts([[x0 + 10, y0 + 10, 0], [x0 + w + 90, y0 + 10, 0], [x0 + w + 90, y0 + d + 40, 0], [x0 + 10, y0 + d + 40, 0]]));
    this.shadow.setAttribute("opacity", clamp(h / this.H));
    this.body.set(x0, y0, 0, w, d, Math.max(h, 0.5));
    const wv = clamp((h - 70) / 50);
    this.wins.setAttribute("opacity", wv);
    const za = 26, zb = Math.max(za + 2, h - 30);
    this.winL.forEach((p, i) => { const xa = x0 + 22 + i * 57, xb = xa + 38; p.setAttribute("points", pts([[xa, y0 + d, za], [xb, y0 + d, za], [xb, y0 + d, zb], [xa, y0 + d, zb]])); });
    this.winR.forEach((p, i) => { const ya = y0 + 20 + i * 61, yb = ya + 40; p.setAttribute("points", pts([[x0 + w, ya, za], [x0 + w, yb, za], [x0 + w, yb, zb], [x0 + w, ya, zb]])); });
    const uScale = clamp((h - this.H * 0.82) / (this.H * 0.18));
    const pulse = beatPulse(t, 0.2);
    const k = heat * (0.42 + 0.58 * pulse);
    this.units.forEach((u, i) => {
      const uh = u.h * uScale;
      u.ug.setAttribute("opacity", uScale > 0.01 ? 1 : 0);
      u.b.set(u.x, u.y, h, u.w, u.d, Math.max(uh, 0.5));
      u.b.fill(mix("#2E4D80", "#FF6A45", k), mix("#223F6B", "#E0391C", k), mix("#1B3459", "#B92A12", k));
      const cx = u.x + u.w / 2, cy = u.y + u.d / 2, z = h + uh, r = 17;
      const c = P(cx, cy, z);
      u.fan.setAttribute("cx", c[0]); u.fan.setAttribute("cy", c[1]);
      u.fan.setAttribute("rx", r * 1.2247 * uScale); u.fan.setAttribute("ry", r * 0.7071 * uScale);
      const ang = t * (2.2 + 9 * fan) + i * 1.3;
      let dstr = "";
      for (let b = 0; b < 3; b++) { const a = ang + b * 2.094; const q = P(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, z); dstr += `M${c[0].toFixed(1)},${c[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`; }
      u.bl.setAttribute("d", uScale > 0.3 ? dstr : "");
      u.bl.setAttribute("stroke", mix("#89AEE6", "#FFD2C4", k));
      u.ug.style.filter = k > 0.02 ? `drop-shadow(0 0 ${(6 + 22 * k).toFixed(1)}px rgba(255,77,46,${(0.95 * k).toFixed(2)}))` : "none";
    });
    this.shim.setAttribute("opacity", (heat * 0.75 * uScale).toFixed(3));
    this.shim.setAttribute("stroke-dashoffset", (t * 95).toFixed(1));
    if (heat > 0.01) {
      this.shimPaths.forEach(sp => {
        const { u, k: kk } = sp;
        const base = P(u.x + 22 + kk * 26, u.y + u.d / 2, h + u.h);
        let s = "";
        for (let j = 0; j <= 14; j++) {
          const yy = base[1] - j * 10;
          const xx = base[0] + Math.sin(j * 0.75 - t * 7 + kk * 2 + u.x) * (3 + j * 0.6);
          s += (j ? "L" : "M") + xx.toFixed(1) + "," + yy.toFixed(1);
        }
        sp.p.setAttribute("d", s);
      });
    }
    const [hx, hy, hz, hw, hd, hh] = this.hullDims();
    this.hull.set(hx, hy, hz, hw, hd, h > 1 ? hh * (h / this.H) : 0.5);
    const lines = this.hullLines.children;
    for (let i = 0; i < lines.length; i++) {
      const zz = (i + 1) / 6 * hh * (h / this.H);
      lines[i].setAttribute("points", pts([[hx, hy + hd, zz], [hx + hw, hy + hd, zz], [hx + hw, hy, zz]]));
    }
    this.hullWrap.setAttribute("opacity", (waste * (0.78 + 0.22 * pulse)).toFixed(3));
    // dissolve sweep, top to bottom, in local coords
    const topY = -400, botY = 200;
    this.hullClipRect.setAttribute("y", (lerp(topY, botY, sweep)).toFixed(1));
  }
  // random point on the visible faces of the waste hull, screen coords
  sampleHull(r) {
    const [hx, hy, hz, hw, hd, hh] = this.hullDims();
    const face = r();
    let p;
    if (face < 0.34) p = P(hx + r() * hw, hy + r() * hd, hh);
    else if (face < 0.7) p = P(hx + r() * hw, hy + hd, r() * hh);
    else p = P(hx + hw, hy + r() * hd, r() * hh);
    return [p[0] + this.ox, p[1] + this.oy];
  }
}

/* ---------- Type helpers ---------- */
function makeLine(parent, html, top, maxSize, { cls = "w", maxW = 960, id } = {}) {
  const d = document.createElement("div");
  d.className = "line " + cls;
  if (id) d.id = id;
  d.style.top = top + "px";
  d.innerHTML = `<span class="m">${html}</span>`;
  parent.appendChild(d);
  d.style.fontSize = maxSize + "px";
  const wdt = d.firstChild.offsetWidth;
  if (wdt > maxW) d.style.fontSize = Math.floor(maxSize * maxW / wdt) + "px";
  return d;
}
function splitChars(line) {
  const m = line.firstChild, txt = m.textContent;
  m.innerHTML = [...txt].map(c => `<span class="ch">${c}</span>`).join("");
  return [...m.children];
}

/* ---------- Checklist card (equipment, install, rebates, tax credits) ---------- */
const ICONS = {
  EQUIPMENT: '<path d="M12 86 52 30h60L72 86Z"/><path d="M32 58h60M32 86 72 30M52 86 92 30"/><path d="M62 86v22M40 108h44"/>',
  INSTALL: '<path d="M18 84a42 42 0 0 1 84 0"/><path d="M8 84h104"/><path d="M48 46v26M72 46v26"/>',
  REBATES: '<path d="M18 62 58 22h44v44L62 106Z"/><circle cx="86" cy="38" r="7"/><text x="60" y="80" font-size="42" font-weight="900" fill="#fff" stroke="none" text-anchor="middle" transform="rotate(-45 60 66)">$</text>',
  "TAX CREDITS": '<path d="M28 12h48l22 22v76H28Z"/><path d="M76 12v22h22"/><path d="M44 58h38M44 76h38M44 94h24"/>'
};
function checkCard(svg, name, cx, cy) {
  const g = el("g", { transform: `translate(${cx},${cy})` }, svg);
  const inner = el("g", {}, g);
  el("rect", { x: -225, y: -145, width: 450, height: 290, rx: 34, fill: "rgba(18,40,77,.92)", stroke: "#2D5088", "stroke-width": 2.5 }, inner);
  const ic = el("g", { transform: "translate(-196,-120) scale(1.05)", fill: "none", stroke: "#fff", "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, inner);
  ic.innerHTML = ICONS[name];
  const lab = el("text", { x: -190, y: 108, "font-size": name.length > 9 ? 46 : 52, "font-weight": 900, fill: "#fff", "letter-spacing": "-1.5" }, inner);
  lab.textContent = name;
  const chk = el("g", { transform: "translate(160,-82)" }, inner);
  const ring = el("circle", { r: 38, fill: "rgba(61,255,138,0)", stroke: "rgba(255,255,255,.35)", "stroke-width": 5 }, chk);
  const tick = el("path", { d: "M-16 1 L-4 14 L18 -12", fill: "none", stroke: NAVY, "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": 60, "stroke-dashoffset": 60 }, chk);
  return { g, inner, ring, tick, chk };
}
// snap the cards in, then fill each check in turn
function updateCheckGrid(grid, t, snapAt, checkAt, gap) {
  grid.forEach((c, i) => {
    const a = snapAt + i * 0.12, p = prog(t, a, a + 0.4, "back.out(1.8)");
    c.inner.setAttribute("transform", `rotate(${((i % 2 ? 10 : -10) * (1 - p)).toFixed(2)}) scale(${(0.5 + 0.5 * p).toFixed(4)})`);
    c.inner.setAttribute("opacity", prog(t, a, a + 0.2).toFixed(3));
    const t0 = checkAt + i * gap, k = t - t0, on = prog(t, t0, t0 + 0.08);
    const pop = k > 0 && k < 0.18 ? 1 + 0.35 * Math.sin(Math.PI * k / 0.18) : 1;
    c.chk.setAttribute("transform", `translate(160,-82) scale(${pop.toFixed(3)})`);
    c.ring.setAttribute("fill", `rgba(61,255,138,${on.toFixed(3)})`);
    c.ring.setAttribute("stroke", on > 0 ? GREEN : "rgba(255,255,255,.35)");
    c.tick.setAttribute("stroke-dashoffset", (60 * (1 - prog(t, t0 + 0.04, t0 + 0.24, "power2.out"))).toFixed(1));
    c.inner.firstChild.setAttribute("stroke", on > 0 ? GREEN : "#2D5088");
  });
}

/* ---------- Clip-on meter with ping rings ---------- */
function makeMeter(parent, x, y) {
  const meterWrap = el("g", { transform: `translate(${x},${y})` }, parent);
  const meter = el("g", {}, meterWrap);
  const meterFace = el("g", { transform: "matrix(0.866,0.5,0,1,0,0)" }, meter);
  el("rect", { x: -6, y: -10, width: 112, height: 140, rx: 18, fill: "#0E2244", stroke: GREEN, "stroke-width": 4 }, meterFace);
  el("rect", { x: 10, y: 8, width: 80, height: 54, rx: 8, fill: "#06142A" }, meterFace);
  el("polyline", { points: "16,46 28,46 34,26 42,54 50,20 58,46 84,46", fill: "none", stroke: GREEN, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, meterFace);
  el("circle", { cx: 50, cy: 96, r: 13, fill: "none", stroke: GREEN, "stroke-width": 4 }, meterFace);
  el("path", { d: "M28 -10 V-26 H72 V-10", fill: "none", stroke: "#9FBDF0", "stroke-width": 6, "stroke-linecap": "round" }, meterFace);
  const meterRings = [0, 1, 2].map(() => el("circle", { cx: 43, cy: 85, r: 10, fill: "none", stroke: GREEN, "stroke-width": 4, opacity: 0 }, meterWrap));
  meter.style.filter = "drop-shadow(0 0 16px rgba(61,255,138,.5))";
  return { wrap: meterWrap, meter, rings: meterRings };
}

/* ---------- Shared SVG defs (filters, gradients, masks) ---------- */
const DEFS = `<filter id="mbf" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur id="mb" stdDeviation="0 0"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
<radialGradient id="gridFade" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="gridMask" maskUnits="userSpaceOnUse" x="-700" y="-500" width="1400" height="1000"><ellipse cx="0" cy="0" rx="560" ry="330" fill="url(#gridFade)"/></mask>
<linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3DFF8A" stop-opacity=".38"/><stop offset="1" stop-color="#3DFF8A" stop-opacity="0"/></linearGradient>
<linearGradient id="rArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4D2E" stop-opacity=".30"/><stop offset="1" stop-color="#FF4D2E" stop-opacity="0"/></linearGradient>
<radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFC170" stop-opacity=".9"/><stop offset=".35" stop-color="#FF8A4C" stop-opacity=".45"/><stop offset="1" stop-color="#FF6A3D" stop-opacity="0"/></radialGradient>`;
function injectDefs() {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("width", 0); s.setAttribute("height", 0); s.style.position = "absolute";
  s.innerHTML = `<defs>${DEFS}</defs>`;
  document.body.appendChild(s);
}

async function fontsReady() {
  await Promise.all([document.fonts.load('900 100px "InterAd"'), document.fonts.load('700 100px "InterAd"'), document.fonts.load('600 100px "InterAd"')]);
  await document.fonts.ready;
}

/* ---------- Grain ---------- */
function makeGrain(canvas) {
  const gx = canvas.getContext("2d");
  const tiles = [...Array(8)].map((_, k) => {
    const r = rng(500 + k), id = gx.createImageData(540, 960), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    return id;
  });
  return t => gx.putImageData(tiles[Math.floor(t * FPS) % tiles.length], 0, 0);
}

/* ---------- Camera shake: sum of decaying impulses [time, amplitude] ---------- */
function shake(t, impulses) {
  let sx = 0, sy = 0, rot = 0;
  for (const [t0, a] of impulses) {
    const dt = t - t0; if (dt < 0 || dt > 0.6) continue;
    const env = a * Math.exp(-dt * 11);
    sx += env * Math.sin(dt * 131 + t0); sy += env * Math.cos(dt * 97 + t0 * 2); rot += env * 0.012 * Math.sin(dt * 83);
  }
  return [sx, sy, rot];
}

/* ---------- Boot: render hook for render.cjs, or click-to-play preview with audio ---------- */
function boot({ frame, DUR, audioSrc }) {
  const params = new URLSearchParams(location.search);
  const renderMode = params.has("render");
  if (renderMode) document.body.classList.add("render");
  const fit = () => { if (renderMode) return; const s = Math.min(innerWidth / W, innerHeight / H); $("#stage").style.transform = `scale(${s})`; };
  addEventListener("resize", fit); fit();
  window.renderFrame = t => { frame(t); return true; };
  window.__ready = true;
  if (renderMode) { frame(+params.get("t") || 0); return; }
  const hud = $("#hud");
  const audio = new Audio(audioSrc);
  let start = null, playing = false, offset = +params.get("t") || 0;
  const loop = now => {
    let t = playing ? (audio.readyState > 2 && !audio.paused ? audio.currentTime : (now - start) / 1000 + offset) : offset;
    if (t >= DUR) { t = 0; offset = 0; start = now; try { audio.currentTime = 0; } catch (e) {} }
    frame(t);
    hud.textContent = `${t.toFixed(2)}s  ${playing ? "click to pause" : "click to play"}`;
    requestAnimationFrame(loop);
  };
  addEventListener("click", () => {
    playing = !playing;
    if (playing) { start = performance.now(); try { audio.currentTime = offset; audio.play().catch(() => {}); } catch (e) {} }
    else { offset = (performance.now() - start) / 1000 + offset; audio.pause(); }
  });
  requestAnimationFrame(loop);
}

window.AD = { W, H, FPS, BEAT, GREEN, RED, NAVY, NS, $, $$, clamp, lerp, E, prog, rng, hex, mixRGB, mix, beatPulse,
  el, IC, P, pts, boxFaces, mkBox, quad, Building, makeLine, splitChars, ICONS, checkCard, updateCheckGrid, makeMeter, injectDefs, fontsReady, makeGrain, shake, boot };
})();
