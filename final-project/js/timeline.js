// Raw concert rows from the static dataset; popover helpers for dots and the detail dialog.
import { CONCERT_EVENTS } from "./events-data.js";
import {
  formatDisplayDate,
  createEventPopover,
  showEventPopover,
  hideEventPopover,
  attachPopoverGlobalListeners,
} from "./event-popover.js";
import { setupIntroOverlay, setupDecadeScroll, setupDotEntranceAnimations } from "./timeline-motion.js";

// -----------------------------------------------------------------------------
// Timeline range and decade groupings
// Which years appear on the axis and how they roll up into labeled buckets (2000s, 2010s, 2020s).
// -----------------------------------------------------------------------------
const START_YEAR = 2000;
const END_YEAR = 2025;

const YEAR_BUCKETS = [
  { label: "My first show was in 2000", startYear: 2000, endYear: 2009 },
  { label: "I moved to New York in 2010", startYear: 2010, endYear: 2019 },
  { label: "2020 was... a year", startYear: 2020, endYear: 2025 },
];

/** ISO `YYYY-MM-DD` dates that get an extra ring on the timeline (see `.event-dot--special-date`). */
const SPECIAL_TIMELINE_DATES = new Set(["2000-04-07", "2007-02-03"]);

// -----------------------------------------------------------------------------
// Merging and ordering events
// Multiple CSV-style rows for the same calendar date become one event with several
// artists; compareMergedEvents defines stable sort order for lists and years.
// -----------------------------------------------------------------------------
/**
 * @param {{ sortKey: number; date: string; artists: { name: string }[] }} a
 * @param {{ sortKey: number; date: string; artists: { name: string }[] }} b
 */
function compareMergedEvents(a, b) {
  if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.artists[0].name.localeCompare(b.artists[0].name);
}

/**
 * @param {typeof CONCERT_EVENTS} events
 */
function mergeEventsByDate(events) {
  /** @type {Map<string, {date: string, year: number, artists: { name: string; setlist?: string }[], sortKey: number}>} */
  const groups = new Map();

  for (const e of events) {
    const key = `${e.year}|${e.date}`;
    const name = (e.artist ?? "").trim() || "Unknown artist";
    const setlist =
      typeof e.setlist === "string" && e.setlist.trim() !== "" ? e.setlist.trim() : undefined;

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        date: e.date,
        year: e.year,
        artists: [setlist ? { name, setlist } : { name }],
        sortKey: e.sortKey,
      });
      continue;
    }

    existing.sortKey = Math.min(existing.sortKey, e.sortKey);

    const i = existing.artists.findIndex((a) => a.name === name);
    if (i === -1) {
      existing.artists.push(setlist ? { name, setlist } : { name });
    } else if (setlist && !existing.artists[i].setlist) {
      existing.artists[i].setlist = setlist;
    }
  }

  return [...groups.values()].sort(compareMergedEvents);
}

// -----------------------------------------------------------------------------
// Small DOM and year helpers
// Strict querySelector wrapper for required mount nodes; clampYear filters outliers.
// -----------------------------------------------------------------------------
function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function clampYear(year) {
  return year >= START_YEAR && year <= END_YEAR;
}

// -----------------------------------------------------------------------------
// Events indexed by calendar year
// Builds a map year → merged events, drops out-of-range years, sorts each year’s list.
// -----------------------------------------------------------------------------
function groupEventsByYear(events) {
  /** @type {Map<number, typeof events>} */
  const byYear = new Map();
  for (let y = START_YEAR; y <= END_YEAR; y++) byYear.set(y, []);

  for (const e of events) {
    if (!clampYear(e.year)) continue;
    byYear.get(e.year)?.push(e);
  }

  for (const [, list] of byYear) {
    list.sort(compareMergedEvents);
  }

  return byYear;
}

// -----------------------------------------------------------------------------
// Decade layout helpers
// Alternates which side of the central axis holds events vs empty space; placeholder
// blurbs fill decade headers until real copy replaces them.
// -----------------------------------------------------------------------------
/** First decade (2000s) on the right of the axis; alternate left/right for each following decade. */
function decadeEventsOnRight(decadeIndex) {
  return decadeIndex % 2 === 0;
}

/** Numeric era line for the timeline header (e.g. 2000 → "2000s"). */
function decadeEraLabel(startYear) {
  const decade = startYear - (startYear % 10);
  return `${decade}s`;
}

const DECADE_DUMMY_BLURBS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.",
];

function truncatePreviewText(text, maxLen) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

/**
 * One timeline dot plus decorative hover preview (aria-hidden; click still opens popover).
 * @param {ReturnType<typeof mergeEventsByDate>[number]} ev
 * @param {ReturnType<typeof createEventPopover>} popover
 * @param {{ isFirstEver?: boolean }} opts
 */
function createEventDotWithPreview(ev, popover, opts = {}) {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "event-dot";
  if (SPECIAL_TIMELINE_DATES.has(ev.date)) dot.classList.add("event-dot--special-date");
  const hoverText = ev.artists.map((a) => a.name).join(", ");
  dot.title = hoverText;
  dot.setAttribute("aria-haspopup", "dialog");
  dot.setAttribute("aria-label", `${formatDisplayDate(ev.date)}: ${hoverText}. Click for details.`);

  dot.addEventListener("click", (e) => {
    e.stopPropagation();
    showEventPopover(popover, ev, dot, e);
  });

  const wrap = document.createElement("span");
  wrap.className = "event-dot-wrap";
  if (opts.isFirstEver) wrap.classList.add("event-dot-wrap--first-ever");

  const card = document.createElement("span");
  card.className = "event-dot-preview";
  card.setAttribute("aria-hidden", "true");

  if (opts.isFirstEver) {
    const badge = document.createElement("span");
    badge.className = "event-dot-preview__badge";
    badge.textContent = "First show";
    card.appendChild(badge);
  }

  const dateEl = document.createElement("span");
  dateEl.className = "event-dot-preview__date";
  dateEl.textContent = formatDisplayDate(ev.date);

  const artistsLine = ev.artists.map((a) => a.name).join(", ");
  const artistsEl = document.createElement("span");
  artistsEl.className = "event-dot-preview__artists";
  artistsEl.textContent = truncatePreviewText(artistsLine, 96);

  const photoPh = document.createElement("span");
  photoPh.className = "event-dot-preview__photo";

  const note = document.createElement("span");
  note.className = "event-dot-preview__note";
  note.textContent = opts.isFirstEver
    ? "First concert on this timeline — add a photo or memory. Click the dot for the full story."
    : "Add a show photo or pick a favorite track. Click the dot for full details and setlist links.";

  const player = document.createElement("div");
  player.className = "event-dot-preview__player";

  const playerRow = document.createElement("div");
  playerRow.className = "event-dot-preview__player-row";

  const playIcon = document.createElement("span");
  playIcon.className = "event-dot-preview__play";
  playIcon.textContent = "▶";

  const trackInfo = document.createElement("div");
  trackInfo.className = "event-dot-preview__track";
  const trackTitle = document.createElement("span");
  trackTitle.className = "event-dot-preview__track-title";
  trackTitle.textContent = "Favorite song (placeholder)";
  const bar = document.createElement("div");
  bar.className = "event-dot-preview__progress";
  const fill = document.createElement("span");
  fill.className = "event-dot-preview__progress-fill";
  bar.appendChild(fill);
  trackInfo.append(trackTitle, bar);

  playerRow.append(playIcon, trackInfo);
  const linkPh = document.createElement("span");
  linkPh.className = "event-dot-preview__link-ph";
  linkPh.textContent = "Track link placeholder — paste Spotify/YouTube later";

  player.append(playerRow, linkPh);

  card.append(dateEl, artistsEl, photoPh, note, player);
  wrap.append(dot, card);
  return wrap;
}

// -----------------------------------------------------------------------------
// Vertical timeline DOM
// Renders decade blocks, year rows, central axis labels, and interactive dots that
// open the shared event popover with merged artist data for that date.
// -----------------------------------------------------------------------------
/**
 * @param {HTMLElement} rootEl
 * @param {ReturnType<typeof groupEventsByYear>} byYear
 * @param {ReturnType<typeof createEventPopover>} popover
 * @param {ReturnType<typeof mergeEventsByDate>[number] | null} firstEverEvent — chronologically first merged concert (badge on preview only).
 */
function renderTimelineVertical(rootEl, byYear, popover, firstEverEvent) {
  rootEl.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "timeline-vertical-wrap";

  const inner = document.createElement("div");
  inner.className = "timeline-vertical-inner";

  YEAR_BUCKETS.forEach((bucket, decadeIndex) => {
    const block = document.createElement("div");
    block.className = "decade-block";
    block.dataset.decadeStart = String(bucket.startYear);

    const onRight = decadeEventsOnRight(decadeIndex);

    const headerRow = document.createElement("div");
    headerRow.className = "decade-header-row";

    const headerLeft = document.createElement("div");
    headerLeft.className = "decade-header-side decade-header-side--left";
    const headerAxis = document.createElement("div");
    headerAxis.className = "decade-header-axis";
    headerAxis.setAttribute("aria-hidden", "true");
    const headerRight = document.createElement("div");
    headerRight.className = "decade-header-side decade-header-side--right";

    const headerInner = document.createElement("div");
    headerInner.className = "decade-header-inner";

    const eraP = document.createElement("p");
    eraP.className = "decade-era-label";
    eraP.setAttribute("aria-hidden", "true");
    const eraNum = document.createElement("span");
    eraNum.className = "decade-era-number";
    eraNum.textContent = decadeEraLabel(bucket.startYear);
    eraP.appendChild(eraNum);

    const h2 = document.createElement("h2");
    h2.className = "decade-title";
    h2.textContent = bucket.label;

    const blurb = document.createElement("p");
    blurb.className = "decade-header-blurb";
    blurb.textContent = DECADE_DUMMY_BLURBS[decadeIndex] ?? DECADE_DUMMY_BLURBS[0];

    headerInner.append(eraP, h2, blurb);

    if (onRight) {
      headerLeft.classList.add("decade-header-side--filled");
      headerLeft.appendChild(headerInner);
      headerRight.classList.add("decade-header-side--empty");
    } else {
      headerRight.classList.add("decade-header-side--filled");
      headerRight.appendChild(headerInner);
      headerLeft.classList.add("decade-header-side--empty");
    }

    headerRow.append(headerLeft, headerAxis, headerRight);
    block.appendChild(headerRow);

    for (let year = bucket.startYear; year <= bucket.endYear; year++) {
      const row = document.createElement("div");
      row.className = "year-row";

      const leftCell = document.createElement("div");
      const axisCell = document.createElement("div");
      const rightCell = document.createElement("div");

      const yearEvents = byYear.get(year) ?? [];

      const eventsCell = onRight ? rightCell : leftCell;
      const emptyCell = onRight ? leftCell : rightCell;

      eventsCell.className = `year-side year-side--events ${onRight ? "year-side--right" : "year-side--left"}`;
      emptyCell.className = "year-side year-side--empty";

      axisCell.className = "year-axis-cell";
      const yearLabel = document.createElement("span");
      yearLabel.className = "year-axis-label";
      yearLabel.textContent = String(year);
      yearLabel.setAttribute("title", String(year));
      axisCell.appendChild(yearLabel);

      for (const ev of yearEvents) {
        const isFirstEver = Boolean(firstEverEvent && ev === firstEverEvent);
        eventsCell.appendChild(createEventDotWithPreview(ev, popover, { isFirstEver }));
      }

      row.append(leftCell, axisCell, rightCell);
      block.appendChild(row);
    }

    inner.appendChild(block);
  });

  wrap.appendChild(inner);
  rootEl.appendChild(wrap);
}

// -----------------------------------------------------------------------------
// Live region / status line updates
// Writes progress and result counts to [data-status] when present (e.g. a11y-friendly summary).
// -----------------------------------------------------------------------------
function setStatus(message) {
  const el = document.querySelector("[data-status]");
  if (el) el.textContent = message;
}

// -----------------------------------------------------------------------------
// Bootstrap
// Merges data, mounts the timeline and popover on #timeline-vertical, wires outside-click
// and scroll-to-close, and reports success or errors via setStatus.
// -----------------------------------------------------------------------------
async function main() {
  const root = $("#timeline-vertical");

  setStatus("Rendering timeline…");

  try {
    const merged = mergeEventsByDate(CONCERT_EVENTS);
    const byYear = groupEventsByYear(merged);

    const popover = createEventPopover();
    document.body.appendChild(popover.el);

    const onOutsidePointerDown = (e) => {
      if (popover.el.hidden) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (popover.el.contains(t)) return;
      if (t instanceof Element && t.closest(".event-dot")) return;
      hideEventPopover(popover);
    };

    renderTimelineVertical(root, byYear, popover, merged[0] ?? null);
    attachPopoverGlobalListeners(popover, onOutsidePointerDown);
    window.addEventListener(
      "scroll",
      () => {
        if (!popover.el.hidden) hideEventPopover(popover);
      },
      { passive: true }
    );

    await setupIntroOverlay();
    setupDecadeScroll(root);
    setupDotEntranceAnimations(root);

    setStatus(
      `Between ${START_YEAR} and ${END_YEAR}, I saw ${CONCERT_EVENTS.length} different sets on ${merged.length} concert dates. Each circle represents a date. Click a circle for details and setlist links. Outlined circles indicate additional content including stories, images, and videos.`
    );
  } catch (err) {
    console.error(err);
    setStatus(`Failed to render timeline: ${err instanceof Error ? err.message : String(err)}`);
  }
}

void main();
