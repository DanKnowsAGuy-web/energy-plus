/*
  Energy+ motion hero, Concept A v2: "The bill breaks apart", told on one electric-bill receipt.

  THIS COPY: derived HERO cut for redesign-v3's first-visit intro. Forked from
  lab/motion-hero (2026-09-27) because that source only built the 12s FULL cut —
  `?cut=hero` was parsed but never wired to its own timeline. buildHero() below
  is a time-compressed re-derivation of buildFull()'s choreography: every position
  and duration was remapped through a piecewise-linear schedule (hook 0-1s at
  1:1, the three fixes 1-4s compressed by 3/7, rebuild+fold 4-5s compressed by
  1/4) so the FINAL FRAME (petrol ground, mark, centered headline, ochre rule)
  is bit-for-bit the same choreography as the full cut's ending, just reached
  in ~5s instead of ~12s. buildFull() is left in place, unused, as the reference
  it was derived from. See ../index.html (redesign-v3) for the embed + hand-off.

  One master GSAP timeline drives an inline SVG world plus HTML type. The camera is one
  transformed SVG group (#cam); every move interpolates through its fixed zoom point, so dives
  and pull-backs stay locked on their subject. HTML labels and the number are pinned to world
  points every frame, so type never renders below its design size.

  URL   ?t=<seconds>        seek to that time and hold (deterministic frames)
        ?capture=1          hide the Skip control for frame capture
        ?embed=1            marks this as an embedded view (currently a no-op; reserved)
  API   window.tl                     the master timeline (tl.progress(p) renders)
        window.motion.seek(seconds)   seek and hold
        window.__motionReady          true once fonts are in and the timeline is built
        window.introSkip()            jump to the final frame now (idempotent); sets
                                       window.__introSkipped so the parent page can pick
                                       a fast hand-off instead of the natural-completion one
*/
(function () {
  'use strict';

  var qs = new URLSearchParams(window.location.search);
  var CUT = qs.get('cut') === 'hero' ? 'hero' : 'full';
  var T_PARAM = qs.has('t') ? parseFloat(qs.get('t')) : null;
  var CAPTURE = qs.has('capture');
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var COL = {
    ink: '#101416', paper: '#F3F5F6', petrol: '#174E58', petrol2: '#1F5C67',
    ochre: '#E0A21C', red: '#C2513F', graphite: '#3B4347'
  };

  function rgbOf(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixHex(a, b, t) {
    var A = rgbOf(a), B = rgbOf(b), out = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(A[i] + (B[i] - A[i]) * t);
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }

  // Ground arc: ink, red-brown once the bill is broken open, then petrol one fix at a time.
  var RB = mixHex(COL.ink, COL.red, 0.18);
  var GSTOPS = [COL.ink, RB, mixHex(RB, COL.petrol, 0.42), mixHex(RB, COL.petrol, 0.72), COL.petrol];
  function groundAt(g) {
    var i = Math.min(GSTOPS.length - 2, Math.max(0, Math.floor(g)));
    return mixHex(GSTOPS[i], GSTOPS[i + 1], Math.min(1, Math.max(0, g - i)));
  }

  // Lockup geometry, font units of energy-plus-lockup-ink.svg with y flipped to screen-down.
  var LOCK_W = 5361.0, LOCK_H = 687.3, MARK_X = 4931.5;
  var PLUS = [[0, 0], [221.9, 0], [221.9, 229.1], [429.6, 229.1], [429.6, 455.3], [221.9, 455.3],
    [221.9, 687.3], [0, 687.3], [0, 455.3], [-239.8, 455.3], [-175.4, 229.1], [0, 229.1]];
  var PLUS_CX = 94.9, PLUS_CY = 343.65, ARM_T = 229.1 / LOCK_H, ARM_B = 455.3 / LOCK_H;
  var WORD_CLIP_R = 4905; // letters never slide under the bolt
  // A plain utility bolt for the bill header (not the Energy+ bolt).
  var BOLT = [[0.60, 0], [0.08, 0.58], [0.40, 0.58], [0.26, 1], [0.86, 0.38], [0.52, 0.38]];

  // ---------- helpers ----------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function hash(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
  function rectD(x, y, w, h) {
    if (w <= 0 || h <= 0) return '';
    return 'M' + r2(x) + ' ' + r2(y) + 'H' + r2(x + w) + 'V' + r2(y + h) + 'H' + r2(x) + 'Z';
  }
  function polyD(p) {
    var d = 'M' + r2(p[0][0]) + ' ' + r2(p[0][1]);
    for (var i = 1; i < p.length; i++) d += 'L' + r2(p[i][0]) + ' ' + r2(p[i][1]);
    return d + 'Z';
  }
  function lerpPts(A, B, t) {
    var o = new Array(A.length);
    for (var i = 0; i < A.length; i++) o[i] = [lerp(A[i][0], B[i][0], t), lerp(A[i][1], B[i][1], t)];
    return o;
  }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function arcD(cx, cy, r, a0, a1) { // degrees from vertical, clockwise
    var t0 = a0 * Math.PI / 180, t1 = a1 * Math.PI / 180;
    return 'M' + r2(cx + r * Math.sin(t0)) + ' ' + r2(cy - r * Math.cos(t0)) +
      'A' + r2(r) + ' ' + r2(r) + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' +
      r2(cx + r * Math.sin(t1)) + ' ' + r2(cy - r * Math.cos(t1));
  }
  // rectangle rotated about its centre, then moved
  function quadD(x0, y0, x1, y1, rot, dx, dy) {
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, c = Math.cos(rot), s = Math.sin(rot);
    var P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], d = '';
    for (var i = 0; i < 4; i++) {
      var X = P[i][0] - cx, Y = P[i][1] - cy;
      d += (i ? 'L' : 'M') + r2(cx + X * c - Y * s + dx) + ' ' + r2(cy + X * s + Y * c + dy);
    }
    return d + 'Z';
  }
  // torn bottom edge, right to left; teeth point down with tips at yBase + tooth
  function zigzag(x0, x1, yBase, tooth, n) {
    var pts = [], step = (x1 - x0) / (2 * n);
    for (var j = 0; j <= 2 * n; j++) pts.push([x1 - j * step, j % 2 ? yBase + tooth : yBase]);
    return pts;
  }
  function receiptD(x0, y0, w, bottom, tooth, n) {
    var z = zigzag(x0, x0 + w, bottom - tooth, tooth, n);
    var d = 'M' + r2(x0) + ' ' + r2(y0) + 'H' + r2(x0 + w) + 'V' + r2(bottom - tooth);
    for (var j = 1; j < z.length; j++) d += 'L' + r2(z[j][0]) + ' ' + r2(z[j][1]);
    return d + 'V' + r2(y0) + 'Z';
  }

  // Daily load profile, one point per 15 minute interval, one sharp afternoon spike.
  var N = 97;
  function loadAt(u) {
    var day = smooth(0.2, 0.4, u) * (1 - smooth(0.78, 0.93, u));
    var v = 0.36 + 0.3 * day + 0.028 * Math.sin(u * 46 + 0.4) + 0.016 * Math.sin(u * 107 + 1.3);
    var d = Math.abs(u - 0.625) / 0.03;
    if (d < 1) v += 1.32 * Math.pow(1 - d, 1.25);
    return v;
  }
  var LOAD = [];
  for (var li = 0; li < N; li++) LOAD.push(loadAt(li / (N - 1)));

  // Camera moves interpolate scale in log space around the move's fixed point.
  function camInterp(A, B, p) {
    var s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), p));
    if (Math.abs(A.s - B.s) < 1e-4) return { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), s: s };
    var fx = (A.x * A.s - B.x * B.s) / (A.s - B.s), fy = (A.y * A.s - B.y * B.s) / (A.s - B.s);
    return { x: fx - (fx - A.x) * A.s / s, y: fy - (fy - A.y) * A.s / s, s: s };
  }

  // ---------- elements ----------
  var E = {};
  function grab() {
    ['stage', 'world', 'cam', 'whole', 'wPaper', 'wItems', 'wAmts', 'pHead', 'pTot',
      'b0p', 'b0c', 'b1p', 'b1c', 'b2p', 'b2c', 'f0p', 'f0c', 'f1p', 'f1c', 'f2p', 'f2c',
      'headG', 'hBolt', 'hName', 'hSub', 'totG', 'tRule', 'totBar',
      'curve', 'ceil', 'gFace', 'zoneR', 'zoneP', 'needle', 'hub', 'thermo', 'thOut', 'thIn',
      'bladeV', 'bladeH', 'stampG', 'stamp', 'outline', 'plus', 'lockup', 'wordSlide',
      'cpSilR', 'cpMarkR', 'cpWordR', 'num', 'numIn', 'head', 'rule', 'skip'
    ].forEach(function (id) { E[id] = document.getElementById(id); });
    E.lbl = [document.getElementById('l0'), document.getElementById('l1'), document.getElementById('l2')];
    E.lblIn = E.lbl.map(function (l) { return l.querySelector('.in'); });
    E.headIn = Array.prototype.slice.call(E.head.querySelectorAll('.in'));
  }
  var VIS = new Map();
  function show(el, on) {
    on = !!on;
    if (VIS.get(el) !== on) { el.style.display = on ? '' : 'none'; VIS.set(el, on); }
  }
  function setD(el, d) { if (el.__d !== d) { el.setAttribute('d', d); el.__d = d; } }

  function measureGlyph(ch) {
    var c = document.createElement('canvas').getContext('2d');
    c.font = '800 100px Archivo';
    var m = c.measureText(ch);
    var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    if (!(asc > 0)) { asc = 80; desc = 10; }
    return { asc: asc / 100, desc: desc / 100 };
  }

  // ---------- layout (world units are CSS px at camera scale 1) ----------
  var LAY = null, S = null, TL = null;

  function computeLayout() {
    var W = Math.max(280, window.innerWidth), H = Math.max(360, window.innerHeight);
    var P = W / H < 0.9;
    var L = { W: W, H: H, portrait: P };
    var Rh, Rw;
    if (P) {
      Rh = Math.round(H * 0.86); Rw = Math.round(Rh * 0.462);
      if (Rw > W * 0.88) { Rw = Math.round(W * 0.88); Rh = Math.round(Rw / 0.462); }
      L.g = Math.max(6, Math.round(H * 0.012));
      L.lbl = 16; L.pad = 12; L.edge = 16;
      L.needleW = 3; L.bladeW = 3; L.nStrips = 36; L.shakeAmp = 3;
    } else {
      Rh = Math.round(H * 0.92); Rw = Math.round(Rh * 0.64);
      L.g = Math.max(6, Math.round(H * 0.0125));
      L.lbl = 20; L.pad = 16; L.edge = 24;
      L.needleW = 4.5; L.bladeW = 4; L.nStrips = 48; L.shakeAmp = 2.5;
    }
    L.Rw = Rw; L.Rh = Rh;
    L.rx0 = (W - Rw) / 2; L.ry0 = (H - Rh) / 2;
    L.hHead = Rh * 0.13; L.hBody = Rh * 0.70; L.hTot = Rh - L.hHead - L.hBody;
    L.tooth = Math.max(6, Rh * 0.018);
    L.nTeeth = Math.max(10, Math.round(Rw / (L.tooth * 1.7)));
    L.mx = Rw * 0.07; L.px0 = L.rx0 + L.mx; L.px1 = L.rx0 + Rw - L.mx; L.pw = L.px1 - L.px0;

    // the bill: price 40%, peak 25%, equipment 35% of the body; each keeps less, 65% in total
    L.share = [0.40, 0.25, 0.35];
    L.keep = [0.5, 0.68, 0.8];
    L.bh = L.share.map(function (f) { return f * L.hBody; });
    L.yHead = L.ry0;
    L.yBand = [L.ry0 + L.hHead, L.ry0 + L.hHead + L.bh[0], L.ry0 + L.hHead + L.bh[0] + L.bh[1]];
    L.yTot = L.ry0 + L.hHead + L.hBody;
    L.bottom0 = L.ry0 + Rh;
    L.offHead = -2 * L.g; L.offBand = [-L.g, 0, L.g]; L.offTot = 2 * L.g;
    var y = L.ry0 + L.hHead;
    L.yBandR = [];
    for (var i = 0; i < 3; i++) { L.yBandR.push(y); y += L.bh[i] * L.keep[i]; }
    L.yTotR = y;
    L.bottomR = y + L.hTot;
    L.totalKeep = (L.yTotR - L.yBandR[0]) / L.hBody;

    // camera keys: the phone travels down the receipt, one band at a time
    L.K0 = { x: W / 2, y: H / 2, s: 1 };
    L.Kpush = { x: W / 2, y: H / 2, s: P ? 1.05 : 1.03 };
    L.Ksplit = { x: W / 2, y: H / 2, s: Math.min(L.Kpush.s, 0.97 * H / (Rh + 4 * L.g)) };
    // PRICE: the band fills the frame with its cut line at 42% height, so the kept half stays in view
    var t0 = L.yBand[0] + L.offBand[0], h0 = L.bh[0];
    var sP = Math.max((W / Rw) * 0.98, 0.78 * H / h0);
    L.Kprice = { x: W / 2, y: t0 + h0 / 2 - (0.42 * H - H / 2) / sP, s: sP };
    var t1 = L.yBand[1], h1 = L.bh[1];
    var sK = Math.max(W / L.pw, H / h1) * 1.03;
    L.Kpeak = { x: W / 2, y: t1 + h1 / 2, s: sK };
    var sBack = P ? 1.3 : Math.max(1.05, (W / Rw) * 0.98);
    L.KpeakB = { x: W / 2, y: t1 + h1 / 2, s: sBack };
    var t2 = L.yBand[2] + L.offBand[2], h2 = L.bh[2];
    // (on a phone the band stops at ~62% of the frame, so the receipt frames the gauge above and below)
    var sE = P ? Math.max(W / L.pw, 0.62 * H / h2) : Math.max(W / L.pw, H / h2) * 1.03;
    L.Kequip = { x: W / 2, y: t2 + h2 / 2, s: sE };
    L.KequipB = { x: W / 2, y: t2 + h2 / 2, s: sBack };
    L.Krebuild = { x: W / 2, y: H / 2, s: 1 };

    // PRICE: the shredder
    L.pr = { top: t0, h: h0, pitch: Rw / L.nStrips, grav: 2 * 1.25 * H / sP / (0.46 * 0.46) };
    // PEAK: the load curve lives inside the window the dive frames
    // (the spike pierces the top of the frame until the ceiling comes down on it)
    L.pk = { cx: W / 2, base: t1 + h1, ww: W / sK, amp: 0.62 * h1, c0: 2.6, c1: 0.86 };
    // EQUIPMENT: the gauge and a tall, still thermometer, inside the window the dive frames
    var wwE = W / sE, whE = H / sE, R = Math.min(0.36 * wwE, 0.5 * whE);
    var thH = Math.min((P ? 2.3 : 1.9) * R, P ? 0.8 * h2 : 0.86 * whE);
    L.eq = { cx: W / 2 - 0.08 * wwE, base: t2 + h2 / 2 + thH / 2, R: R, thH: thH };
    // slices leaving PEAK and EQUIPMENT
    L.sliceGrav = 2 * 1.1 * H / sBack / (0.5 * 0.5);

    // the fold: the rebuilt receipt becomes the plus, then the camera pulls back to the lockup
    var Hs = L.bottomR - L.ry0;
    L.k = 0.62 * Hs / LOCK_H;
    L.markO = [W / 2 - L.k * PLUS_CX, L.ry0 + Hs / 2 - L.k * PLUS_CY];
    L.lockO = [L.markO[0] - L.k * MARK_X, L.markO[1]];
    buildFold(L, Hs);
    var LW = P ? Math.round(clamp(W * 0.44, 140, 200)) : Math.round(clamp(W * 0.15, 150, 240));
    var lx = P ? (W - LW) / 2 : Math.round(clamp(W * 0.045, 24, 72));
    var ly = P ? Math.round(clamp(H * 0.07, 28, 72)) : Math.round(clamp(H * 0.068, 24, 64));
    var sf = LW / (LOCK_W * L.k);
    L.Klock = { x: L.lockO[0] - (lx - W / 2) / sf, y: L.lockO[1] - (ly - H / 2) / sf, s: sf };

    // "−35%" fills the empty outline it describes
    L.numFs = Math.round(Math.min(0.9 * Rw / 2.9, 0.85 * (L.bottom0 - L.bottomR)));
    return L;
  }

  function buildFold(L, Hs) {
    var x0 = L.rx0, x1 = L.rx0 + L.Rw, y0 = L.ry0, yb = L.bottomR;
    var ya = y0 + ARM_T * Hs, yB = y0 + ARM_B * Hs;
    var zig = zigzag(x0, x1, yb - L.tooth, L.tooth, L.nTeeth);
    var A = [[x0, y0], [x1, y0], [x1, ya], [x1, ya], [x1, yB], [x1, yB]];
    for (var j = 0; j < zig.length; j++) A.push(zig[j]);
    A.push([x0, yB], [x0, yB], [x0, ya], [x0, ya]);
    var Q = PLUS.map(function (p) { return [L.markO[0] + L.k * p[0], L.markO[1] + L.k * p[1]]; });
    var B = [Q[0], Q[1], Q[2], Q[3], Q[4], Q[5]], m = zig.length - 1;
    for (j = 0; j <= m; j++) B.push([lerp(Q[6][0], Q[7][0], j / m), lerp(Q[6][1], Q[7][1], j / m)]);
    B.push(Q[8], Q[9], Q[10], Q[11]);
    L.foldA = A; L.foldB = B;
  }

  function applyLayout(L) {
    var W = L.W, H = L.H;
    E.world.setAttribute('width', W);
    E.world.setAttribute('height', H);
    E.world.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    E.stage.style.setProperty('--lbl', L.lbl + 'px');
    E.stage.style.setProperty('--num', L.numFs + 'px');

    // the whole receipt at rest (the drop is a group translate)
    var paper = receiptD(L.rx0, L.ry0, L.Rw, L.bottom0, L.tooth, L.nTeeth);
    setD(E.wPaper, paper);
    setD(E.outline, paper);
    var iw = L.pw, rows = 6, pitch = L.hBody / 6.4, th = Math.max(4, pitch * 0.24), items = '', amts = '';
    var WL = [0.5, 0.36, 0.56, 0.3, 0.46, 0.4], WA = [0.16, 0.12, 0.2, 0.1, 0.14, 0.12];
    for (var i = 0; i < rows; i++) {
      var yy = L.yBand[0] + pitch * (i + 0.7) - th / 2;
      items += rectD(L.px0, yy, iw * WL[i], th);
      amts += rectD(L.px1 - iw * WA[i], yy, iw * WA[i], th);
    }
    setD(E.wItems, items);
    setD(E.wAmts, amts);

    // header and total furniture, drawn at their resting slots
    var bH = L.hHead * 0.44, bW = bH * 0.86, bx = L.px0, by = L.yHead + (L.hHead - bH) / 2;
    setD(E.hBolt, polyD(BOLT.map(function (p) { return [bx + p[0] * bW, by + p[1] * bH]; })));
    var nx = bx + bW + L.Rw * 0.04;
    setD(E.hName, rectD(nx, L.yHead + L.hHead * 0.33, iw * 0.44, L.hHead * 0.13));
    setD(E.hSub, rectD(nx, L.yHead + L.hHead * 0.58, iw * 0.28, L.hHead * 0.08));
    setD(E.tRule, rectD(L.px0, L.yTot + L.hTot * 0.1, iw, Math.max(1, L.hTot * 0.012)));
    L.totY = L.yTot + L.hTot * 0.26; L.totH = L.hTot * 0.3;

    // thermometer: drawn once, never animated
    var R = L.eq.R, tx = L.eq.cx + R * 1.28, yb = L.eq.base;
    var a = R * 0.08, b = R * 0.16, top = yb - L.eq.thH, cyb = yb - b, yj = cyb - Math.sqrt(b * b - a * a);
    setD(E.thOut, 'M' + r2(tx - a) + ' ' + r2(yj) + 'V' + r2(top + a) +
      'A' + r2(a) + ' ' + r2(a) + ' 0 0 1 ' + r2(tx + a) + ' ' + r2(top + a) + 'V' + r2(yj) +
      'A' + r2(b) + ' ' + r2(b) + ' 0 1 1 ' + r2(tx - a) + ' ' + r2(yj) + 'Z');
    var level = top + a + (yj - top - a) * 0.45, ci = b * 0.58, col = a * 0.8;
    setD(E.thIn, 'M' + r2(tx - col / 2) + ' ' + r2(cyb) + 'V' + r2(level) + 'H' + r2(tx + col / 2) + 'V' + r2(cyb) + 'Z' +
      'M' + r2(tx - ci) + ' ' + r2(cyb) + 'A' + r2(ci) + ' ' + r2(ci) + ' 0 1 1 ' + r2(tx + ci) + ' ' + r2(cyb) +
      'A' + r2(ci) + ' ' + r2(ci) + ' 0 1 1 ' + r2(tx - ci) + ' ' + r2(cyb) + 'Z');

    E.zoneR.setAttribute('stroke-width', r2(R * 0.15));
    E.zoneP.setAttribute('stroke-width', r2(R * 0.15));
    E.needle.setAttribute('stroke-width', L.needleW);
    E.bladeV.setAttribute('stroke-width', L.bladeW);
    E.bladeH.setAttribute('stroke-width', L.bladeW);

    // the stamp: an oversized $, sized from its ink box
    var m = measureGlyph('$');
    L.sFs = 0.5 * L.Rh / (m.asc + m.desc);
    L.sBase = (m.asc - m.desc) / 2 * L.sFs;
    E.stamp.setAttribute('font-size', r2(L.sFs));

    E.lockup.setAttribute('transform', 'matrix(' + L.k + ' 0 0 ' + L.k + ' ' + r2(L.lockO[0]) + ' ' + r2(L.lockO[1]) + ')');
    fitHeadline(L);
    L.lw = E.lbl.map(function (l) { return l.getBoundingClientRect().width; });
    L.lh = E.lbl[0].getBoundingClientRect().height;
  }

  // Headline: largest Archivo width (up to 112) that keeps each line inside the frame.
  function fitHeadline(L) {
    var h = E.head, lines = E.headIn;
    var fs = L.portrait ? clamp(L.W * 0.125, 40, 52) : clamp(Math.min(L.W * 0.085, L.H * 0.16), 72, 124);
    var avail = L.portrait ? L.W - 2 * Math.max(20, Math.round(L.W * 0.06)) : Math.min(L.W * 0.84, 1240);
    gsap.set(lines, { yPercent: 0 });
    h.style.fontSize = fs + 'px';
    function widest() {
      var mx = 0;
      for (var i = 0; i < lines.length; i++) mx = Math.max(mx, lines[i].getBoundingClientRect().width);
      return mx;
    }
    var wd = 112;
    h.style.setProperty('--wdth', wd);
    while (widest() > avail && wd > 75) { wd -= 1; h.style.setProperty('--wdth', wd); }
    while (widest() > avail && fs > 28) { fs -= 1; h.style.fontSize = fs + 'px'; }
    L.headFs = fs; L.headW = wd;
    var hh = h.getBoundingClientRect().height;
    var ruleW = L.portrait ? 48 : 80, ruleH = L.portrait ? 2 : 3, ruleGap = L.portrait ? 22 : 34;
    var top = Math.round(L.H * 0.5 - (hh + ruleGap + ruleH) / 2);
    h.style.top = top + 'px';
    E.rule.style.width = ruleW + 'px';
    E.rule.style.height = ruleH + 'px';
    E.rule.style.marginLeft = (-ruleW / 2) + 'px';
    E.rule.style.top = Math.round(top + hh + ruleGap) + 'px';
  }

  // ---------- state (everything the timeline animates) ----------
  function freshState(L) {
    return {
      g: 0, mode: 0, drop: -(L.ry0 + L.Rh + 40),
      mv: [], lastKey: L.K0,
      shk: [{ p: 0, amp: L.shakeAmp }, { p: 0, amp: 1.5 }, { p: 0, amp: 1.5 }],
      stamp: { o: 0, sc: 1.4, w: 62 },
      split: 0, rebuild: 0, k0: 1, k1: 1, k2: 1, lf: -1,
      pr: { bl: 0, sweep: 0, hcut: 0, fall: 0, snap: 0 },
      pk: { rise: 0, cl: 0, ceil: L.pk.c0, slice: 0, drop: 0 },
      eq: { th: 0, grow: 0, zones: 0, nl: 0, na: -55, slice: 0, drop: 0 },
      outline: 0, total: 1, numO: 0,
      fold: { o: 0, m: 0 }, lock: 0, wipe: 0, word: 0
    };
  }

  function resetDom() {
    gsap.set(E.lblIn, { yPercent: 115 });
    gsap.set(E.numIn, { scale: 1.5 });
    gsap.set(E.num, { '--nw': 62 });
    gsap.set(E.headIn, { yPercent: 115 });
    gsap.set(E.head, { '--wdth': 62 });
    gsap.set(E.rule, { scaleX: 0 });
    gsap.set(E.skip, { autoAlpha: 1 });
    VIS.clear();
  }

  function camMove(tl, key, t, dur) {
    var m = { p: 0, a: S.lastKey, b: key };
    S.lastKey = key;
    S.mv.push(m);
    tl.to(m, { p: 1, duration: dur, ease: 'expo.inOut' }, t);
  }
  function lblIn(tl, i, t) {
    tl.fromTo(E.lblIn[i], { yPercent: 115 }, { yPercent: 0, duration: 0.3, ease: 'expo.out' }, t);
  }

  // ---------- the FULL cut (12 s) ----------
  function buildFull(tl, L) {
    var X = 'expo.out', XI = 'expo.inOut';

    // 0.0 to 1.0  HOOK: the bill lands hard; an oversized $ stamps onto it
    tl.to(S, { drop: L.Rh * 0.02, duration: 0.2, ease: X }, 0.04)
      .to(S, { drop: 0, duration: 0.16, ease: XI }, 0.24)
      .to(S.shk[0], { p: 1, duration: 0.32, ease: 'none' }, 0.12);
    camMove(tl, L.Kpush, 0.14, 0.45);
    tl.set(S.stamp, { o: 1 }, 0.3)
      .to(S.stamp, { sc: 1, duration: 0.2, ease: X }, 0.3)
      .to(S.stamp, { w: 125, duration: 0.26, ease: X }, 0.3)
      .to(S.shk[1], { p: 1, duration: 0.2, ease: 'none' }, 0.34);

    // 1.0 to 2.0  hard match cut: the receipt splits into three bands
    tl.set(S, { mode: 1, g: 1 }, 1.0)
      .set(S.stamp, { o: 0 }, 1.0)
      .to(S, { split: 1, duration: 0.3, ease: X }, 1.0);
    camMove(tl, L.Ksplit, 1.0, 0.3);
    lblIn(tl, 0, 1.06);
    lblIn(tl, 1, 1.14);
    lblIn(tl, 2, 1.22);

    // 2.0 to 4.0  PRICE: push in; an ochre blade dices it; half the strips fall; it snaps shorter
    camMove(tl, L.Kprice, 2.0, 0.45);
    tl.set(S, { lf: 0 }, 2.0)
      .set(S, { lf: 1 }, 3.42)
      .set(S, { lf: 2 }, 5.86)
      .set(S, { lf: -1 }, 8.05);
    tl.set(S.pr, { bl: 1 }, 2.36)
      .to(S.pr, { sweep: 1, duration: 0.3, ease: XI }, 2.36)
      .to(S.pr, { hcut: 1, duration: 0.1, ease: X }, 2.66)
      .to(S.pr, { fall: 1, duration: 1.0, ease: 'none' }, 2.76)
      .to(S.pr, { snap: 1, duration: 0.12, ease: X }, 3.2)
      .set(S, { k0: L.keep[0] }, 3.32)
      .to(S, { g: 2, duration: 0.3, ease: X }, 3.2);

    // 4.0 to 6.0  PEAK: dive in; the ceiling clips the spike; pull back; the slice comes off
    camMove(tl, L.Kpeak, 3.42, 0.5);
    tl.to(S.pk, { rise: 1, duration: 0.3, ease: X }, 3.9)
      .to(S.pk, { cl: 1, duration: 0.14, ease: X }, 4.2)
      .to(S.pk, { ceil: L.pk.c1, duration: 0.4, ease: XI }, 4.3)
      .to(S.pk, { rise: 0, cl: 0, duration: 0.16, ease: XI }, 5.02);
    camMove(tl, L.KpeakB, 5.04, 0.45);
    tl.to(S.pk, { slice: 1, duration: 0.14, ease: X }, 5.49)
      .set(S, { k1: L.keep[1] }, 5.63)
      .to(S.pk, { drop: 0.6, duration: 0.6, ease: 'none' }, 5.63)
      .to(S, { g: 3, duration: 0.3, ease: X }, 5.63);

    // 6.0 to 8.0  EQUIPMENT: dive in; the needle lands in petrol; pull back; the slice comes off
    tl.set(S.eq, { th: 1 }, 5.86);
    camMove(tl, L.Kequip, 5.86, 0.46);
    tl.to(S.eq, { grow: 1, duration: 0.26, ease: X }, 6.2)
      .to(S.eq, { zones: 1, duration: 0.2, ease: X }, 6.36)
      .to(S.eq, { nl: 1, duration: 0.16, ease: X }, 6.4)
      .to(S.eq, { na: 42, duration: 0.38, ease: XI }, 6.62)
      .to(S.eq, { na: 37, duration: 0.16, ease: XI }, 7.0)
      .to(S.eq, { grow: 0, zones: 0, nl: 0, duration: 0.14, ease: XI }, 7.2)
      .set(S.eq, { th: 0 }, 7.3);
    camMove(tl, L.KequipB, 7.26, 0.45);
    tl.to(S.eq, { slice: 1, duration: 0.14, ease: X }, 7.71)
      .set(S, { k2: L.keep[2] }, 7.85)
      .to(S.eq, { drop: 0.6, duration: 0.6, ease: 'none' }, 7.85)
      .to(S, { g: 4, duration: 0.3, ease: X }, 7.85);

    // 8.0 to 10.0  the shorter receipt snaps back together; the old length stays as an outline
    camMove(tl, L.Krebuild, 8.05, 0.45);
    tl.to(S, { rebuild: 1, duration: 0.4, ease: XI }, 8.08)
      .set(S, { outline: 1 }, 8.48)
      .to(S, { total: L.totalKeep, duration: 0.4, ease: XI }, 8.48)
      .set(S, { numO: 1 }, 8.84)
      .fromTo(E.numIn, { scale: 1.5 }, { scale: 1, duration: 0.18, ease: X }, 8.84)
      .fromTo(E.num, { '--nw': 62 }, { '--nw': 112, duration: 0.24, ease: X }, 8.84)
      .to(S.shk[2], { p: 1, duration: 0.2, ease: 'none' }, 8.86);

    // 10.0 to 12.0  hard cut to ochre; the receipt folds into the mark; the line resolves
    tl.set(S, { mode: 2, outline: 0, numO: 0 }, 10.0)
      .set(E.lblIn, { yPercent: 115 }, 10.0)
      .set(S.fold, { o: 1 }, 10.0)
      .to(S.fold, { m: 1, duration: 0.35, ease: XI }, 10.0)
      .set(S, { lock: 1 }, 10.26)
      .to(S, { wipe: 1, duration: 0.18, ease: XI }, 10.28)
      .set(S.fold, { o: 0 }, 10.46);
    camMove(tl, L.Klock, 10.32, 0.5);
    tl.to(S, { word: 1, duration: 0.3, ease: X }, 10.5)
      .fromTo(E.headIn, { yPercent: 115 }, { yPercent: 0, duration: 0.34, ease: X, stagger: 0.06 }, 10.44)
      .fromTo(E.head, { '--wdth': 62 }, { '--wdth': L.headW, duration: 0.38, ease: X }, 10.44)
      .fromTo(E.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: X }, 10.6)
      .to(E.skip, { autoAlpha: 0, duration: 0.2, ease: XI }, 10.4)
      .set({}, {}, 12.0);
  }

  // ---------- the HERO cut (~5s), time-compressed from buildFull() above ----------
  // Map: t<=1 unchanged (the hook); 1<t<=8 scaled by 3/7 (the three fixes, 7s -> 3s);
  // 8<t<=12 scaled by 1/4 (rebuild + fold to the mark, 4s -> 1s). Every position and
  // duration below is that remap applied to buildFull()'s numbers, by hand, so the
  // relative choreography inside each beat (blade sweep -> strips fall -> snap, etc.)
  // stays proportionally the same and the final frame lands unchanged.
  function buildHero(tl, L) {
    var X = 'expo.out', XI = 'expo.inOut';

    // 0.00-1.00  HOOK: the bill lands hard; an oversized $ stamps onto it (1:1, unchanged)
    tl.to(S, { drop: L.Rh * 0.02, duration: 0.2, ease: X }, 0.04)
      .to(S, { drop: 0, duration: 0.16, ease: XI }, 0.24)
      .to(S.shk[0], { p: 1, duration: 0.32, ease: 'none' }, 0.12);
    camMove(tl, L.Kpush, 0.14, 0.45);
    tl.set(S.stamp, { o: 1 }, 0.3)
      .to(S.stamp, { sc: 1, duration: 0.2, ease: X }, 0.3)
      .to(S.stamp, { w: 125, duration: 0.26, ease: X }, 0.3)
      .to(S.shk[1], { p: 1, duration: 0.2, ease: 'none' }, 0.34);

    // 1.00-1.13  hard match cut: the receipt splits into three bands
    tl.set(S, { mode: 1, g: 1 }, 1.0)
      .set(S.stamp, { o: 0 }, 1.0)
      .to(S, { split: 1, duration: 0.1286, ease: X }, 1.0);
    camMove(tl, L.Ksplit, 1.0, 0.1286);
    tl.fromTo(E.lblIn[0], { yPercent: 115 }, { yPercent: 0, duration: 0.1286, ease: X }, 1.0257);
    tl.fromTo(E.lblIn[1], { yPercent: 115 }, { yPercent: 0, duration: 0.1286, ease: X }, 1.06);
    tl.fromTo(E.lblIn[2], { yPercent: 115 }, { yPercent: 0, duration: 0.1286, ease: X }, 1.0943);

    // 1.43-2.04  PRICE: push in; an ochre blade dices it; half the strips fall; it snaps shorter
    camMove(tl, L.Kprice, 1.4286, 0.1929);
    tl.set(S, { lf: 0 }, 1.4286)
      .set(S, { lf: 1 }, 2.0371)
      .set(S, { lf: 2 }, 3.0829)
      .set(S, { lf: -1 }, 4.0125);
    tl.set(S.pr, { bl: 1 }, 1.5829)
      .to(S.pr, { sweep: 1, duration: 0.1286, ease: XI }, 1.5829)
      .to(S.pr, { hcut: 1, duration: 0.0429, ease: X }, 1.7114)
      .to(S.pr, { fall: 1, duration: 0.4286, ease: 'none' }, 1.7543)
      .to(S.pr, { snap: 1, duration: 0.0514, ease: X }, 1.9429)
      .set(S, { k0: L.keep[0] }, 1.9943)
      .to(S, { g: 2, duration: 0.1286, ease: X }, 1.9429);

    // 2.04-2.98  PEAK: dive in; the ceiling clips the spike; pull back; the slice comes off
    camMove(tl, L.Kpeak, 2.0371, 0.2143);
    tl.to(S.pk, { rise: 1, duration: 0.1286, ease: X }, 2.2429)
      .to(S.pk, { cl: 1, duration: 0.06, ease: X }, 2.3714)
      .to(S.pk, { ceil: L.pk.c1, duration: 0.1714, ease: XI }, 2.4143)
      .to(S.pk, { rise: 0, cl: 0, duration: 0.0686, ease: XI }, 2.7229);
    camMove(tl, L.KpeakB, 2.7314, 0.1929);
    tl.to(S.pk, { slice: 1, duration: 0.06, ease: X }, 2.9243)
      .set(S, { k1: L.keep[1] }, 2.9843)
      .to(S.pk, { drop: 0.6, duration: 0.2571, ease: 'none' }, 2.9843)
      .to(S, { g: 3, duration: 0.1286, ease: X }, 2.9843);

    // 3.08-4.01  EQUIPMENT: dive in; the needle lands in petrol; pull back; the slice comes off
    tl.set(S.eq, { th: 1 }, 3.0829);
    camMove(tl, L.Kequip, 3.0829, 0.1971);
    tl.to(S.eq, { grow: 1, duration: 0.1114, ease: X }, 3.2286)
      .to(S.eq, { zones: 1, duration: 0.0857, ease: X }, 3.2971)
      .to(S.eq, { nl: 1, duration: 0.0686, ease: X }, 3.3143)
      .to(S.eq, { na: 42, duration: 0.1629, ease: XI }, 3.4086)
      .to(S.eq, { na: 37, duration: 0.0686, ease: XI }, 3.5714)
      .to(S.eq, { grow: 0, zones: 0, nl: 0, duration: 0.06, ease: XI }, 3.6571)
      .set(S.eq, { th: 0 }, 3.7);
    camMove(tl, L.KequipB, 3.6829, 0.1929);
    tl.to(S.eq, { slice: 1, duration: 0.06, ease: X }, 3.8757)
      .set(S, { k2: L.keep[2] }, 3.9357)
      .to(S.eq, { drop: 0.6, duration: 0.2571, ease: 'none' }, 3.9357)
      .to(S, { g: 4, duration: 0.1286, ease: X }, 3.9357);

    // 4.01-4.21  the shorter receipt snaps back together; the old length stays as an outline
    camMove(tl, L.Krebuild, 4.0125, 0.1125);
    tl.to(S, { rebuild: 1, duration: 0.1, ease: XI }, 4.02)
      .set(S, { outline: 1 }, 4.12)
      .to(S, { total: L.totalKeep, duration: 0.1, ease: XI }, 4.12)
      .set(S, { numO: 1 }, 4.21)
      .fromTo(E.numIn, { scale: 1.5 }, { scale: 1, duration: 0.045, ease: X }, 4.21)
      .fromTo(E.num, { '--nw': 62 }, { '--nw': 112, duration: 0.06, ease: X }, 4.21)
      .to(S.shk[2], { p: 1, duration: 0.05, ease: 'none' }, 4.215);

    // 4.50-5.00  hard cut to ochre; the receipt folds into the mark; the line resolves
    // (this is the final frame: petrol ground + mark + centered headline + ochre rule)
    tl.set(S, { mode: 2, outline: 0, numO: 0 }, 4.5)
      .set(E.lblIn, { yPercent: 115 }, 4.5)
      .set(S.fold, { o: 1 }, 4.5)
      .to(S.fold, { m: 1, duration: 0.0875, ease: XI }, 4.5)
      .set(S, { lock: 1 }, 4.565)
      .to(S, { wipe: 1, duration: 0.045, ease: XI }, 4.57)
      .set(S.fold, { o: 0 }, 4.615);
    camMove(tl, L.Klock, 4.58, 0.125);
    tl.to(S, { word: 1, duration: 0.075, ease: X }, 4.625)
      .fromTo(E.headIn, { yPercent: 115 }, { yPercent: 0, duration: 0.085, ease: X, stagger: 0.015 }, 4.61)
      .fromTo(E.head, { '--wdth': 62 }, { '--wdth': L.headW, duration: 0.095, ease: X }, 4.61)
      .fromTo(E.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.055, ease: X }, 4.65)
      .to(E.skip, { autoAlpha: 0, duration: 0.05, ease: XI }, 4.6)
      .set({}, {}, 5.0);
  }

  // ---------- render: state to DOM, once per tick ----------
  function stripDelay(k, n) { return 0.22 * k / Math.max(1, n - 1) + 0.08 * hash(k, 3); }
  function addParts(o, xa, xb, ya, yb) {
    if (xb <= xa || yb <= ya) return;
    var L = LAY;
    o.p += rectD(xa, ya, xb - xa, yb - ya);
    var cA = Math.max(xa, L.px0), cB = Math.min(xb, L.px1);
    if (cB > cA) o.c += rectD(cA, ya, cB - cA, yb - ya);
  }
  function addPartsXf(o, xa, xb, ya, yb, rot, dx, dy) {
    var L = LAY;
    o.p += quadD(xa, ya, xb, yb, rot, dx, dy);
    var cA = Math.max(xa, L.px0), cB = Math.min(xb, L.px1);
    if (cB > cA) {
      // rotate the colour part about the strip's centre so both parts move as one
      var cx = (xa + xb) / 2, cy = (ya + yb) / 2, c = Math.cos(rot), s = Math.sin(rot);
      var P = [[cA, ya], [cB, ya], [cB, yb], [cA, yb]], d = '';
      for (var i = 0; i < 4; i++) {
        var X = P[i][0] - cx, Y = P[i][1] - cy;
        d += (i ? 'L' : 'M') + r2(cx + X * c - Y * s + dx) + ' ' + r2(cy + X * s + Y * c + dy);
      }
      o.c += d + 'Z';
    }
  }

  function render() {
    var L = LAY;
    if (!L || !S) return;
    var W = L.W, H = L.H;

    // camera
    var cam = L.K0;
    for (var mi = S.mv.length - 1; mi >= 0; mi--) {
      if (S.mv[mi].p > 0) { cam = camInterp(S.mv[mi].a, S.mv[mi].b, S.mv[mi].p); break; }
    }
    var shx = 0, shy = 0;
    for (var si = 0; si < S.shk.length; si++) {
      var k = S.shk[si];
      if (k.p > 0 && k.p < 1) {
        var amp = k.amp * Math.pow(1 - k.p, 1.4);
        shy += amp * Math.sin(k.p * Math.PI * 7);
        shx += amp * 0.45 * Math.sin(k.p * Math.PI * 5 + 1.2);
      }
    }
    var s = cam.s, tx = W / 2 + shx - cam.x * s, ty = H / 2 + shy - cam.y * s;
    E.cam.setAttribute('transform', 'matrix(' + s.toFixed(5) + ' 0 0 ' + s.toFixed(5) + ' ' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ')');
    function SX(x) { return x * s + tx; }
    function SY(yv) { return yv * s + ty; }
    E.stage.style.backgroundColor = groundAt(S.g);

    var mode = S.mode, pieces = mode === 1;

    // the whole receipt (hook)
    show(E.whole, mode === 0);
    if (mode === 0) E.whole.setAttribute('transform', 'translate(0 ' + r2(S.drop) + ')');

    // piece positions: resting slot, opened by the split, closed again (shorter) by the rebuild
    var sp = S.split, rb = S.rebuild;
    var yH = lerp(L.yHead + L.offHead * sp, L.yHead, rb);
    var yT = lerp(L.yTot + L.offTot * sp, L.yTotR, rb);
    var yB = [0, 1, 2].map(function (i) { return lerp(L.yBand[i] + L.offBand[i] * sp, L.yBandR[i], rb); });
    var kk = [S.k0, S.k1, S.k2];

    show(E.pHead, pieces); show(E.pTot, pieces);
    if (pieces) {
      setD(E.pHead, rectD(L.rx0, yH, L.Rw, L.hHead));
      setD(E.pTot, receiptD(L.rx0, yT, L.Rw, yT + L.hTot, L.tooth, L.nTeeth));
    }
    show(E.headG, mode !== 2); show(E.totG, mode !== 2);
    E.headG.setAttribute('transform', 'translate(0 ' + r2(mode === 0 ? S.drop : yH - L.yHead) + ')');
    E.totG.setAttribute('transform', 'translate(0 ' + r2(mode === 0 ? S.drop : yT - L.yTot) + ')');
    setD(E.totBar, rectD(L.px0, L.totY, L.pw * S.total, L.totH));

    // bands
    ['b0p', 'b0c', 'b1p', 'b1c', 'b2p', 'b2c', 'f0p', 'f0c', 'f1p', 'f1c', 'f2p', 'f2c'].forEach(function (id) { show(E[id], pieces); });
    var pr = S.pr, top0 = yB[0], h0 = L.bh[0];
    if (pieces) {
      // PRICE
      var o0 = { p: '', c: '' }, f0 = { p: '', c: '' };
      var n = L.nStrips, pitch = L.pr.pitch, mid = top0 + h0 / 2, cutDone = pr.hcut >= 1;
      var hg = cutDone ? pitch * 0.14 : 0;
      if (pr.sweep <= 0 || kk[0] < 1) {
        addParts(o0, L.rx0, L.rx0 + L.Rw, top0, top0 + h0 * kk[0]);
      } else {
        var gap = pitch * 0.2 * (1 - pr.snap);
        var bx = lerp(L.rx0 - pitch, L.rx0 + L.Rw + pitch, pr.sweep), solidFrom = L.rx0 + L.Rw;
        for (var j = 0; j < n; j++) {
          var xs = L.rx0 + j * pitch, xe = xs + pitch;
          if (xe > bx) { solidFrom = Math.min(solidFrom, xs); continue; }
          var xa = xs + gap / 2, xb = xe - gap / 2;
          addParts(o0, xa, xb, top0, cutDone ? mid - hg / 2 : top0 + h0);
          if (cutDone && pr.fall - stripDelay(j, n) <= 0) addParts(o0, xa, xb, mid + hg / 2, top0 + h0);
        }
        if (solidFrom < L.rx0 + L.Rw) addParts(o0, solidFrom, L.rx0 + L.Rw, top0, top0 + h0);
      }
      if (cutDone && pr.fall > 0) {
        var fgap = pitch * 0.2;
        for (var q = 0; q < n; q++) {
          var tau = pr.fall - stripDelay(q, n);
          if (tau <= 0 || tau > 0.72) continue;
          var qa = L.rx0 + q * pitch + fgap / 2, qb = qa + pitch - fgap;
          addPartsXf(f0, qa, qb, mid + hg / 2, top0 + h0,
            (hash(q, 2) - 0.5) * 0.9 * tau, (hash(q, 1) - 0.5) * pitch * 3 * tau, 0.5 * L.pr.grav * tau * tau);
        }
      }
      setD(E.b0p, o0.p); setD(E.b0c, o0.c); setD(E.f0p, f0.p); setD(E.f0c, f0.c);

      // PEAK and EQUIPMENT: solid bands, plus the slice that leaves each one
      var drops = [null, S.pk.drop, S.eq.drop];
      for (var bi = 1; bi <= 2; bi++) {
        var ob = { p: '', c: '' }, fb = { p: '', c: '' };
        addParts(ob, L.rx0, L.rx0 + L.Rw, yB[bi], yB[bi] + L.bh[bi] * kk[bi]);
        var dt = drops[bi];
        if (dt > 0 && dt < 0.6) {
          addPartsXf(fb, L.rx0, L.rx0 + L.Rw, yB[bi] + L.bh[bi] * L.keep[bi], yB[bi] + L.bh[bi],
            0.16 * dt, L.Rw * 0.05 * dt, 0.5 * L.sliceGrav * dt * dt);
        }
        setD(E['b' + bi + 'p'], ob.p); setD(E['b' + bi + 'c'], ob.c);
        setD(E['f' + bi + 'p'], fb.p); setD(E['f' + bi + 'c'], fb.c);
      }
    }

    // blades
    var bv = pieces && pr.bl && pr.sweep > 0 && pr.sweep < 1;
    show(E.bladeV, bv);
    if (bv) {
      var bxv = lerp(L.rx0 - L.pr.pitch, L.rx0 + L.Rw + L.pr.pitch, pr.sweep), ext = h0 * 0.12;
      E.bladeV.setAttribute('x1', r2(bxv)); E.bladeV.setAttribute('x2', r2(bxv));
      E.bladeV.setAttribute('y1', r2(top0 - ext)); E.bladeV.setAttribute('y2', r2(top0 + h0 + ext));
    }
    var hcY = null, hcP = 0;
    if (pieces && pr.hcut > 0 && kk[0] >= 1) { hcY = top0 + h0 / 2; hcP = pr.hcut; }
    else if (pieces && S.pk.slice > 0 && S.pk.drop < 0.15) { hcY = yB[1] + L.bh[1] * L.keep[1]; hcP = S.pk.slice; }
    else if (pieces && S.eq.slice > 0 && S.eq.drop < 0.15) { hcY = yB[2] + L.bh[2] * L.keep[2]; hcP = S.eq.slice; }
    show(E.bladeH, hcY !== null);
    if (hcY !== null) {
      var hx0 = L.rx0 - L.Rw * 0.04;
      E.bladeH.setAttribute('x1', r2(hx0)); E.bladeH.setAttribute('x2', r2(lerp(hx0, L.rx0 + L.Rw * 1.04, hcP)));
      E.bladeH.setAttribute('y1', r2(hcY)); E.bladeH.setAttribute('y2', r2(hcY));
    }

    // PEAK station: the load curve and the ceiling
    var pk = S.pk, curveOn = pieces && pk.rise > 0;
    show(E.curve, curveOn);
    if (curveOn) {
      var ww = L.pk.ww * 1.1, cx0 = L.pk.cx - ww / 2, pts = [];
      for (var ci = 0; ci < N; ci++) {
        pts.push([cx0 + ww * ci / (N - 1), L.pk.base - Math.min(LOAD[ci], pk.ceil) * L.pk.amp * pk.rise]);
      }
      pts.push([cx0 + ww, L.pk.base + 2], [cx0, L.pk.base + 2]);
      setD(E.curve, polyD(pts));
    }
    var clOn = pieces && pk.cl > 0;
    show(E.ceil, clOn);
    if (clOn) {
      var half = L.pk.ww * 0.62 * pk.cl, cyl = L.pk.base - pk.ceil * L.pk.amp;
      E.ceil.setAttribute('x1', r2(L.pk.cx - half)); E.ceil.setAttribute('x2', r2(L.pk.cx + half));
      E.ceil.setAttribute('y1', r2(cyl)); E.ceil.setAttribute('y2', r2(cyl));
    }

    // EQUIPMENT station: the gauge, the needle, the still thermometer
    var eq = S.eq, R = L.eq.R, gOn = pieces && eq.grow > 0;
    show(E.gFace, gOn);
    if (gOn) {
      var Rg = R * eq.grow;
      setD(E.gFace, 'M' + r2(L.eq.cx - Rg) + ' ' + r2(L.eq.base) + 'A' + r2(Rg) + ' ' + r2(Rg) + ' 0 0 1 ' +
        r2(L.eq.cx + Rg) + ' ' + r2(L.eq.base) + 'Z');
    }
    var zOn = pieces && eq.zones > 0;
    show(E.zoneR, zOn); show(E.zoneP, zOn);
    if (zOn) {
      var rz = R * 0.78;
      setD(E.zoneR, arcD(L.eq.cx, L.eq.base, rz, -86, -27));
      setD(E.zoneP, arcD(L.eq.cx, L.eq.base, rz, -23, 86));
      E.zoneR.setAttribute('stroke-dashoffset', (1 - clamp(eq.zones / 0.35, 0, 1)).toFixed(4));
      E.zoneP.setAttribute('stroke-dashoffset', (1 - clamp((eq.zones - 0.35) / 0.65, 0, 1)).toFixed(4));
    }
    var nOn = pieces && eq.nl > 0;
    show(E.needle, nOn); show(E.hub, nOn);
    if (nOn) {
      var na = eq.na * Math.PI / 180, nlen = R * 0.84 * eq.nl;
      E.needle.setAttribute('x1', r2(L.eq.cx)); E.needle.setAttribute('y1', r2(L.eq.base));
      E.needle.setAttribute('x2', r2(L.eq.cx + Math.sin(na) * nlen));
      E.needle.setAttribute('y2', r2(L.eq.base - Math.cos(na) * nlen));
      E.hub.setAttribute('cx', r2(L.eq.cx)); E.hub.setAttribute('cy', r2(L.eq.base));
      E.hub.setAttribute('r', r2(R * 0.045 * Math.min(1, eq.nl * 2)));
    }
    show(E.thermo, pieces && eq.th);

    // the stamp
    show(E.stampG, S.stamp.o);
    if (S.stamp.o) {
      var scx = L.rx0 + L.Rw / 2, scy = L.yBand[0] + L.hBody / 2 + S.drop;
      E.stamp.setAttribute('x', r2(scx));
      E.stamp.setAttribute('y', r2(scy + L.sBase));
      E.stamp.style.fontVariationSettings = '"wdth" ' + S.stamp.w.toFixed(2) + ', "wght" 800';
      E.stampG.setAttribute('transform', 'translate(' + r2(scx) + ' ' + r2(scy) + ') scale(' + S.stamp.sc.toFixed(4) +
        ') translate(' + r2(-scx) + ' ' + r2(-scy) + ')');
    }

    // the original length, left behind as an outline
    show(E.outline, S.outline);

    // the mark
    show(E.plus, S.fold.o);
    if (S.fold.o) setD(E.plus, polyD(lerpPts(L.foldA, L.foldB, S.fold.m)));
    show(E.lockup, S.lock);
    var wl = -20 + (LOCK_H + 40) * S.wipe;
    E.cpMarkR.setAttribute('height', r2(Math.max(0, wl + 60)));
    E.cpSilR.setAttribute('y', r2(L.lockO[1] + L.k * wl));
    if (S.lock) {
      var rx = lerp(WORD_CLIP_R, -40, S.word);
      E.cpWordR.setAttribute('x', r2(rx));
      E.cpWordR.setAttribute('width', r2(Math.max(0, WORD_CLIP_R - rx)));
      E.wordSlide.setAttribute('transform', 'translate(' + r2((1 - S.word) * 420) + ' 0)');
    }

    // HTML type: labels ride inside their bands, held on screen while the camera is inside one
    for (var li2 = 0; li2 < 3; li2++) {
      var el = E.lbl[li2], vis = false;
      if (pieces && (S.lf < 0 || S.lf === li2)) {
        var X0 = SX(L.px0), X1 = SX(L.px1), Y0 = SY(yB[li2]), Y1 = SY(yB[li2] + L.bh[li2] * kk[li2]);
        var lx = Math.max(X0 + L.pad, L.edge), ly = Math.max(Y0 + L.pad, L.edge);
        lx = Math.min(lx, X1 - L.pad - L.lw[li2]);
        ly = Math.min(ly, Y1 - L.pad - L.lh);
        vis = X1 > 0 && X0 < W && Y1 > 0 && Y0 < H && lx >= X0 && ly >= Y0 - 1;
        if (vis) el.style.transform = 'translate(' + r2(lx) + 'px,' + r2(ly) + 'px)';
      }
      el.style.visibility = vis ? 'visible' : 'hidden';
    }
    E.num.style.visibility = S.numO ? 'visible' : 'hidden';
    if (S.numO) {
      E.num.style.transform = 'translate(' + r2(SX(W / 2)) + 'px,' + r2(SY((L.bottomR + L.bottom0) / 2)) + 'px) translate(-50%,-50%)';
    }
  }

  // ---------- boot ----------
  // Completion signal for the embedding page (redesign-v3): posted once, the moment the
  // timeline's progress reaches 1, regardless of how it got there (natural finish, skip-to-end,
  // or a resize rebuild that re-seeks past the end). Kept independent of GSAP's onComplete
  // slot/tl.eventCallback('onComplete', ...) because the parent page replaces that same slot
  // (see v2.js waitForTimeline) — two callers can't share one eventCallback, so this uses
  // onUpdate instead, which both the parent and this file leave alone.
  var doneNotified = false;
  function notifyDoneIfFinished() {
    if (doneNotified || !TL || TL.progress() < 1) return;
    doneNotified = true;
    try { window.parent.postMessage({ type: 'ep-intro-done' }, '*'); } catch (e) {}
  }

  function build() {
    if (TL) TL.kill();
    LAY = computeLayout();
    applyLayout(LAY);
    S = freshState(LAY);
    resetDom();
    doneNotified = false;
    TL = gsap.timeline({
      paused: true,
      onUpdate: function () { render(); notifyDoneIfFinished(); },
      defaults: { lazy: false, immediateRender: false }
    });
    buildHero(TL, LAY); // time-compressed derivation of buildFull(), see the comment above it
    window.tl = TL;
    render();
  }

  function seek(t) {
    TL.pause();
    TL.seek(clamp(+t || 0, 0, TL.duration()), false);
    render();
  }

  function start() {
    if (start.done) return;
    start.done = true;
    grab();
    if (CAPTURE) document.documentElement.classList.add('is-capture');
    gsap.config({ force3D: false });
    build();
    E.skip.addEventListener('click', function () {
      TL.pause();
      TL.progress(1);
      render();
      E.skip.blur();
    });
    window.motion = {
      seek: seek,
      duration: function () { return TL.duration(); },
      cut: CUT,
      layout: function () { return LAY; }
    };
    if (REDUCED) { TL.progress(1); render(); }
    else if (T_PARAM !== null && !isNaN(T_PARAM)) seek(T_PARAM);
    else TL.play(0);
    window.__motionReady = true;

    // ---------- skip-to-end: click / wheel / touchmove / keydown anywhere in the piece ----------
    // Embedding page (redesign-v3) drives the hand-off; this just jumps the timeline and
    // flags that it was a skip (vs. a natural finish) so the parent can pick a fast hand-off.
    window.__introSkipped = false;
    function introSkip() {
      if (!TL || window.__introSkipped) return;
      if (TL.progress() >= 1) return;
      window.__introSkipped = true;
      TL.pause();
      TL.progress(1);
      render();
    }
    window.introSkip = introSkip;
    document.addEventListener('click', introSkip, { passive: true });
    document.addEventListener('wheel', introSkip, { passive: true });
    document.addEventListener('touchmove', introSkip, { passive: true });
    document.addEventListener('keydown', introSkip);

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var t = TL.time(), playing = !TL.paused();
        build();
        TL.seek(t, false);
        render();
        if (playing) TL.play();
      }, 120);
    });
  }

  var fontsIn = document.fonts ? Promise.all([
    document.fonts.load('800 100px "Archivo"'),
    document.fonts.load('700 48px "Archivo"'),
    document.fonts.load('400 16px "Geist Mono"')
  ]).then(function () { return document.fonts.ready; }) : Promise.resolve();
  Promise.race([fontsIn, new Promise(function (r) { setTimeout(r, 2500); })]).then(start, start);
})();
