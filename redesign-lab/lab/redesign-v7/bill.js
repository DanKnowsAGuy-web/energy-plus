/* Energy Plus · bill cuts driver. Each card's bill bar and animation play once when the
   card comes into view; the number counts up with it. The payoff bar closes to the
   after-bill. "See the line items" opens the existing bill sheet. */
(function () {
  const root = document.querySelector(".v8-bill");
  if (!root) return;
  const qs = new URLSearchParams(location.search);
  const STILL = qs.has("static") ||
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const fmt = (v) => "$" + Math.round(v).toLocaleString("en-US");

  const count = (el, to, dur) => {
    if (STILL) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const playCard = (card) => {
    const bill = card.querySelector("[data-v8-bill]");
    card.querySelectorAll("[data-v8-play]").forEach((v) => v.classList.add("is-playing"));
    if (!bill) return;
    setTimeout(() => {
      bill.classList.add("is-played");
      const n = bill.querySelector("[data-v8-count]");
      if (n) count(n, parseFloat(n.getAttribute("data-v8-count")), 1100);
    }, STILL ? 0 : 700);
  };
  const playPayoff = (p) => setTimeout(() => p.classList.add("is-played"), STILL ? 0 : 300);

  const cards = Array.from(root.querySelectorAll(".v8-cut"));
  const payoff = root.querySelector(".v8-payoff");

  if (STILL || !("IntersectionObserver" in window)) {
    cards.forEach(playCard);
    if (payoff) playPayoff(payoff);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target === payoff) playPayoff(payoff); else playCard(e.target);
      });
    }, { threshold: 0.45 });
    cards.forEach((c) => io.observe(c));
    if (payoff) io.observe(payoff);
  }

  /* the line items sheet */
  const sheet = document.getElementById("v2-bill-sheet");
  const open = root.querySelector("[data-v8-lines]");
  if (sheet && open && sheet.showModal) {
    let last = null;
    const close = () => { sheet.classList.remove("is-in"); setTimeout(() => { if (sheet.open) sheet.close(); }, 260); };
    open.addEventListener("click", () => {
      last = document.activeElement;
      sheet.showModal();
      requestAnimationFrame(() => sheet.classList.add("is-in"));
    });
    const x = document.getElementById("v2-billsheet-close");
    if (x) x.addEventListener("click", close);
    sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
    sheet.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    sheet.addEventListener("close", () => { if (last) last.focus(); });
  }
})();
