// Intro overlay, scroll-linked decade emphasis, and per-row dot entrance animations.
// Keeps motion separate from timeline data/render in timeline.js.

const INTRO_STORAGE_KEY = "concertStoriesIntroSeen";

/** @returns {boolean} */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Curtain / spotlight intro. Above popover (z-index 1100) until dismissed; then removed from tab order.
 * Skips when sessionStorage is set unless URL has ?intro=1 .
 * @returns {Promise<void>}
 */
export function setupIntroOverlay() {
  const overlay = document.getElementById("intro-overlay");
  if (!overlay) return Promise.resolve();

  const forceIntro = new URLSearchParams(window.location.search).has("intro");
  const skipHtml =
    document.documentElement.classList.contains("intro-skip") ||
    (sessionStorage.getItem(INTRO_STORAGE_KEY) && !forceIntro);

  if (skipHtml) {
    overlay.classList.add("intro-overlay--dismissed");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    return Promise.resolve();
  }

  const mainBlocks = () =>
    [...document.body.children].filter(
      (el) => el !== overlay && el.tagName !== "SCRIPT" && el.id !== "intro-overlay"
    );

  const setPageInert = (locked) => {
    for (const el of mainBlocks()) {
      if (locked) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    }
  };

  overlay.hidden = false;
  overlay.removeAttribute("aria-hidden");
  overlay.removeAttribute("inert");
  setPageInert(true);
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    const enterBtn = document.getElementById("intro-enter");

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
      } catch {
        /* ignore quota / private mode */
      }
      overlay.classList.add("intro-overlay--dismissed");
      setPageInert(false);
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("inert", "");
      overlay.hidden = true;
      document.body.style.overflow = "";
      document.querySelector(".page-main")?.focus({ preventScroll: true });
      resolve();
    };

    const onEnter = () => {
      document.removeEventListener("keydown", onKey);
      if (prefersReducedMotion()) {
        finish();
        return;
      }
      overlay.classList.add("intro-overlay--exiting");
      const ms = 880;
      window.setTimeout(finish, ms);
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        document.removeEventListener("keydown", onKey);
        onEnter();
      }
    };

    enterBtn?.addEventListener("click", onEnter, { once: true });
    document.addEventListener("keydown", onKey);
    window.requestAnimationFrame(() => enterBtn?.focus({ preventScroll: true }));
  });
}

/**
 * Highlights the decade block most visible in the viewport via .decade-block--active .
 * @param {HTMLElement} rootEl — #timeline-vertical
 */
export function setupDecadeScroll(rootEl) {
  const blocks = [...rootEl.querySelectorAll(".decade-block")];
  if (!blocks.length) return;

  /** @type {Map<Element, number>} */
  const ratios = new Map();
  for (const b of blocks) ratios.set(b, 0);

  const applyActive = () => {
    let best = null;
    let bestR = -1;
    for (const b of blocks) {
      const r = ratios.get(b) ?? 0;
      if (r > bestR) {
        bestR = r;
        best = b;
      }
    }
    for (const b of blocks) b.classList.remove("decade-block--active");
    if (best && bestR > 0.02) best.classList.add("decade-block--active");
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratios.set(e.target, e.intersectionRatio);
      applyActive();
    },
    {
      root: null,
      rootMargin: "-18% 0px -22% 0px",
      threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1],
    }
  );

  for (const b of blocks) io.observe(b);
}

/**
 * When a year row is largely in view (~50% intersection), animates dots from the axis outward (FLIP-style).
 * @param {HTMLElement} rootEl
 */
export function setupDotEntranceAnimations(rootEl) {
  if (prefersReducedMotion()) return;

  /**
   * @param {Element} row
   */
  const runRow = (row) => {
    if (!(row instanceof HTMLElement)) return;
    if (row.dataset.dotsAnimated === "1") return;

    const axis = row.querySelector(".year-axis-cell");
    const dots = [...row.querySelectorAll(".event-dot")];
    if (!axis || dots.length === 0) {
      row.dataset.dotsAnimated = "1";
      return;
    }

    const ax = axis.getBoundingClientRect();
    const cx = ax.left + ax.width / 2;
    const cy = ax.top + ax.height / 2;

    const rects = dots.map((d) => d.getBoundingClientRect());

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const r = rects[i];
      const dcx = r.left + r.width / 2;
      const dcy = r.top + r.height / 2;
      const dx = cx - dcx;
      const dy = cy - dcy;
      dot.style.opacity = "0";
      dot.style.transform = `translate(${dx}px, ${dy}px) scale(1.5)`;
    }

    row.offsetHeight;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const staggerMs = 78;
        const duration = 1050;
        const maxDelay = (dots.length - 1) * staggerMs;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          const delay = i * staggerMs;
          dot.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity 0.55s ease ${delay}ms`;
          dot.style.transform = "";
          dot.style.opacity = "1";
        }
        row.dataset.dotsAnimated = "1";
        window.setTimeout(() => {
          for (const dot of dots) {
            dot.style.transition = "";
            dot.style.removeProperty("transform");
            dot.style.removeProperty("opacity");
          }
        }, duration + maxDelay + 80);
      });
    });
  };

  const visibleFraction = 0.5;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= visibleFraction) runRow(e.target);
      }
    },
    {
      root: null,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9, 1],
    }
  );

  const start = () => {
    for (const row of rootEl.querySelectorAll(".year-row")) io.observe(row);
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    start();
  }
}
