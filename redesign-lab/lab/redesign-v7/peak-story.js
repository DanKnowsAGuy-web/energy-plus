/* Energy Plus · peak story driver. Sets data-stage on the figure in sequence and
   rolls the demand-charge number. Plays the first time chapter 02 is on screen
   and active; Replay runs it again. Reduced motion or ?static shows the end state. */
(function () {
  const fig = document.querySelector("[data-peak-story]");
  if (!fig) return;
  const cap = fig.querySelector("[data-ps-cap]");
  const num = fig.querySelector("[data-ps-num]");
  const replay = fig.querySelector("[data-ps-replay]");
  const tagKw = fig.querySelector(".ps-tag-kw");
  const ceilKw = fig.querySelector(".ps-ceil-kw");
  const chapter = fig.closest(".v2-chapter");

  const qs = new URLSearchParams(location.search);
  const STILL = qs.has("static") ||
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const CAPS = [
    "A normal day.",
    "A normal day.",
    "2:15 pm. Everything runs at once for 15 minutes.",
    "That one moment is billed for all 30 days.",
    "Flatten the peak, and the whole month drops."
  ];
  const fmt = (v) => "$" + Math.round(v).toLocaleString("en-US");

  let timers = [];
  let rolling = 0;
  let played = false;

  const setCap = (t) => {
    if (!cap || cap.textContent === t) return;
    cap.classList.add("is-swapping");
    setTimeout(() => { cap.textContent = t; cap.classList.remove("is-swapping"); }, 200);
  };
  const roll = (from, to, dur) => {
    cancelAnimationFrame(rolling);
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      num.textContent = fmt(from + (to - from) * e);
      if (p < 1) rolling = requestAnimationFrame(tick);
    };
    rolling = requestAnimationFrame(tick);
  };
  const stage = (n) => {
    fig.setAttribute("data-stage", String(n));
    setCap(CAPS[n]);
    const kw = n === 4 ? "150" : "250";
    if (tagKw) tagKw.textContent = kw;
    if (ceilKw) ceilKw.textContent = kw;
  };

  const showEnd = () => {
    timers.forEach(clearTimeout); timers = [];
    stage(4);
    if (cap) cap.textContent = CAPS[4];
    num.textContent = "$2,100";
    fig.classList.add("is-done");
  };

  const play = () => {
    played = true;
    timers.forEach(clearTimeout); timers = [];
    fig.classList.remove("is-done");
    fig.setAttribute("data-stage", "0");
    num.textContent = "$0";
    void fig.offsetWidth; /* restart transitions from the top */
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    at(60, () => stage(1));                                  /* the day draws */
    at(1700, () => stage(2));                                /* the spike */
    at(3300, () => { stage(3); roll(0, 3500, 1600); });      /* billed all month */
    at(6600, () => { stage(4); roll(3500, 2100, 1100); });   /* flattened */
    at(8000, () => fig.classList.add("is-done"));
  };

  if (STILL) { showEnd(); return; }

  const isActive = () => !chapter || chapter.classList.contains("is-active");
  let visible = false;
  const tryPlay = () => { if (!played && visible && isActive()) play(); };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; });
      tryPlay();
    }, { threshold: 0.55 }).observe(fig);
  } else {
    showEnd();
  }
  if (chapter && "MutationObserver" in window) {
    new MutationObserver(tryPlay).observe(chapter, { attributes: true, attributeFilter: ["class"] });
  }
  if (replay) replay.addEventListener("click", play);
})();
