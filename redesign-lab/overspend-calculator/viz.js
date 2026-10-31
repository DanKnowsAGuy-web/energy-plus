/* Energy+ overspend calculator, drawings. Inline SVG, line art in currentColor, hotspots in the mark color.
   window.EPViz = { building(facility, spots), demandCurve(r, opts), months(r, season, opts) } */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const S = (x) => String(Math.round(x * 10) / 10);

  /* ---------- building drawings ---------- */
  // Every drawing is 320 x 170. Ground at y = 150. Parts are reused across types.
  function rect(x, y, w, h, extra) { return `<rect x="${S(x)}" y="${S(y)}" width="${S(w)}" height="${S(h)}" ${extra || ''}/>`; }
  function line(x1, y1, x2, y2) { return `<line x1="${S(x1)}" y1="${S(y1)}" x2="${S(x2)}" y2="${S(y2)}"/>`; }
  function circle(cx, cy, r, extra) { return `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(r)}" ${extra || ''}/>`; }

  function windows(x, y, w, h, cols, rows, pad) {
    // a grid of windows inside a wall
    const g = []; const cw = (w - pad * (cols + 1)) / cols, ch = (h - pad * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.push(rect(x + pad + c * (cw + pad), y + pad + r * (ch + pad), cw, ch, 'rx="1"'));
    return g.join('');
  }
  function rtu(x, y, w) {
    // rooftop unit: box with a fan circle and a short duct
    const h = w * 0.55;
    return `<g class="spot-hvac">${rect(x, y - h, w, h, 'rx="1.5"')}${circle(x + w * 0.62, y - h * 0.5, h * 0.3)}${line(x + w * 0.62 - h * 0.3, y - h * 0.5, x + w * 0.62 + h * 0.3, y - h * 0.5)}${line(x + w * 0.62, y - h * 0.8, x + w * 0.62, y - h * 0.2)}${rect(x + 3, y - h + 3, w * 0.3, h * 0.35)}</g>`;
  }
  function meter(x, y) {
    // the utility meter on the wall: a box with a dial
    return `<g class="spot-demand">${rect(x, y, 14, 18, 'rx="2"')}${circle(x + 7, y + 8, 4)}${line(x + 7, y + 8, x + 9.5, y + 5.5)}${line(x + 3, y + 15, x + 11, y + 15)}</g>`;
  }
  function pole(x, groundY, toX, toY) {
    // utility pole with the service drop: where supply comes from
    return `<g class="spot-supply">${line(x, groundY, x, groundY - 110)}${line(x - 14, groundY - 100, x + 14, groundY - 100)}${line(x - 10, groundY - 100, x - 10, groundY - 96)}${line(x + 10, groundY - 100, x + 10, groundY - 96)}<path d="M${S(x + 10)} ${S(groundY - 96)} Q ${S((x + toX) / 2)} ${S(toY + 12)} ${S(toX)} ${S(toY)}"/></g>`;
  }
  function door(x, y, w, h) { return `${rect(x, y - h, w, h)}${circle(x + w - 3, y - h / 2, 0.8)}`; }
  function sign(x, y, w) { return `<g class="spot-lighting">${rect(x, y, w, 10, 'rx="1"')}${line(x + 4, y + 5, x + w - 4, y + 5)}</g>`; }
  function dock(x, y, w) { return `${rect(x, y - 26, w, 26)}${line(x, y - 18, x + w, y - 18)}${line(x, y - 10, x + w, y - 10)}${rect(x - 2, y - 2, w + 4, 2)}`; }
  function cases(x, y, n) {
    // refrigerated cases seen through glass: a run of upright boxes with shelf lines
    const g = []; for (let i = 0; i < n; i++) { const cx = x + i * 16; g.push(rect(cx, y - 22, 13, 22, 'rx="1"')); g.push(line(cx + 2, y - 15, cx + 11, y - 15)); g.push(line(cx + 2, y - 8, cx + 11, y - 8)); }
    return `<g class="spot-refrig">${g.join('')}</g>`;
  }
  function condenser(x, y, w) { return `<g class="spot-refrig">${rect(x, y - w * 0.5, w, w * 0.5, 'rx="1.5"')}${circle(x + w * 0.3, y - w * 0.25, w * 0.15)}${circle(x + w * 0.7, y - w * 0.25, w * 0.15)}</g>`; }
  function stack(x, y, h) { return `${rect(x, y - h, 6, h)}${line(x - 2, y - h, x + 8, y - h)}`; }
  function lights(x, y, w, n) {
    // exterior fixtures along the parapet
    const g = []; for (let i = 0; i < n; i++) { const lx = x + (i + 0.5) * (w / n); g.push(line(lx, y, lx, y - 8)); g.push(rect(lx - 5, y - 12, 10, 4, 'rx="1"')); }
    return `<g class="spot-lighting">${g.join('')}</g>`;
  }
  function body(x, y, w, h) { return `${rect(x, y - h, w, h)}${line(x - 3, y - h, x + w + 3, y - h)}`; }

  const G = 150; // ground
  const TYPES = {
    hotel: () => { const x = 60, w = 200, h = 118; return body(x, G, w, h) + windows(x, G - h + 6, w, h - 34, 8, 4, 5) + door(x + 88, G, 24, 26) + sign(x + 130, G - h - 14, 56) + rtu(x + 12, G - h, 32) + rtu(x + 58, G - h, 32) + rtu(x + 104, G - h - 0, 20) + meter(x + w - 20, G - 40); },
    office: () => { const x = 60, w = 200, h = 100; return body(x, G, w, h) + windows(x, G - h + 6, w, h - 30, 6, 3, 6) + door(x + 88, G, 24, 24) + rtu(x + 30, G - h, 40) + rtu(x + 130, G - h, 40) + meter(x + w - 20, G - 40) + lights(x, G - h - 2, w, 3); },
    healthcare: () => { const x = 40, w = 240, h = 90; return body(x, G, w, h) + windows(x, G - h + 6, w, h - 30, 8, 2, 6) + rect(x + 95, G - 30, 50, 30) + line(x + 90, G - 30, x + 150, G - 30) + door(x + 110, G, 20, 22) + rtu(x + 20, G - h, 44) + rtu(x + 100, G - h, 44) + rtu(x + 180, G - h, 44) + meter(x + w - 20, G - 40); },
    coldstorage: () => { const x = 40, w = 240, h = 90; return body(x, G, w, h) + dock(x + 20, G, 30) + dock(x + 70, G, 30) + dock(x + 120, G, 30) + condenser(x + 30, G - h, 50) + condenser(x + 120, G - h, 50) + rtu(x + 200, G - h, 28) + meter(x + w - 20, G - 40) + `<g class="spot-refrig">${rect(x + 170, G - 40, 40, 40)}${line(x + 170, G - 20, x + 210, G - 20)}</g>`; },
    supermarket: () => { const x = 40, w = 240, h = 70; return body(x, G, w, h) + rect(x + 10, G - 50, 220, 44) + cases(x + 20, G - 10, 8) + door(x + 160, G, 30, 40) + sign(x + 20, G - h - 14, 90) + rtu(x + 20, G - h, 40) + rtu(x + 80, G - h, 40) + rtu(x + 140, G - h, 40) + condenser(x + 200, G - h, 30) + meter(x + w - 20, G - 40); },
    retail: () => { const x = 60, w = 200, h = 66; return body(x, G, w, h) + rect(x + 10, G - 46, 180, 40) + line(x + 10, G - 30, x + 190, G - 30) + door(x + 88, G, 24, 40) + rect(x - 6, G - 52, w + 12, 4) + sign(x + 76, G - h - 14, 50) + rtu(x + 10, G - h, 40) + rtu(x + 140, G - h, 40) + meter(x + w - 20, G - 40) + lights(x, G - h - 2, w, 3); },
    qsr: () => { const x = 80, w = 160, h = 60; return body(x, G, w, h) + rect(x + 10, G - 44, 60, 34) + door(x + 84, G, 22, 36) + rect(x + w - 22, G - 40, 16, 20) + line(x + w - 30, G - 30, x + w + 20, G - 30) + stack(x + 30, G - h, 22) + rtu(x + 90, G - h, 40) + meter(x + w - 20, G - 40) + `<g class="spot-refrig">${rect(x + w + 6, G - 46, 34, 46)}${line(x + w + 6, G - 24, x + w + 40, G - 24)}</g>` + sign(x + 20, G - h - 14, 50); },
    cstore: () => { const x = 130, w = 130, h = 56; return body(x, G, w, h) + rect(x + 8, G - 42, 70, 34) + cases(x + 10, G - 10, 4) + door(x + 92, G, 22, 36) + rtu(x + 20, G - h, 36) + rtu(x + 80, G - h, 36) + meter(x + w - 20, G - 40) + rect(30, G - 70, 90, 8) + line(40, G - 62, 40, G) + line(100, G - 62, 100, G) + rect(60, G - 30, 12, 30) + lights(30, G - 72, 90, 2); },
    warehouse: () => { const x = 40, w = 240, h = 84; return body(x, G, w, h) + dock(x + 20, G, 34) + dock(x + 74, G, 34) + dock(x + 128, G, 34) + windows(x + 180, G - h + 8, 50, 20, 2, 1, 5) + rtu(x + 40, G - h, 30) + rtu(x + 160, G - h, 30) + meter(x + w - 20, G - 40) + lights(x, G - h - 2, w, 4); },
    multifamily: () => { const x = 60, w = 200, h = 104; let s = body(x, G, w, h) + windows(x, G - h + 6, w, h - 30, 5, 3, 8) + door(x + 88, G, 24, 24); for (let r = 0; r < 3; r++) { const y = G - h + 6 + 8 + r * ((h - 30 - 32) / 3 + 8) + 20; s += line(x - 4, y, x + 30, y) + line(x + w - 30, y, x + w + 4, y); } return s + rtu(x + 40, G - h, 30) + rtu(x + 130, G - h, 30) + meter(x + w - 20, G - 40); },
    education: () => { const x = 30, w = 180, h = 74; return body(x, G, w, h) + windows(x, G - h + 6, w, h - 30, 6, 2, 6) + door(x + 78, G, 24, 24) + rect(220, G - 96, 70, 96) + line(217, G - 96, 293, G - 96) + rtu(x + 20, G - h, 36) + rtu(x + 100, G - h, 36) + rtu(230, G - 96, 48) + meter(275, G - 40) + sign(x + 60, G - h - 14, 60); },
    fitness: () => { const x = 50, w = 220, h = 70; return body(x, G, w, h) + rect(x + 10, G - 54, 200, 46) + line(x + 10, G - 32, x + 210, G - 32) + door(x + 98, G, 24, 46) + rtu(x + 10, G - h, 44) + rtu(x + 160, G - h, 44) + meter(x + w - 20, G - 40) + sign(x + 80, G - h - 14, 60); },
    manufacturing: () => { const x = 30, w = 260, h = 80; let s = body(x, G, w, h) + dock(x + 200, G, 34); for (let i = 0; i < 4; i++) { const sx = x + i * 65; s += `<path d="M${S(sx)} ${S(G - h)} L${S(sx + 40)} ${S(G - h - 26)} L${S(sx + 40)} ${S(G - h)}"/>`; } return s + stack(x + 250, G - h, 40) + rtu(x + 100, G - h, 30) + meter(x + w - 20, G - 40) + `<g class="spot-motors">${rect(x + 20, G - 40, 60, 30)}${circle(x + 50, G - 25, 8)}</g>`; },
    datacenter: () => { const x = 40, w = 240, h = 84; let s = body(x, G, w, h) + door(x + 110, G, 20, 22) + rect(x + w + 6, G - 30, 30, 30); for (let i = 0; i < 5; i++) s += condenser(x + 12 + i * 46, G - h, 36); return s + meter(x + w - 20, G - 40); },
    lab: () => { const x = 60, w = 200, h = 96; let s = body(x, G, w, h) + windows(x, G - h + 6, w, h - 30, 6, 3, 6) + door(x + 88, G, 24, 24); for (let i = 0; i < 6; i++) s += stack(x + 15 + i * 32, G - h, 18 + (i % 2) * 8); return s + rtu(x + 70, G - h - 2, 44) + meter(x + w - 20, G - 40); },
    mixeduse: () => { const x = 60, w = 200, h = 108; return body(x, G, w, h) + rect(x + 10, G - 42, 80, 36) + door(x + 110, G, 22, 36) + line(x - 3, G - 46, x + w + 3, G - 46) + windows(x, G - h + 6, w, 52, 6, 2, 6) + sign(x + 20, G - 54, 60) + rtu(x + 30, G - h, 36) + rtu(x + 130, G - h, 36) + meter(x + w - 20, G - 40); }
  };

  const SPOT_CLASS = { hvac: 'spot-hvac', demand: 'spot-demand', refrig: 'spot-refrig', lighting: 'spot-lighting', supply: 'spot-supply', motors: 'spot-motors' };

  function building(facility, spots) {
    const draw = TYPES[facility] || TYPES.office;
    const svgBody = draw();
    const sup = spots && spots.includes('supply') ? pole(22, G, 60, G - 60) : '';
    return `<svg class="bldg" viewBox="0 0 320 170" width="100%" role="img" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">${line(8, G, 312, G)}${sup}${svgBody}</g></svg>`;
  }

  /* ---------- 24 hour demand curve ---------- */
  function demandCurve(opts) {
    // opts: { flat:boolean, hoursWeek, shave (0..1 fraction of the peak above base removed), peakLabel, shavedLabel }
    const W = 320, H = 120, L = 14, R = 14, T = 20, B = 26;
    const flat = !!opts.flat; const hours = opts.hoursWeek || 60;
    const openFrac = Math.min(1, hours / 168);
    const base = flat ? 0.62 : 0.28;                    // night load as a share of peak
    const amp = 1 - base;
    const startH = flat ? 0 : 6, endH = flat ? 24 : Math.min(23, 6 + Math.round(openFrac * 24 * 7 / 7 * (24 / 24) * 1) + 8);
    const pts = []; for (let h = 0; h <= 24; h += 0.5) {
      let v = base;
      if (!flat) { const mid = (startH + endH) / 2, half = (endH - startH) / 2; if (h > startH && h < endH) { const x = (h - mid) / half; v = base + amp * Math.max(0, 1 - x * x) * (0.75 + 0.25 * Math.cos((h - 14) / 2)); } }
      else { v = base + amp * 0.35 * (0.5 + 0.5 * Math.cos((h - 15) / 24 * Math.PI * 2)) + 0.02 * Math.sin(h * 1.7); }
      pts.push([h, Math.min(1, v)]);
    }
    const peakIdx = pts.reduce((m, p, i) => p[1] > pts[m][1] ? i : m, 0);
    const peak = pts[peakIdx][1];
    const shave = Math.max(0, Math.min(1, opts.shave || 0));
    const cap = peak - (peak - base) * shave;
    const X = (h) => L + (h / 24) * (W - L - R), Y = (v) => T + (1 - v) * (H - T - B);
    const path = (arr) => arr.map((p, i) => (i ? 'L' : 'M') + S(X(p[0])) + ' ' + S(Y(p[1]))).join(' ');
    const shaved = pts.map(p => [p[0], Math.min(p[1], cap)]);
    const ticks = [0, 6, 12, 18, 24].map(h => `<line x1="${S(X(h))}" y1="${S(H - B + 2)}" x2="${S(X(h))}" y2="${S(H - B + 6)}"/><text x="${S(X(h))}" y="${S(H - 6)}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${h === 0 ? '12am' : h === 12 ? 'noon' : h === 24 ? '12am' : (h > 12 ? (h - 12) + 'pm' : h + 'am')}</text>`).join('');
    const px = X(pts[peakIdx][0]), py = Y(peak), cy = Y(cap);
    return `<svg class="dcurve" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${opts.aria || ''}">
      <g class="axis" fill="none" stroke="currentColor" stroke-width="1" opacity=".35"><line x1="${L}" y1="${S(H - B)}" x2="${S(W - R)}" y2="${S(H - B)}"/>${ticks}</g>
      <path class="load" d="${path(pts)}" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path class="shaved" d="${path(shaved)}" fill="none" stroke="var(--mark)" stroke-width="2.2"/>
      <g class="peak"><line x1="${S(px - 14)}" y1="${S(py)}" x2="${S(px + 14)}" y2="${S(py)}" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/><circle cx="${S(px)}" cy="${S(py)}" r="3.5" fill="var(--mark)" stroke="none"/><text x="${L}" y="${S(T - 8)}" class="lbl">${opts.peakLabel || ''}</text></g>
      <g class="capline"><line x1="${L}" y1="${S(cy)}" x2="${S(W - R)}" y2="${S(cy)}" stroke="var(--mark)" stroke-width="1" stroke-dasharray="3 3"/><text x="${S(W - R)}" y="${S(T - 8)}" text-anchor="end" class="lbl mark">${opts.shavedLabel || ''}</text></g>
    </svg>`;
  }

  /* ---------- twelve months of bills ---------- */
  function months(opts) {
    // opts: { index:[12 numbers], monthlyAvg, highlight:[month idx...], overspendShare (0..1 of each month), labels:[12 short names], aria }
    const W = 320, H = 120, L = 8, R = 8, T = 14, B = 22;
    const idx = opts.index; const max = Math.max(...idx) * 1.08;
    const bw = (W - L - R) / 12; const Y = (v) => T + (1 - v / max) * (H - T - B);
    let bars = '';
    idx.forEach((v, i) => {
      const x = L + i * bw + bw * 0.15, w = bw * 0.7, y = Y(v), h = (H - B) - y;
      const hi = opts.highlight && opts.highlight.includes(i);
      const os = (opts.overspendShare || 0) * h;
      bars += `<g class="mbar ${hi ? 'hi' : ''}" style="--d:${i * 45}ms"><rect x="${S(x)}" y="${S(y)}" width="${S(w)}" height="${S(h)}" rx="1.5" class="bill"/>${os > 0 ? `<rect x="${S(x)}" y="${S(y)}" width="${S(w)}" height="${S(os)}" rx="1.5" class="os"/>` : ''}<text x="${S(x + w / 2)}" y="${S(H - 6)}" text-anchor="middle">${opts.labels[i]}</text></g>`;
    });
    return `<svg class="mbars" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${opts.aria || ''}"><line x1="${L}" y1="${S(H - B)}" x2="${S(W - R)}" y2="${S(H - B)}" stroke="currentColor" stroke-width="1" opacity=".35"/>${bars}</svg>`;
  }

  /* ---------- distortion: clean power on the left, distorted on the right, the same machine in both ---------- */
  // 320 x 150. Each panel: a wave, an arrow, the facility's typical machine. The right panel runs hot.
  function machine(kind, x, y) {
    // x,y = bottom-left of the machine; ~64 wide, ~44 tall
    if (kind === 'rack') {
      const g = [rect(x, y - 52, 44, 52, 'rx="2"')];
      for (let i = 0; i < 4; i++) { g.push(rect(x + 5, y - 46 + i * 12, 34, 8, 'rx="1"')); g.push(circle(x + 34, y - 42 + i * 12, 1.3, 'class="dz-led"')); }
      return `<g class="dz-machine">${g.join('')}</g>`;
    }
    if (kind === 'motor') {
      return `<g class="dz-machine">${rect(x, y - 30, 48, 30, 'rx="4"')}${line(x + 8, y - 24, x + 8, y - 6)}${line(x + 16, y - 24, x + 16, y - 6)}${line(x + 24, y - 24, x + 24, y - 6)}${rect(x + 48, y - 20, 12, 10)}${rect(x - 4, y - 2, 56, 2)}<g class="dz-fan">${circle(x + 38, y - 15, 7)}${line(x + 38, y - 22, x + 38, y - 8)}${line(x + 31, y - 15, x + 45, y - 15)}</g></g>`;
    }
    if (kind === 'case') {
      const g = [rect(x, y - 44, 60, 44, 'rx="1.5"'), line(x + 4, y - 30, x + 40, y - 30), line(x + 4, y - 18, x + 40, y - 18)];
      g.push(`<g class="dz-fan">${circle(x + 50, y - 12, 6)}${line(x + 50, y - 18, x + 50, y - 6)}${line(x + 44, y - 12, x + 56, y - 12)}</g>`);
      return `<g class="dz-machine">${g.join('')}</g>`;
    }
    // default: a packaged unit with a fan
    return `<g class="dz-machine">${rect(x, y - 40, 64, 40, 'rx="2"')}${line(x + 6, y - 30, x + 30, y - 30)}${line(x + 6, y - 22, x + 30, y - 22)}${line(x + 6, y - 14, x + 30, y - 14)}<g class="dz-fan">${circle(x + 48, y - 20, 11)}${line(x + 48, y - 31, x + 48, y - 9)}${line(x + 37, y - 20, x + 59, y - 20)}</g></g>`;
  }
  function wave(x, y, w, dirty) {
    if (!dirty) { const a = 9, seg = w / 4; let d = `M${S(x)} ${S(y)}`; for (let i = 0; i < 4; i++) { const sx = x + i * seg; d += ` C ${S(sx + seg * 0.25)} ${S(y - a * 2.2 * (i % 2 ? -1 : 1))}, ${S(sx + seg * 0.75)} ${S(y - a * 2.2 * (i % 2 ? -1 : 1))}, ${S(sx + seg)} ${S(y)}`; } return d; }
    // the distorted wave: the same rhythm with spikes and notches on it
    const pts = [[0, 0], [4, -14], [8, -6], [12, -22], [16, -9], [20, -19], [24, -4], [28, 2], [32, 18], [36, 7], [40, 21], [44, 11], [48, 16], [52, 3], [56, -2], [60, -16], [64, -8], [68, -20], [72, -5], [76, 1], [80, 14], [84, 20], [88, 9], [92, 17], [96, 4], [100, 0]];
    return 'M' + pts.map(p => `${S(x + p[0] / 100 * w)} ${S(y + p[1] * 0.85)}`).join(' L ');
  }
  function distortion(opts) {
    const o = opts || {}; const kind = o.kind || 'unit';
    const panel = (x0, dirty) => {
      const wx = x0 + 10, wy = 62, ww = 60; const mx = x0 + 88, my = 108;
      const heat = dirty ? `<g class="dz-heat">${['M-12 -46 c-3 -6 3 -10 0 -16', 'M0 -50 c-3 -6 3 -10 0 -16', 'M12 -46 c-3 -6 3 -10 0 -16'].map(d => `<path d="${d}" transform="translate(${S(mx + 32)} ${S(my)})"/>`).join('')}</g>` : '';
      return `<g class="dz-panel ${dirty ? 'dz-hot' : 'dz-cool'}">${dirty ? rect(x0, 0, 160, 150, 'class="dz-wash"') : ''}
        <text class="dz-lbl" x="${S(x0 + 10)}" y="20">${dirty ? o.dirtyLabel : o.cleanLabel}</text>
        <path class="dz-wave ${dirty ? 'dz-dirty' : 'dz-clean'}" d="${wave(wx, wy, ww, dirty)}"/>
        ${line(wx + ww + 4, wy, mx - 6, wy)}<path class="dz-arrow" d="M${S(mx - 11)} ${S(wy - 4)} L${S(mx - 6)} ${S(wy)} L${S(mx - 11)} ${S(wy + 4)}"/>
        ${machine(kind, mx, my)}${heat}
        <text class="dz-cap" x="${S(x0 + 10)}" y="138">${dirty ? o.hotCap : o.coolCap}</text>
      </g>`;
    };
    return `<svg class="dz" viewBox="0 0 320 150" role="img" aria-label="${o.aria || ''}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${panel(0, false)}${line(160, 8, 160, 142)}${panel(160, true)}</svg>`;
  }

  root.EPViz = { distortion, building, demandCurve, months, SPOT_CLASS };
})(typeof window !== 'undefined' ? window : globalThis);
