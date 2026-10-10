/* Energy Plus · scroll scrub (motion preview)
   Two small scroll-linked moves, no library:
   1. [data-scrub-words]: the line lights word by word as it travels up the
      viewport, the way Apple reads a statement to you. Nested spans (like
      .dim) keep their own colour; only the light level is scrubbed.
   2. The hero hands off: as you leave it, the copy lifts and fades and the
      plate darkens, so the cold open dissolves into the problem.
   Reduced motion or no JS: everything stays fully lit and still. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };

  /* ---------- word scrub ---------- */
  function wrapWords(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "sw";
          s.textContent = part;
          frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && !n.matches("sup, svg")) {
        wrapWords(n);
      }
    });
  }
  var lines = [].slice.call(document.querySelectorAll("[data-scrub-words]")).map(function (el) {
    el.classList.remove("reveal", "reveal--mask", "is-in");
    wrapWords(el);
    el.classList.add("scrub-on");
    return { el: el, words: [].slice.call(el.querySelectorAll(".sw")), last: -1 };
  });

  /* ---------- hero hand-off ---------- */
  var hero = document.querySelector(".hero");

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    lines.forEach(function (L) {
      var r = L.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      // lit from when the line enters the lower fifth until it reaches 40% height
      var p = clamp((vh * 0.88 - r.top) / (vh * 0.5));
      if (Math.abs(p - L.last) < 0.002) return;
      L.last = p;
      var n = L.words.length, spread = n + 2;
      L.words.forEach(function (w, i) { w.style.setProperty("--k", clamp(p * spread - i).toFixed(3)); });
    });
    if (hero) {
      var h = hero.offsetHeight;
      hero.style.setProperty("--hx", clamp(window.scrollY / (h * 0.85)).toFixed(4));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  document.documentElement.classList.add("scrub-ready");
  update();
})();
