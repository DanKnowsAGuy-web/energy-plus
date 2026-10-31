/* Energy+ · redesign v2 (draft, comparison fork only)
   Progressive enhancement: everything here enhances a page that already
   reads fine without it. Respects prefers-reduced-motion and ?static=1. */
(() => {
  "use strict";
  const qs = new URLSearchParams(location.search);
  const STATIC = qs.has("static");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches || STATIC;
  const root = document.documentElement;

  /* ---------- motion tokens (mirror the CSS custom properties in v2.css) ---------- */
  const EASE = "expo.out";
  const DUR_FAST = 0.2;
  const DUR_MED = 0.5;
  const DUR_SLOW = 0.9;
  const STAGGER = 0.08;
  if (STATIC) root.classList.add("v2-static");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) root.classList.add("v2-reduced");
  if (!REDUCED) root.classList.add("v2-anim");

  /* ---------- hero variant ?h=b ---------- */
  const heroVariant = qs.get("h") === "b" ? "b" : "a";
  const heroH1 = document.querySelector("[data-hero-h1]");
  const heroSub = document.querySelector("[data-hero-sub]");
  if (heroVariant === "b" && heroH1 && heroSub) {
    heroH1.textContent = "Your building is overpaying for energy.";
    heroSub.textContent = "Most buildings overspend three ways. We find all three and cut them.";
  }

  /* ---------- hero video: load the Wistia iframe unless reduced/static ----------
     If the first-visit intro is about to play (see below), it takes over exactly when
     this src gets set: desktop preloads it ~1s in so it's ready by the hand-off; phone
     or a constrained connection waits until the hand-off finishes. Returning visitors
     (no intro pending) get the original, immediate load — unchanged. */
  const HERO_WISTIA_SRC = "https://fast.wistia.net/embed/iframe/n765rk6v4z?autoPlay=true&muted=true&silentAutoPlay=allow&endVideoBehavior=loop&playbar=false&controlsVisibleOnLoad=false&playButton=false&smallPlayButton=false&volumeControl=false&fullscreenButton=false&settingsControl=false&fitStrategy=cover";
  const heroMedia = document.querySelector("[data-hero-media]");
  const heroIframe = heroMedia ? heroMedia.querySelector("[data-hero-iframe]") : null;
  const introPending = root.classList.contains("v2-intro-pending");
  function loadHeroVideo() {
    if (!heroIframe || heroIframe.src) return;
    heroIframe.src = HERO_WISTIA_SRC;
  }
  if (heroMedia && !REDUCED) {
    if (heroIframe) heroIframe.addEventListener("load", () => heroMedia.classList.add("is-loaded"));
    if (!introPending) loadHeroVideo();
  }

  /* ---------- first-visit motion intro ---------- */
  if (introPending) {
    const overlay = document.querySelector("[data-intro]");
    const frame = overlay ? overlay.querySelector("[data-intro-frame]") : null;
    if (!overlay || !frame || !heroMedia) {
      root.classList.remove("v2-intro-pending");
    } else {
      const isConstrained = () => {
        if (window.innerWidth < 768) return true;
        const conn = navigator.connection;
        if (conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")) return true;
        return false;
      };
      const constrained = isConstrained();
      let done = false;

      const skipFromParent = () => {
        if (done) return;
        let cw = null;
        try { cw = frame.contentWindow; } catch (e) {}
        if (cw && typeof cw.introSkip === "function") { try { cw.introSkip(); } catch (e) {} }
      };
      const detachSkipListeners = () => {
        document.removeEventListener("keydown", skipFromParent);
        window.removeEventListener("scroll", skipFromParent);
        overlay.removeEventListener("click", skipFromParent);
        overlay.removeEventListener("wheel", skipFromParent);
        overlay.removeEventListener("touchmove", skipFromParent);
      };

      const handoff = (fast) => {
        if (done) return;
        done = true;
        detachSkipListeners();
        root.classList.remove("v2-intro-showing");
        overlay.style.pointerEvents = "none";
        const overlayDur = fast ? 0.3 : 0.7;
        const heroDur = fast ? 0.5 : 1.2;
        gsap.to(overlay, {
          opacity: 0, duration: overlayDur, ease: "expo.out",
          onComplete: () => {
            overlay.hidden = true;
            if (constrained) loadHeroVideo();
            root.classList.add("v2-intro-buttons-in");
          }
        });
        gsap.fromTo(heroMedia, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: heroDur, ease: "expo.out" });
      };

      overlay.hidden = false;
      root.classList.add("v2-intro-showing");
      document.addEventListener("keydown", skipFromParent);
      window.addEventListener("scroll", skipFromParent, { passive: true });
      overlay.addEventListener("click", skipFromParent);
      overlay.addEventListener("wheel", skipFromParent, { passive: true });
      overlay.addEventListener("touchmove", skipFromParent, { passive: true });
      frame.src = "intro/index.html?embed=1";

      if (!constrained) setTimeout(loadHeroVideo, 1000);

      // Primary signal: the iframe (intro/motion.js) posts {type:'ep-intro-done'} once its
      // timeline's progress reaches 1 (natural finish or skip-to-end), from an onUpdate hook
      // that's independent of the tl.eventCallback slot below — postMessage doesn't require
      // reaching back into the iframe's window, so it isn't affected by cross-tick timing the
      // way the poll can be, and it still fires even if something in the iframe throws while
      // we're mid-poll. __introSkipped (set by the piece itself, since pointer/touch events
      // over the iframe never bubble into this document) picks fast vs. natural hand-off timing.
      window.addEventListener("message", (e) => {
        if (done) return;
        if (!e.data || e.data.type !== "ep-intro-done") return;
        let cw = null;
        try { cw = frame.contentWindow; } catch (err) {}
        if (e.source && e.source !== cw) return;
        handoff(!!(cw && cw.__introSkipped));
      });

      // Backup: poll window.tl directly and also listen for its onComplete, per the brief.
      // setTimeout, not requestAnimationFrame, for this wait-loop: rAF can go unfired for a
      // tab that's backgrounded right at load, which would otherwise delay wiring completion
      // detection indefinitely even though the piece itself is playing fine.
      let watchdog = null;
      const waitForTimeline = () => {
        if (done) return;
        let cw = null;
        try { cw = frame.contentWindow; } catch (e) {}
        if (!cw || !cw.tl) { setTimeout(waitForTimeline, 30); return; }
        try { cw.tl.eventCallback("onComplete", () => handoff(!!cw.__introSkipped)); } catch (e) {}
        watchdog = setInterval(() => {
          if (done) { clearInterval(watchdog); return; }
          try {
            if (cw.tl.progress() >= 1) handoff(!!cw.__introSkipped);
          } catch (e) { clearInterval(watchdog); handoff(true); }
        }, 150);
      };
      waitForTimeline();

      // Hard watchdog: never let a stalled iframe (blocked script, slow font load, message
      // that never arrives, etc.) permanently hide the real hero. 7s comfortably clears the
      // ~5s hero-cut timeline itself.
      setTimeout(() => handoff(true), 7000);
    }
  }

  /* ---------- smooth-scroll pills (e.g. "Watch the 6-minute film") ---------- */
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.getAttribute("data-scroll"));
      if (target) target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- sticky pill bar ---------- */
  const bar = document.querySelector("[data-bar]");
  const hero = document.querySelector(".v2-hero");
  const mark = document.querySelector("[data-mark]");
  if (bar && hero) {
    let markPlayed = false;
    const sync = () => {
      const visible = window.scrollY > hero.offsetHeight * 0.6;
      bar.classList.toggle("is-visible", visible);
      if (visible && mark && !markPlayed) {
        markPlayed = true;
        if (REDUCED) mark.classList.add("is-done");
        else mark.classList.add("is-drawing");
      }
    };
    sync();
    addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync, { passive: true });
  }

  /* ---------- sticky bar: local section nav (desktop, 980px+) ---------- */
  const sectionNav = document.querySelector("[data-section-nav]");
  if (sectionNav) {
    const links = Array.from(sectionNav.querySelectorAll("[data-nav-link]"));
    const underline = sectionNav.querySelector("[data-nav-underline]");
    const targets = links
      .map((a) => ({ a, el: document.querySelector(a.getAttribute("href")) }))
      .filter((x) => x.el);

    /* single source of truth for "which link is active": both the .is-active
       class and the underline's position/width are always derived from this
       same currentActive element, recomputed fresh each time (never cached
       coordinates), so the two can't drift apart. */
    let currentActive = null;

    const placeUnderline = () => {
      if (!underline || !currentActive) return;
      const navBox = sectionNav.getBoundingClientRect();
      const linkBox = currentActive.getBoundingClientRect();
      underline.style.width = linkBox.width + "px";
      underline.style.transform = "translateX(" + (linkBox.left - navBox.left) + "px)";
      underline.classList.add("is-shown");
    };

    const setActive = (activeEl) => {
      if (!activeEl) return;
      currentActive = activeEl;
      links.forEach((a) => a.classList.toggle("is-active", a === currentActive));
      placeUnderline();
    };

    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, y), behavior: REDUCED ? "auto" : "smooth" });
      });
    });

    if ("IntersectionObserver" in window && targets.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const match = targets.find((t) => t.el === e.target);
            if (match) setActive(match.a);
          }
        });
      }, { rootMargin: "-96px 0px -60% 0px", threshold: 0 });
      targets.forEach((t) => io.observe(t.el));
    }
    addEventListener("resize", placeUnderline, { passive: true });
    /* nav link widths shift once the real webfont swaps in for the fallback
       font, which moves the underline out from under the active link until
       something else (like a resize) recomputes it. Recompute as soon as
       fonts are actually ready. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(placeUnderline).catch(() => {});
    }
  }

  /* ---------- mobile bottom booking bar (below 980px) ---------- */
  const mbar = document.querySelector("[data-mbar]");
  if (mbar) {
    const closeCta = document.querySelector(".v2-close .v2-cta");
    let heroPast = false;
    let coveringClose = false;
    const applyState = () => mbar.classList.toggle("is-visible", heroPast && !coveringClose);
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => {
        heroPast = !e.isIntersecting && e.boundingClientRect.top < 0;
        applyState();
      }), { threshold: 0 }).observe(hero);
    }
    if (closeCta && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => {
        coveringClose = e.isIntersecting;
        applyState();
      }), { threshold: 0.2 }).observe(closeCta);
    }
  }

  /* ---------- booking: every [data-book] goes to the scheduler ---------- */
  const BOOK_URL = "https://book.slashyourenergycost.com/?f=office";
  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.addEventListener("click", () => { location.href = BOOK_URL; });
  });

  /* ---------- SMS panels ---------- */
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && "ontouchend" in document);
  const buildSms = (panel) => {
    const msg = panel.querySelector("textarea");
    const send = panel.querySelector(".js-v2-sms-send");
    if (msg && send) send.href = "sms:" + (send.getAttribute("data-phone") || "") + (isIOS ? "&" : "?") + "body=" + encodeURIComponent(msg.value);
  };
  document.querySelectorAll(".js-v2-sms-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scope = btn.closest("section, .v2-hero, .v2-close__in") || document;
      const panel = scope.querySelector(".v2-sms");
      if (!panel) return;
      const open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      if (open) { buildSms(panel); panel.querySelector("textarea").focus(); }
    });
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches(".v2-sms textarea")) buildSms(e.target.closest(".v2-sms"));
  });

  /* ---------- generic reveal on enter ---------- */
  const revealNow = (el) => el.classList.add("is-in");
  if (REDUCED) {
    document.querySelectorAll(".v2-reveal").forEach(revealNow);
  } else if ("IntersectionObserver" in window) {
    const targets = Array.from(document.querySelectorAll(".v2-reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const group = e.target.closest("[data-reveal-group]");
          const siblings = group ? Array.from(group.querySelectorAll(".v2-reveal")) : [e.target];
          const i = siblings.indexOf(e.target);
          setTimeout(() => revealNow(e.target), Math.max(0, i) * 90);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

    targets.forEach((el) => {
      /* already scrolled past (e.g. loaded via #hash) never intersects: reveal immediately */
      if (el.getBoundingClientRect().bottom < 0) revealNow(el);
      else io.observe(el);
    });

    /* failsafe: never leave content stuck at opacity 0 */
    setTimeout(() => targets.forEach(revealNow), 2500);
  } else {
    document.querySelectorAll(".v2-reveal").forEach(revealNow);
  }

  /* ---------- calculator: height messages + loading state ---------- */
  const calcFrame = document.getElementById("v2-calc-frame");
  const calcWrap = document.querySelector("[data-v2-calc]");
  if (calcFrame) {
    calcFrame.addEventListener("load", () => {
      const l = calcWrap && calcWrap.querySelector(".v2-calc__loading");
      if (l) l.remove();
    });
    addEventListener("message", (e) => {
      const host = new URL(e.origin || "https://x.invalid").hostname;
      if (e.origin !== location.origin && !/danknowsaguy-web\.github\.io$/.test(host)) return;
      let h = null;
      if (typeof e.data === "number") h = e.data;
      else if (e.data && typeof e.data === "object" && typeof e.data.height === "number") h = e.data.height;
      if (h && h > 200 && h < 20000) calcFrame.style.height = h + "px";
      if (e.data && typeof e.data === "object" && typeof e.data.scrollTo === "number") {
        const y = calcFrame.getBoundingClientRect().top + window.scrollY + e.data.scrollTo - 88;
        window.scrollTo({ top: Math.max(0, y), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    });
  }

  /* ---------- the full record (verbatim from the live site) ---------- */
  const RECORD = [
    { t: "Whole building examples", c: 3, rows: [
      ["49.2%", "AZ Ford Dealership", "Auto dealership · Arizona", "Documented project total (power quality + HVAC + lighting)"],
      ["27% avg", "City of Rainsville", "Municipal · Alabama", "First-year monitored, power conditioning + LED"],
      ["+50% / +2%", "Commercial Bottling Plant", "Manufacturing · Upper Midwest", "Growth-adjusted net cost study (50% more output, 2% more cost)"]
    ]},
    { t: "HVAC examples", c: 67, rows: [
      ["33%", "Durham College", "Education / research · Oshawa, ON", "16,851 data points; ANOVA / t-test"],
      ["27.75% avg", "City of Windsor", "Municipal · Windsor, ON", "Enwin Utilities verified; OPA approved"],
      ["23.6%", "NASA Jet Propulsion Lab", "Government · Pasadena, CA", "7-day before/after, Caltech / Emcor"],
      ["21.1% kWh", "Simon Property Group", "Retail, Jersey Gardens mall · Elizabeth, NJ", "IPMVP; $41,473/yr, 12-mo payback"],
      ["19.2% RTU", "Anheuser-Busch (Mitchell Distributing)", "Distribution · United States", "20-mo payback; 904% lifetime ROI"],
      ["20 to 35%", "Trebor International", "Manufacturing · Windsor, ON", "P.E. licensed in 6 jurisdictions"],
      ["21 to 32%", "Kenya program", "Lab + field · Kenya Bureau of Standards; LECOL Mombasa", "KEBS lab test vs BS EN 60335-1"],
      ["27 to 30%", "Lebanon program", "2 sites · DALFA Beirut · HSZ Zgharta", "ENISCOPE data, witnessed and co-signed"],
      ["47.6% ΔT", "Electrolux", "Lab / OEM · United States", "Tri-S ECM thermal report"],
      ["284% ROI", "Men's Wearhouse (Tailored Brands)", "Retail · United States", "Dual-RTU, 12.5-mo payback"],
      ["24%+ / yr", "McDonald's franchisee", "Quick-serve · United States", "Annual study"],
      ["20% avg", "Bangladesh Ministry of Power", "Government pilot · Dhaka", "Official certification issued"],
      ["20% avg", "AT&T Mobility / SDG&E", "Telecom, 9 cell sites · San Diego, CA", "HOBO loggers; utility-engineer co-authored"],
      ["19.5 to 21.6%", "Verizon Network Services", "Telecom · Dallas, TX", "P.E.-authored; approved for deployment"],
      ["~21%", "DOE FEMP demonstration", "Government, gymnasium RTUs · United States", "U.S. DOE / ORNL controlled study"],
      ["22%", "Bashas' Supermarket", "Grocery · Gold Canyon, AZ", "Grocery vertical study"],
      ["19.4% / yr", "Domino's Store 6711", "Quick-serve · United States", "2-year study"],
      ["12 to 27%", "UAE program", "14 institutions · Sheraton Jumeirah · Sharjah FZ · Jotun · Flora Grand", "14-institution deployment"],
      ["15 to 39%", "Multi-country program", "South Africa · Pakistan · Indonesia · Puerto Rico", "Field studies per country"],
      ["15 to 21%", "Bangladesh enterprise", "56 units · GraphicPeople (WPP) · BEXIMCO · IDLC Finance", "Enterprise deployment"],
      ["15% eff.", "DHL (ammonia refrigeration)", "Logistics · United States", "Compressor study, 13.8-mo payback"],
      ["200 sites", "Airtel Bangladesh", "Telecom, 200 BTS sites · Nationwide", "3-month pilot, no performance issues"],
      ["5-mo payback", "Italgas Toscana", "Utility, heat pump · Italy", "Field efficiency trial"],
      ["50%", "General Electric", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["45%", "IIT, Mumbai", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["44%", "Merrill Lynch", "Carrier · 2.0 ton", "India · HVAC Optimizer field test"],
      ["39%", "GTL", "Carrier · 1.5 ton", "India · HVAC Optimizer field test"],
      ["39%", "Premier Energy Transmission", "Commander · 1.5 ton", "India · HVAC Optimizer field test"],
      ["35%", "Reliance Communication", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["35%", "EPIC Energy", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["34%", "CTV", "National · 1.5 ton", "India · HVAC Optimizer field test"],
      ["33%", "Airtel", "Carrier · 8.5 ton", "India · HVAC Optimizer field test"],
      ["30%", "The Association Building Company (TATA)", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["29%", "Reliance Energy", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["28%", "Larsen & Toubro", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["28%", "Agility Logistics", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "Indian School of Business", "Hitachi · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "ENAM Securities", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "India Independent Strategy and Research", "Mitsubishi · 2.0 ton", "India · HVAC Optimizer field test"],
      ["26%", "TATA Consultancy Services", "Blue Star · 11 ton", "India · HVAC Optimizer field test"],
      ["26%", "Hero Moto Corp", "Carrier · 2.0 ton", "India · HVAC Optimizer field test"],
      ["26%", "CCI Club, Mumbai", "O General · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Daikin", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Godrej", "Godrej · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Infosys", "Toshiba · 1.8 ton", "India · HVAC Optimizer field test"],
      ["25%", "ICICI", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "ISPAT", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "Vinergy", "Mitsubishi · 1.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Raj Bhavan", "LG · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Diners Business Service", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "Great Eastern Shipping Company", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["24%", "Blue Star", "Blue Star · 2.0 ton", "India · HVAC Optimizer field test"],
      ["24%", "TATA Tele", "Voltas · 2.0 ton", "India · HVAC Optimizer field test"],
      ["23%", "Reliance Web World", "Carrier · 1.5 ton", "India · HVAC Optimizer field test"],
      ["23%", "Tech Mahindra", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["23%", "Raymond Industries", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["22%", "Siemens", "Panasonic · 1.5 ton", "India · HVAC Optimizer field test"],
      ["21%", "TATA Motors", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["21%", "KPMG", "Carrier · 17 ton", "India · HVAC Optimizer field test"],
      ["20%", "Viom", "SpaceMaker · 3.5 ton", "India · HVAC Optimizer field test"],
      ["20%", "AT&T Mobility", "LG · 2.0 ton", "India · HVAC Optimizer field test"],
      ["20%", "Veritas", "LG · 1.0 ton", "India · HVAC Optimizer field test"],
      ["20%", "Vitz Hotel", "Voltas · 3.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "Mahindra & Mahindra", "Blue Star · 2.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "MTNL", "Voltas · 2.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "Naval Dockyard", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["18%", "TATA Power", "Carrier · 8.5 ton", "India · HVAC Optimizer field test"]
    ]},
    { t: "Power conditioning examples (a later-phase upgrade)", c: 25, rows: [
      ["24.0%", "Edward Hospital", "Hospital · Naperville, IL", "Power factor + voltage conditioning + line reactors; metered, beat projection, $84,270 / 9 mo"],
      ["20% avg", "Starnes Quarter Horses", "Agriculture · Alabama", "Monthly bill comparison"],
      ["16% kWh", "Team Wow (Domino's)", "Quick-serve · El Paso, TX", "Weather-adjusted, U.S. DOE standards"],
      ["15.0% kWh", "Buffalo Rock", "Manufacturing · Birmingham, AL", "Noesis, 12-month study"],
      ["15% kWh", "Henkel", "Manufacturing · Richmond, VA", "Exceeded corporate sustainability goal"],
      ["15% kWh", "Cowabunga (Domino's)", "Quick-serve · Georgia", "Third-party metering, 7-store install"],
      ["14.8% kWh", "Corey Center", "Office + warehouse · Atlanta, GA", "Noesis, 4-year average"],
      ["14% kWh", "Caribe Resort", "Hospitality · Orange Beach, AL", "Facilities-director measured"],
      ["up to 14%", "Serra Mazda", "Retail / auto · Trussville, AL", "CHI Energy, 12-month study"],
      ["13.5% kWh", "Hilton Garden Inn", "Hospitality · Marietta, GA", "ABRAXAS, 12-month study"],
      ["13.0% kWh", "Planet Fitness", "Fitness · Birmingham, AL", "CHI Energy"],
      ["12.9% kWh", "Hi-Noon (Sinclair)", "C-store / fuel · Missoula, MT", "Verified by NorthWestern Energy"],
      ["12.5% kWh", "RPM Pizza (Domino's)", "Quick-serve, 170+ stores · MS · LA · AL · IN · MI", "Normalized; >$100k/yr projected"],
      ["12.5% kWh", "Wheeling University", "Education · Wheeling, WV", "Engineering capstone study"],
      ["12% kWh", "Pinnacle Center 4 (J&J HQ)", "Office · Rogers, AR", "Occupancy-adjusted baseline"],
      ["9 to 19%", "The Massey Building", "Office (historic) · Birmingham, AL", "Per-floor metering"],
      ["9% kWh", "Popeyes", "Quick-serve, 25 locations · GA · AL · LA · MS · TN", "ABRAXAS"],
      ["9.7% delta", "Krystal", "Quick-serve · Georgia", "Noesis, vs. control store"],
      ["8.59% kW", "Las Vegas Hotel & Casino", "Hospitality · Las Vegas, NV", "Independent panel metering"],
      ["~1 yr payback", "Pacific Steel", "Manufacturing · Montana", "PE-sealed technoeconomic analysis"],
      ["18% panel", "Haven Health", "Medical · United States", "Industria Energy independent study"],
      ["40% motor", "Sequoyah Elementary", "Education · Tennessee", "Data-logged 14 days, 9.5-mo ROI"],
      ["15.4% amps", "Arnie's Gas & Tire", "C-store / fuel · Ronan, MT", "Verified by electrical engineer"],
      ["~$1,500 / store", "C-Store program (TeamSledd / Liberty)", "C-store / fuel, 12 stores · OH · WV · PA", "3-year year-over-year study"],
      ["THD −30 / −45%", "Off-grid solar residence", "Power-quality test · South Carolina", "PowerSight 5000 metering"]
    ]}
  ];

  const sheet = document.getElementById("v2-record-sheet");
  const openBtn = document.getElementById("v2-record-open");
  const closeBtn = document.getElementById("v2-record-close");
  if (sheet && openBtn && closeBtn) {
    let rendered = false;
    const render = () => {
      if (rendered) return;
      rendered = true;
      const body = document.getElementById("v2-record-body");
      const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      body.innerHTML = RECORD.map((g) =>
        '<section class="v2-rec-group"><h3>' + esc(g.t) + "<span>" + g.c + "</span></h3><ul>" +
        g.rows.map((r) =>
          '<li><span class="r">' + esc(r[0]) + '</span><span class="n"><b>' + esc(r[1]) + "</b><span>" + esc(r[2]) + '</span></span><span class="b">' + esc(r[3]) + "</span></li>"
        ).join("") + "</ul></section>"
      ).join("");
    };
    openBtn.addEventListener("click", () => { render(); sheet.showModal(); });
    closeBtn.addEventListener("click", () => sheet.close());
    sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  }

  const ledger = document.getElementById("v2-ledger");
  if (ledger) {
    const flat = [];
    RECORD.forEach((g) => g.rows.forEach((r) => flat.push(r)));
    const cols = Array.from(ledger.querySelectorAll(".v2-ledger__col"));
    const escL = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const card = (r) => '<div class="v2-ledger__card"><span class="r">' + escL(r[0]) + '</span><span class="n">' + escL(r[1]) + '</span><span class="w">' + escL(r[2]) + "</span></div>";
    cols.forEach((col, i) => {
      const rows = flat.filter((_, j) => j % cols.length === i);
      const html = rows.map(card).join("");
      col.innerHTML = html + html;
    });
    ledger.addEventListener("click", () => { const b = document.getElementById("v2-record-open"); if (b) b.click(); });
  }

  /* ---------- chapter 1: pinned bill scene ---------- */
  const pinSection = document.querySelector("[data-pin-scene]");
  if (pinSection) {
    const chapters = Array.from(pinSection.querySelectorAll(".v2-chapter"));
    const bill = pinSection.querySelector(".v2-billcard");
    const progressSegs = Array.from(pinSection.querySelectorAll(".v2-progress3__seg"));
    const closingBeat = pinSection.querySelector(".v2-closing-beat");

    /* ---------- bill number engine: baseline (0) + one state per chapter (1..3) ----------
       kept as exact whole-cent integer math throughout so the printed figures never drift
       off the spec (in particular the 7% tax on state 3, which lands on a $.005 boundary). */
    const cents = (rate, qty) => Math.round(rate * qty * 100);
    const fmtUsd = (c) => "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtUsdInt = (c) => "$" + Math.round(c / 100).toLocaleString("en-US");
    const fmtUsdAuto = (c) => (c % 100 === 0 ? fmtUsdInt(c) : fmtUsd(c));
    const fmtInt = (n) => n.toLocaleString("en-US");
    const BILL_STATES = [
      { rate: 0.0650, kwh: 80000, fuelRate: 0.0120, kw: 250 },
      { rate: 0.0590, kwh: 80000, fuelRate: 0.0120, kw: 250 },
      { rate: 0.0590, kwh: 80000, fuelRate: 0.0120, kw: 150 },
      { rate: 0.0590, kwh: 58500, fuelRate: 0.0120, kw: 150 }
    ].map((s) => {
      const customerCents = 4500;
      const energyCents = cents(s.rate, s.kwh);
      const fuelCents = cents(s.fuelRate, s.kwh);
      const demandCents = cents(14.00, s.kw);
      const subtotalCents = customerCents + energyCents + fuelCents + demandCents;
      const taxCents = Math.round((subtotalCents * 7) / 100);
      const totalCents = subtotalCents + taxCents;
      const energyGroupCents = energyCents + fuelCents;
      const otherCents = customerCents + taxCents;
      return Object.assign({}, s, { customerCents, energyCents, fuelCents, demandCents, taxCents, totalCents, energyGroupCents, otherCents });
    });
    const baseTotalCents = BILL_STATES[0].totalCents;
    let currentBillIndex = 0;

    /* ---------- the card: total + stacked bar ---------- */
    const totalBigEl = bill.querySelector('[data-field="total-big"]');
    const billPill = bill.querySelector('[data-field="pill"]');
    const changeEl = bill.querySelector('[data-field="change"]');
    const segEls = {
      energy: bill.querySelector('[data-seg="energy"]'), demand: bill.querySelector('[data-seg="demand"]'),
      other: bill.querySelector('[data-seg="other"]'), saved: bill.querySelector('[data-seg="saved"]')
    };
    const segAmtEls = {
      energy: bill.querySelector('[data-seg-amt="energy"]'), demand: bill.querySelector('[data-seg-amt="demand"]'),
      other: bill.querySelector('[data-seg-amt="other"]')
    };
    const barTween = { total: baseTotalCents, energy: BILL_STATES[0].energyGroupCents, demand: BILL_STATES[0].demandCents, other: BILL_STATES[0].otherCents };

    const paintBar = (o) => {
      if (totalBigEl) totalBigEl.textContent = fmtUsdInt(o.total);
      if (segEls.energy) segEls.energy.style.width = Math.max(0, (o.energy / baseTotalCents) * 100) + "%";
      if (segEls.demand) segEls.demand.style.width = Math.max(0, (o.demand / baseTotalCents) * 100) + "%";
      if (segEls.other) segEls.other.style.width = Math.max(0, (o.other / baseTotalCents) * 100) + "%";
      if (segEls.saved) segEls.saved.style.width = Math.max(0, ((baseTotalCents - o.total) / baseTotalCents) * 100) + "%";
      if (segAmtEls.energy) segAmtEls.energy.textContent = fmtUsdInt(o.energy);
      if (segAmtEls.demand) segAmtEls.demand.textContent = fmtUsdInt(o.demand);
      if (segAmtEls.other) segAmtEls.other.textContent = fmtUsdInt(o.other);
    };

    const renderBill = (i) => {
      currentBillIndex = i;
      const s = BILL_STATES[i];
      const target = { total: s.totalCents, energy: s.energyGroupCents, demand: s.demandCents, other: s.otherCents };

      if (REDUCED || !window.gsap) {
        Object.assign(barTween, target);
        paintBar(barTween);
      } else {
        gsap.killTweensOf(barTween);
        gsap.to(barTween, Object.assign({}, target, { duration: DUR_SLOW, ease: EASE, onUpdate: () => paintBar(barTween) }));
      }

      if (billPill) {
        if (i === 0) {
          billPill.classList.remove("is-shown");
          billPill.textContent = "";
        } else {
          const diff = baseTotalCents - s.totalCents;
          const pct = Math.round((diff / baseTotalCents) * 1000) / 10;
          billPill.textContent = "−" + fmtUsd(diff) + " · " + pct.toFixed(1) + "%";
          billPill.classList.add("is-shown");
        }
      }

      if (changeEl) {
        if (i === 0) {
          changeEl.textContent = "";
          changeEl.classList.remove("is-shown");
        } else {
          const prev = BILL_STATES[i - 1];
          const energyDelta = prev.energyGroupCents - s.energyGroupCents;
          const demandDelta = prev.demandCents - s.demandCents;
          let label = "";
          if (demandDelta > 0) label = "Demand −" + fmtUsdAuto(demandDelta);
          else if (energyDelta > 0) label = "Energy −" + fmtUsdAuto(energyDelta);
          changeEl.textContent = label;
          changeEl.classList.toggle("is-shown", Boolean(label));
        }
      }
    };

    /* ---------- the line-items pop-up: itemized bill for the current state ---------- */
    const billSheet = document.getElementById("v2-bill-sheet");
    const lineItemsBtn = bill.querySelector("[data-lineitems-open]");
    if (billSheet && lineItemsBtn) {
      const sheetFields = {
        customer: billSheet.querySelector('[data-field="customer"]'), energy: billSheet.querySelector('[data-field="energy"]'),
        fuel: billSheet.querySelector('[data-field="fuel"]'), demand: billSheet.querySelector('[data-field="demand"]'),
        taxes: billSheet.querySelector('[data-field="taxes"]'), total: billSheet.querySelector('[data-field="total"]')
      };
      const sheetMath = {
        energy: billSheet.querySelector('[data-field="energy-math"]'), fuel: billSheet.querySelector('[data-field="fuel-math"]'),
        demand: billSheet.querySelector('[data-field="demand-math"]')
      };
      const setSheetField = (el, curCents, baseCents) => {
        if (!el) return;
        const oldSpan = el.querySelector(".v2-bill__old");
        const newSpan = el.querySelector(".v2-bill__new");
        if (!newSpan) return;
        if (curCents === baseCents) {
          if (oldSpan) oldSpan.textContent = "";
          newSpan.textContent = fmtUsd(curCents);
          newSpan.classList.remove("is-changed");
        } else {
          if (oldSpan) oldSpan.textContent = fmtUsd(baseCents);
          newSpan.textContent = fmtUsd(curCents);
          newSpan.classList.add("is-changed");
        }
      };
      const fillBillSheet = (i) => {
        const s = BILL_STATES[i];
        const base = BILL_STATES[0];
        setSheetField(sheetFields.customer, s.customerCents, base.customerCents);
        setSheetField(sheetFields.energy, s.energyCents, base.energyCents);
        setSheetField(sheetFields.fuel, s.fuelCents, base.fuelCents);
        setSheetField(sheetFields.demand, s.demandCents, base.demandCents);
        setSheetField(sheetFields.taxes, s.taxCents, base.taxCents);
        setSheetField(sheetFields.total, s.totalCents, base.totalCents);
        if (sheetMath.energy) sheetMath.energy.textContent = fmtInt(s.kwh) + " kWh × $" + s.rate.toFixed(4);
        if (sheetMath.fuel) sheetMath.fuel.textContent = fmtInt(s.kwh) + " kWh × $" + s.fuelRate.toFixed(4);
        if (sheetMath.demand) sheetMath.demand.textContent = fmtInt(s.kw) + " kW × $14.00";
      };
      let lastFocus = null;
      const closeBillSheet = () => {
        billSheet.classList.remove("is-in");
        const finish = () => { if (billSheet.open) billSheet.close(); };
        if (REDUCED) { finish(); if (lastFocus) lastFocus.focus(); return; }
        let done = false;
        const onEnd = () => { if (done) return; done = true; finish(); billSheet.removeEventListener("transitionend", onEnd); };
        billSheet.addEventListener("transitionend", onEnd);
        setTimeout(onEnd, 340);
      };
      lineItemsBtn.addEventListener("click", () => {
        lastFocus = lineItemsBtn;
        fillBillSheet(currentBillIndex);
        billSheet.showModal();
        requestAnimationFrame(() => billSheet.classList.add("is-in"));
      });
      const billSheetClose = document.getElementById("v2-billsheet-close");
      if (billSheetClose) billSheetClose.addEventListener("click", closeBillSheet);
      billSheet.addEventListener("click", (e) => { if (e.target === billSheet) closeBillSheet(); });
      billSheet.addEventListener("cancel", (e) => { e.preventDefault(); closeBillSheet(); });
      billSheet.addEventListener("close", () => { if (lastFocus) lastFocus.focus(); });
    }

    const applyChapters = (i) => chapters.forEach((c, j) => c.classList.toggle("is-active", j === i));
    const applyProgress = (i) => {
      progressSegs.forEach((seg, j) => {
        seg.classList.toggle("is-fill", j === i);
        seg.classList.toggle("is-done", j < i);
      });
    };
    const playIllust = (i) => {
      if (REDUCED) return;
      const el = chapters[i] && chapters[i].querySelector(".v2-illust");
      if (!el) return;
      el.classList.remove("is-playing");
      void el.offsetWidth; /* reflow: forces the restart animation to replay from the top */
      el.classList.add("is-playing");
    };

    if (REDUCED || STATIC) {
      applyChapters(2);
      chapters.forEach((c) => c.classList.add("is-active"));
      progressSegs.forEach((seg) => seg.classList.add("is-done"));
      renderBill(3);
    } else if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      let current = -1;

      const setActive = (i) => {
        if (i === current) return;
        current = i;
        applyChapters(i);
        applyProgress(i);
        playIllust(i);
        renderBill(i + 1);
      };

      const resetToBase = () => {
        if (current === -1) return;
        current = -1;
        applyChapters(-1);
        applyProgress(-1);
        renderBill(0);
      };

      chapters.forEach((c, i) => {
        ScrollTrigger.create({
          trigger: c, start: "top 60%", end: "bottom 40%",
          onToggle: (self) => { if (self.isActive) setActive(i); },
          onLeaveBack: () => { if (i === 0) resetToBase(); }
        });
      });

      renderBill(0);

      /* release: reset the zoom as the closing beat arrives */
      if (closingBeat) {
        ScrollTrigger.create({
          trigger: closingBeat, start: "top 75%",
          onEnter: () => { closingBeat.classList.add("is-in"); },
          onLeaveBack: () => { closingBeat.classList.remove("is-in"); }
        });
      }
    } else {
      /* graceful fallback without GSAP: plain IntersectionObserver */
      applyChapters(0);
      renderBill(1);
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const i = chapters.indexOf(e.target);
              if (i > -1) { applyChapters(i); applyProgress(i); playIllust(i); renderBill(i + 1); }
            }
          });
        }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
        chapters.forEach((c) => io.observe(c));
      }
    }
  }

  /* ---------- card detail sheet: every [data-expand-card] (Cliff bento, money bento,
     the Exam step 2) opens a shared dialog instead of expanding in place. Delegated at
     the document level (not bound per-element) so cards that v2.js renders later, such
     as the rotating Cliff slots, work without any extra wiring. window.v2CardSheetOpen
     is exposed so other features (the Cliff rotator) can pause while it is open. ---------- */
  window.v2CardSheetOpen = false;
  const cardSheet = document.getElementById("v2-card-sheet");
  if (cardSheet) {
    const sheetEyebrow = document.getElementById("v2-card-sheet-eyebrow");
    const sheetFig = document.getElementById("v2-card-sheet-fig");
    const sheetCap = document.getElementById("v2-card-sheet-cap");
    const sheetDetail = document.getElementById("v2-card-sheet-detail");
    const sheetVisual = document.getElementById("v2-card-sheet-visual");
    const sheetClose = document.getElementById("v2-card-sheet-close");
    let lastCard = null;

    new MutationObserver(() => { window.v2CardSheetOpen = cardSheet.hasAttribute("open"); })
      .observe(cardSheet, { attributes: true, attributeFilter: ["open"] });

    const closeSheet = () => {
      cardSheet.classList.remove("is-in");
      const finish = () => { if (cardSheet.open) cardSheet.close(); };
      if (REDUCED) { finish(); return; }
      let done = false;
      const onEnd = () => { if (done) return; done = true; finish(); cardSheet.removeEventListener("transitionend", onEnd); };
      cardSheet.addEventListener("transitionend", onEnd);
      setTimeout(onEnd, 340);
    };

    const textSansFootnotes = (node) => {
      if (!node) return "";
      const clone = node.cloneNode(true);
      clone.querySelectorAll(".v2-fn").forEach((fn) => fn.remove());
      return clone.textContent.replace(/\s+/g, " ").trim();
    };

    const openCard = (card) => {
      lastCard = card;
      const eyebrow = card.querySelector(".v2-card__eyebrow");
      const fig = card.querySelector(".v2-card__fig");
      const cap = card.querySelector(".v2-card__cap");
      const detail = card.querySelector(".v2-card__detail");
      sheetEyebrow.textContent = eyebrow ? eyebrow.textContent : "";
      sheetFig.textContent = fig ? fig.textContent : "";
      sheetCap.textContent = textSansFootnotes(cap);
      sheetDetail.textContent = textSansFootnotes(detail);

      if (sheetVisual) {
        sheetVisual.innerHTML = "";
        const tplSel = card.getAttribute("data-sheet-visual");
        const tpl = tplSel ? document.querySelector(tplSel) : null;
        if (tpl && "content" in tpl) {
          sheetVisual.hidden = false;
          sheetVisual.appendChild(tpl.content.cloneNode(true));
          const chart = sheetVisual.querySelector(".v2-examchart");
          if (chart) requestAnimationFrame(() => requestAnimationFrame(() => chart.classList.add("is-in")));
        } else {
          sheetVisual.hidden = true;
        }
      }

      cardSheet.showModal();
      requestAnimationFrame(() => cardSheet.classList.add("is-in"));
    };

    document.addEventListener("click", (e) => {
      const card = e.target.closest("[data-expand-card]");
      if (!card) return;
      e.preventDefault();
      openCard(card);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest("[data-expand-card]");
      if (!card) return;
      e.preventDefault();
      openCard(card);
    });

    if (sheetClose) sheetClose.addEventListener("click", closeSheet);
    cardSheet.addEventListener("click", (e) => { if (e.target === cardSheet) closeSheet(); });
    cardSheet.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });
    cardSheet.addEventListener("close", () => { if (lastCard) lastCard.focus(); });
  }

  /* ---------- Cliff bento: 6 credentials, 4 visible slots rotate through them ----------
     Markup keeps all 6 real cards always in the DOM (baseline: a normal, holeless grid,
     every card independently clickable). This enhancement assigns 4 of them an explicit
     grid position (.v2-cliff-slot--pN) and, every ~5s, crossfades one position over to a
     credential not currently shown. Reduced motion / ?static=1 skips this entirely, so
     the CSS fallback (all 6, plain grid) stands. */
  (() => {
    if (REDUCED) return;
    const bento = document.querySelector(".v2-bento--cliff");
    if (!bento) return;
    const cards = Array.from(bento.querySelectorAll("[data-cliff-slot]"));
    if (cards.length !== 6) return;
    const dots = document.querySelector("[data-cliff-dots]");
    const POS = ["v2-cliff-slot--p0", "v2-cliff-slot--p1", "v2-cliff-slot--p2", "v2-cliff-slot--p3"];

    let visible = [0, 2, 3, 4]; /* Sole source, Billions, 8 years, 3 emirates */
    let hiddenQueue = [1, 5];   /* 22 engineers, Northridge */

    const renderDots = () => {
      if (!dots) return;
      Array.from(dots.children).forEach((d, i) => d.classList.toggle("is-on", visible.includes(i)));
    };

    const place = () => {
      cards.forEach((c) => POS.forEach((p) => c.classList.remove(p)));
      visible.forEach((cardIdx, posIdx) => cards[cardIdx].classList.add(POS[posIdx]));
      renderDots();
    };
    place();

    let paused = false;
    bento.addEventListener("mouseenter", () => { paused = true; });
    bento.addEventListener("mouseleave", () => { paused = false; });
    bento.addEventListener("focusin", () => { paused = true; });
    bento.addEventListener("focusout", () => { paused = false; });

    let posIdx = 0;
    setInterval(() => {
      if (paused || window.v2CardSheetOpen || document.hidden) return;
      const outIdx = visible[posIdx];
      const inIdx = hiddenQueue.shift();
      hiddenQueue.push(outIdx);
      visible[posIdx] = inIdx;

      const outEl = cards[outIdx];
      const inEl = cards[inIdx];
      const posClass = POS[posIdx];

      inEl.classList.add(posClass, "v2-cliff-in");
      requestAnimationFrame(() => {
        inEl.classList.remove("v2-cliff-in");
        outEl.classList.add("v2-cliff-out");
      });
      setTimeout(() => { outEl.classList.remove(posClass, "v2-cliff-out"); }, 340);

      renderDots();
      posIdx = (posIdx + 1) % 4;
    }, 5000);
  })();

  /* ---------- progress carousels: desktop scroll-driven + mobile native ---------- */
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const outer = carousel.querySelector(".v2-carousel__track-outer");
    const track = carousel.querySelector(".v2-carousel__track");
    const fill = carousel.querySelector(".v2-carousel__progress span");
    if (!outer || !track) return;

    const isMobile = () => window.innerWidth < 980;

    const updateFromScrollLeft = () => {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? track.scrollLeft / max : 0;
      if (fill) fill.style.transform = "scaleX(" + Math.max(0.05, pct || 0.05) + ")";
    };

    if (isMobile()) {
      track.addEventListener("scroll", updateFromScrollLeft, { passive: true });
      updateFromScrollLeft();
    } else if (!REDUCED && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const cards = Array.from(track.children);
      const gap = 24;
      const cardWidth = cards[0] ? cards[0].getBoundingClientRect().width : 320;
      const totalWidth = cards.length * (cardWidth + gap) - gap;
      const maxScroll = Math.max(0, totalWidth - outer.clientWidth);
      if (maxScroll > 0) {
        gsap.to(track, {
          x: () => -maxScroll,
          ease: "none",
          scrollTrigger: {
            trigger: carousel,
            start: "top center",
            end: () => "+=" + (maxScroll + window.innerHeight * 0.4),
            scrub: true,
            onUpdate: (self) => { if (fill) fill.style.transform = "scaleX(" + Math.max(0.05, self.progress) + ")"; }
          }
        });
      } else if (fill) {
        fill.style.transform = "scaleX(1)";
      }
    } else if (fill) {
      fill.style.transform = "scaleX(1)";
    }
  });

  /* ---------- the film: facade becomes the player, in place ---------- */
  document.querySelectorAll("[data-film-inline]").forEach((facade) => {
    facade.addEventListener("click", () => {
      const holder = facade.closest(".v2-filmcard, .v2-card--film, .v2-film__media") || facade;
      const f = document.createElement("iframe");
      f.src = "https://fast.wistia.net/embed/iframe/n765rk6v4z?autoPlay=true&playbar=true&dnt=true";
      f.allow = "autoplay; fullscreen";
      f.title = "Energy Plus: how we cut your energy bill, 6 minutes";
      holder.replaceChildren(f);
    });
  });

  /* ---------- SunCore video: scroll-scrubs while its card crosses the viewport; static poster if reduced ---------- */
  const turn = document.querySelector("[data-suncore-video]");
  if (turn) {
    if (REDUCED) {
      turn.pause();
    } else if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const card = turn.closest(".v2-card--suncore") || turn;
      let ready = turn.readyState >= 1;
      turn.addEventListener("loadedmetadata", () => { ready = true; }, { once: true });
      turn.pause();
      ScrollTrigger.create({
        trigger: card, start: "top bottom", end: "bottom top", scrub: true,
        onUpdate: (self) => {
          if (!ready || !turn.duration || isNaN(turn.duration)) return;
          if (!turn.paused) turn.pause();
          turn.currentTime = Math.min(turn.duration - 0.05, Math.max(0, self.progress * turn.duration));
        }
      });
    } else if ("IntersectionObserver" in window) {
      turn.playbackRate = 0.5;
      new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { const p = turn.play(); if (p) p.catch(() => {}); }
        else turn.pause();
      }), { threshold: 0.25 }).observe(turn);
    }
  }

  /* ---------- full-bleed photo bands: subtle scale-down parallax on scroll ---------- */
  document.querySelectorAll("[data-parallax]").forEach((band) => {
    const img = band.querySelector("[data-parallax-img]");
    if (!img || REDUCED || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(img, { scale: 1.08 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ---------- three costs: eyebrow + two-line stat + animated visual per card.
     Desktop (980px+): the section pins briefly while the three cards rise in on
     scroll progress (0.1 / 0.35 / 0.6) and each visual plays as its card arrives.
     Mobile / no-GSAP / reduced-motion / static: no pin, cards play on enter. ---------- */
  (() => {
    const costsSection = document.querySelector("[data-costs-pin]");
    if (!costsSection) return;
    const costCards = Array.from(costsSection.querySelectorAll(".v2-costcard"));
    if (!costCards.length) return;

    const countUp = (card) => {
      const num = card.querySelector(".v2-cost-num");
      if (!num) return;
      const to = parseFloat(num.getAttribute("data-count-to"));
      const from = parseFloat(num.getAttribute("data-count-from") || "0");
      const suffix = num.getAttribute("data-suffix") || "";
      if (REDUCED || STATIC || isNaN(to)) { num.textContent = (isNaN(to) ? from : to) + suffix; return; }
      const dur = 700;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(from + (to - from) * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const playCard = (card) => {
      if (card.classList.contains("is-in")) return;
      card.classList.add("is-in");
      const viz = card.querySelector(".v2-viz");
      if (viz) viz.classList.add("is-in");
      countUp(card);
    };
    const playAll = () => costCards.forEach(playCard);

    if (REDUCED || STATIC) { playAll(); return; }

    const setupMobile = () => {
      if (!("IntersectionObserver" in window)) { playAll(); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { playCard(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.4 });
      costCards.forEach((c) => io.observe(c));
    };

    if (window.innerWidth >= 980 && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const thresholds = [0.1, 0.35, 0.6];
      ScrollTrigger.create({
        trigger: costsSection,
        start: "top top",
        end: "+=120%",
        pin: true,
        onUpdate: (self) => {
          thresholds.forEach((th, i) => { if (self.progress >= th && costCards[i]) playCard(costCards[i]); });
        }
      });
    } else {
      setupMobile();
    }
  })();

  /* ---------- keep ScrollTrigger measurements honest after late-loading assets ---------- */
  if (window.ScrollTrigger) {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh).catch(() => {});
    addEventListener("load", refresh);
    document.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });
    setTimeout(refresh, 1200);
  }
})();
