/* Energy+ · redesign v7 · motion pass
   Progressive enhancement on top of v2.js. Runs only when v2.js has set .v2-anim
   (motion allowed, not ?static=1); otherwise the page keeps v6's still states. */
(() => {
  "use strict";
  const root = document.documentElement;
  if (!root.classList.contains("v2-anim")) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const once = (el, fn, threshold = 0.4) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(el);
  };

  /* one scroll loop for everything scroll-linked below */
  const onScroll = [];
  let ticking = false;
  const runScroll = () => { ticking = false; onScroll.forEach((f) => f()); };
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } };
  addEventListener("scroll", requestScroll, { passive: true });
  addEventListener("resize", requestScroll, { passive: true });

  /* ---------- 1. the "Your energy bill" icon grows into the bill card ----------
     Scrubbed by scroll. A stand-in leaves the icon, grows and drifts to wherever the
     bill card is, turning from the petrol icon into the white card, then hands off. */
  (() => {
    const icon = document.querySelector(".v5-map__item:first-child .v5-map__ic");
    const card = document.querySelector("[data-billcard]");
    if (!icon || !card) return;
    const ghost = document.createElement("div");
    ghost.className = "v7-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.innerHTML = '<div class="v7-ghost__fill"></div><div class="v7-ghost__ic">' + icon.innerHTML + "</div>";
    document.body.appendChild(ghost);
    const fill = ghost.firstChild, glyph = ghost.lastChild;
    const cardRadius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 28;
    const iconRadius = parseFloat(getComputedStyle(icon).borderTopLeftRadius) || 12;

    let s0 = 0, s1 = 1;
    const measure = () => {
      const y = scrollY, vh = innerHeight;
      const ir = icon.getBoundingClientRect();
      // start when the icon's middle passes 55% of the screen; land when the card is
      // in the lower-middle of the screen (measured from its unstuck position)
      s0 = ir.top + y + ir.height / 2 - vh * 0.55;
      const media = card.closest(".v2-pin__media");
      const prevPos = media ? media.style.position : "";
      if (media) media.style.position = "relative";
      const cardTop = card.getBoundingClientRect().top + y;
      if (media) media.style.position = prevPos;
      // phones: the card is right below, so the flight can finish high on the screen;
      // wide screens: the card sits far to the right, so hand off as soon as it peeks in
      s1 = Math.max(s0 + 200, cardTop - vh * (innerWidth >= 980 ? 0.8 : 0.45));
    };
    measure();
    addEventListener("resize", measure, { passive: true });
    addEventListener("load", measure);
    setTimeout(measure, 1300);

    let shown = false;
    const update = () => {
      const p = clamp((scrollY - s0) / (s1 - s0));
      icon.style.opacity = p > 0 ? "0" : "";
      if (p <= 0 || p >= 1) {
        card.style.opacity = "";
        if (shown) { ghost.classList.remove("is-on"); shown = false; }
        return;
      }
      card.style.opacity = clamp((p - 0.86) / 0.14).toFixed(3);
      if (!shown) { ghost.classList.add("is-on"); shown = true; }
      const e = easeInOut(p);
      const a = icon.getBoundingClientRect(), b = card.getBoundingClientRect();
      const x = lerp(a.left, b.left, e), yy = lerp(a.top, b.top, e);
      const w = lerp(a.width, b.width, e), h = lerp(a.height, b.height, e);
      ghost.style.transform = "translate3d(" + x.toFixed(1) + "px," + yy.toFixed(1) + "px,0)";
      ghost.style.width = w.toFixed(1) + "px";
      ghost.style.height = h.toFixed(1) + "px";
      ghost.style.borderRadius = lerp(iconRadius, cardRadius, clamp(e * 1.4)).toFixed(1) + "px";
      ghost.style.opacity = (1 - clamp((p - 0.9) / 0.1)).toFixed(3);
      fill.style.opacity = (1 - clamp((e - 0.25) / 0.45)).toFixed(3);
      const g = 24 * (1 + 1.6 * clamp(e / 0.6));
      glyph.style.width = glyph.style.height = g.toFixed(1) + "px";
      glyph.style.opacity = (1 - clamp((e - 0.45) / 0.25)).toFixed(3);
      glyph.style.color = e > 0.4 ? "var(--petrol)" : "#fff";
    };
    onScroll.push(update);
    update();
  })();

  /* ---------- 2. the peak on the desktop building: see building.js (v7 block) ---------- */

  /* ---------- 3. the replacement year counts forward with the flag ---------- */
  (() => {
    const viz = document.querySelector('[data-viz="replacement"]');
    const year = viz && viz.querySelector(".v7-year");
    const flag = viz && viz.querySelector(".v2-replace-flag");
    if (!year || !flag) return;
    const X0 = 154.4, X1 = 266.4, Y0 = 2031, Y1 = 2041;
    let raf = 0, running = false;
    const read = () => {
      const m = getComputedStyle(flag).transform;
      const x = m && m !== "none" ? new DOMMatrixReadOnly(m).m41 : X0;
      return clamp((x - X0) / (X1 - X0));
    };
    const loop = () => {
      const k = read();
      year.textContent = String(Math.round(lerp(Y0, Y1, k)));
      if (k >= 0.999) { year.classList.add("is-done"); running = false; return; }
      raf = requestAnimationFrame(loop);
    };
    new MutationObserver(() => {
      if (viz.classList.contains("is-in") && !running) { running = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    }).observe(viz, { attributes: true, attributeFilter: ["class"] });
  })();

  /* ---------- 4. chaos becomes order ----------
     The vendors from "why isn't anyone fixing this" show up scattered over the stack,
     then each flies into the row that replaces it, and that row ticks. */
  (() => {
    const stack = document.querySelector("#the-fixes .v5-stack");
    if (!stack) return;
    const rows = Array.from(stack.children);
    if (rows.length < 7) return;
    const wrap = document.createElement("div");
    wrap.className = "v7-stackwrap";
    stack.parentNode.insertBefore(wrap, stack);
    wrap.appendChild(stack);
    stack.classList.add("v7-stack");
    const layer = document.createElement("div");
    layer.className = "v7-chips";
    layer.setAttribute("aria-hidden", "true");
    wrap.appendChild(layer);

    // [label, row it lands in, scatter x%, scatter y%, tilt]
    const CHIPS = [
      ["Solar", 2, 8, 6, -7], ["Battery", 2, 56, 3, 5], ["HVAC", 2, 30, 26, -3], ["Controls", 2, 68, 30, 8],
      ["Finance", 4, 4, 48, 4], ["Rebates", 5, 42, 55, -9], ["Installer", 3, 14, 78, -4], ["Tax", 5, 62, 78, 6]
    ];
    const chips = CHIPS.map(([label, row, x, y, r]) => {
      const el = document.createElement("span");
      el.className = "v7-chip";
      el.textContent = label;
      layer.appendChild(el);
      return { el, row, x, y, r };
    });

    const play = () => {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      stack.classList.add("is-chaos");
      chips.forEach((c, i) => {
        const cw = c.el.offsetWidth, ch = c.el.offsetHeight;
        c.x0 = clamp(c.x / 100 * W, 6, W - cw - 6);
        c.y0 = clamp(c.y / 100 * H, 6, H - ch - 6);
        c.el.animate([
          { opacity: 0, transform: `translate(${c.x0}px, ${c.y0 + 36}px) rotate(${c.r * -2}deg) scale(0.85)` },
          { opacity: 1, transform: `translate(${c.x0}px, ${c.y0}px) rotate(${c.r}deg) scale(1)` }
        ], { duration: 650, delay: i * 70, easing: "cubic-bezier(0.3, 1.4, 0.5, 1)", fill: "forwards" });
      });

      const T0 = 1500, STEP = 430, FLY = 700;
      rows.forEach((li, i) => {
        const mine = chips.filter((c) => c.row === i);
        const t = T0 + i * STEP;
        mine.forEach((c, k) => {
          setTimeout(() => {
            const wr = wrap.getBoundingClientRect();
            const nr = li.querySelector(".v5-stack__name").getBoundingClientRect();
            const x1 = nr.left - wr.left - 6, y1 = nr.top - wr.top + nr.height / 2 - c.el.offsetHeight / 2;
            c.el.animate([
              { opacity: 1, transform: `translate(${c.x0}px, ${c.y0}px) rotate(${c.r}deg) scale(1)` },
              { opacity: 1, transform: `translate(${lerp(c.x0, x1, 0.75)}px, ${lerp(c.y0, y1, 0.85)}px) rotate(0deg) scale(0.8)`, offset: 0.7 },
              { opacity: 0, transform: `translate(${x1}px, ${y1}px) rotate(0deg) scale(0.5)` }
            ], { duration: FLY, easing: "cubic-bezier(0.5, 0, 0.25, 1)", fill: "forwards" });
          }, t + k * 90);
        });
        setTimeout(() => li.classList.add("v7-done"), t + (mine.length ? FLY - 120 + (mine.length - 1) * 90 : 250));
      });
      setTimeout(() => stack.classList.remove("is-chaos"), T0 + rows.length * STEP + FLY);
    };
    once(wrap, play, 0.45);
  })();

  /* ---------- 5. the three steps ----------
     Phones: a line runs down through the three cards as you scroll; each card lights as
     the line reaches it. Wider screens: the cards light in turn when they come into view.
     Lighting a card plays its small picture. */
  (() => {
    const steps = document.querySelector(".v6-steps");
    if (!steps) return;
    const track = steps.querySelector(".v2-carousel__track");
    const cards = Array.from(track.children);
    const spine = document.createElement("div");
    spine.className = "v7-spine";
    spine.innerHTML = '<span class="v7-spine__fill"></span>';
    track.appendChild(spine);
    const nodes = cards.map(() => { const n = document.createElement("span"); n.className = "v7-node"; track.appendChild(n); return n; });
    const phone = () => matchMedia("(max-width: 639.9px)").matches;

    let ys = [];
    const layout = () => {
      if (!phone()) return;
      ys = cards.map((c) => { const num = c.querySelector(".v2-carousel__num"); return c.offsetTop + num.offsetTop + num.offsetHeight / 2; });
      nodes.forEach((n, i) => { n.style.top = ys[i] + "px"; });
      spine.style.top = ys[0] + "px";
      spine.style.height = (ys[ys.length - 1] - ys[0]) + "px";
    };
    const update = () => {
      if (!phone()) return;
      const top = track.getBoundingClientRect().top;
      const line = innerHeight * 0.58 - top;        // where the reading line crosses the track
      const p = clamp((line - ys[0]) / (ys[ys.length - 1] - ys[0]));
      spine.style.setProperty("--p", p.toFixed(4));
      cards.forEach((c, i) => {
        if (line >= ys[i] - 2) { c.classList.add("is-lit"); nodes[i].classList.add("is-lit"); }
      });
    };
    layout();
    addEventListener("resize", () => { layout(); update(); }, { passive: true });
    addEventListener("load", () => { layout(); update(); });
    onScroll.push(update);
    update();

    // wider screens: light in turn on arrival
    once(track, () => { if (!phone()) cards.forEach((c, i) => setTimeout(() => c.classList.add("is-lit"), i * 450)); }, 0.35);
    addEventListener("resize", () => { if (!phone()) cards.forEach((c) => c.classList.add("is-lit")); }, { passive: true });

    // the promise underneath lands like a seal
    const floor = document.querySelector("#the-exam .v2-floor");
    once(floor, () => setTimeout(() => floor.classList.add("v7-sealed"), 250), 0.7);
  })();

  /* ---------- 6. Cliff ---------- */
  (() => {
    const bento = document.querySelector(".v2-bento--cliff");
    if (!bento) return;

    // the big figures flip into place, letter by letter, like a departures board
    const UP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", LO = "abcdefghijklmnopqrstuvwxyz", DIG = "0123456789";
    const poolFor = (ch) => (/[0-9]/.test(ch) ? DIG : /[A-Z]/.test(ch) ? UP : /[a-z]/.test(ch) ? LO : null);
    const figs = Array.from(bento.querySelectorAll(".v2-cliff-slot .v2-card__fig"));
    const prep = (fig) => {
      if (fig.dataset.v7) return;
      const text = fig.textContent;
      fig.dataset.v7 = text;
      fig.textContent = "";
      const sr = document.createElement("span"); sr.className = "v7-sr"; sr.textContent = text;
      const vis = document.createElement("span"); vis.setAttribute("aria-hidden", "true");
      [...text].forEach((ch) => { const s = document.createElement("span"); s.className = "v7-flap"; s.textContent = ch; vis.appendChild(s); });
      fig.append(sr, vis);
    };
    const flap = (fig) => {
      prep(fig);
      if (fig._v7timer) return;
      const spans = Array.from(fig.querySelectorAll(".v7-flap"));
      spans.forEach((s) => { s.style.width = ""; });
      spans.forEach((s) => { s.style.width = s.getBoundingClientRect().width + "px"; });
      const final = spans.map((s) => s.textContent);
      const left = final.map((ch, i) => (poolFor(ch) ? 5 + i * 2 : 0));
      fig._v7timer = setInterval(() => {
        let busy = false;
        spans.forEach((s, i) => {
          if (left[i] <= 0) return;
          left[i]--;
          const pool = poolFor(final[i]);
          s.textContent = left[i] === 0 ? final[i] : pool[(Math.random() * pool.length) | 0];
          s.classList.remove("is-tick"); void s.offsetWidth; s.classList.add("is-tick");
          if (left[i] > 0) busy = true;
        });
        if (!busy) { clearInterval(fig._v7timer); fig._v7timer = 0; }
      }, 55);
    };
    figs.forEach(prep);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => figs.forEach((f) => f.querySelectorAll(".v7-flap").forEach((s) => { s.style.width = ""; })));

    // first time each card is seen (also works in the phone swipe row)
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => flap(e.target.querySelector(".v2-card__fig")), 200); }
      }), { threshold: 0.6 });
      bento.querySelectorAll(".v2-cliff-slot").forEach((c) => io.observe(c));
    }
    // and every time the rotation brings a credential into a slot
    new MutationObserver((ms) => ms.forEach((m) => {
      const was = m.oldValue || "", now = m.target.className;
      const had = /v2-cliff-slot--p\d/.test(was), has = /v2-cliff-slot--p\d/.test(now);
      if (!had && has) setTimeout(() => flap(m.target.querySelector(".v2-card__fig")), 120);
    })).observe(bento, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });

    // the photo drifts a little slower than the page
    const photo = bento.querySelector(".v2-card--photo");
    const img = photo && photo.querySelector("img");
    if (img) {
      onScroll.push(() => {
        const r = photo.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const k = clamp((innerHeight - r.top) / (innerHeight + r.height)) * 2 - 1;   // -1..1 across the screen
        img.style.setProperty("--py", (-k * r.height * 0.045).toFixed(1) + "px");
      });
    }
  })();

  /* ---------- 7. cash flow ---------- */
  (() => {
    const box = document.querySelector("[data-v7-money]");
    const svg = box && box.querySelector("svg");
    const gap = svg && svg.querySelector(".v7-gap");
    if (!gap) return;
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
    const defs = mk("defs", {}, svg);
    const clip = mk("clipPath", { id: "v7-gap-clip" }, defs);
    const sweep = mk("rect", { x: 0, y: 0, width: 0, height: 150 }, clip);
    gap.setAttribute("clip-path", "url(#v7-gap-clip)");
    // day one: the first month already sits above the payment
    mk("circle", { class: "v7-dayone-ring", cx: 20, cy: 58, r: 6, fill: "none", stroke: "var(--petrol)", "stroke-width": 2 }, svg);
    mk("circle", { class: "v7-dayone-dot", cx: 20, cy: 58, r: 5, fill: "var(--petrol)" }, svg);

    once(box, () => {
      box.classList.add("is-on");
      const t0 = performance.now() + 1500, D = 1300;
      const step = (now) => {
        const k = clamp((now - t0) / D);
        sweep.setAttribute("width", (390 * easeInOut(k)).toFixed(1));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 0.5);
  })();

  requestScroll();
})();
