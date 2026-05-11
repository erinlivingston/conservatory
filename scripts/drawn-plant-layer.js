/**
 * Shared DOM helpers for drawn PNG plants (overlay on plant-layer).
 * Each biome has its own menu of four assets; placement is driven by ROOM_PLANT_PROFILES
 * (percent of the plant layer, same box as the greenhouse art) — same idea as explicit vine bands for pothos.
 */
(function registerDrawnPlantLayer(global) {
  /**
   * Per biome, per asset key:
   * - anchor "ground": base of the image sits at y (grows upward).
   * - anchor "center": point is the center of the plant.
   * - type "bottomGrass": bottom of PNG flush with viewport bottom; optional xBands = [[xMin,xMax], ...] to pick a strip (like vine zones).
   * - type "vine": rainforest pothos only — hard-coded top / side bands (randomPothosPlacementRaw).
   * - scaleMin / scaleMax: used when slider scale is null (auto depth sizing).
   * - slots: optional [{ x, y? }, ...] layer % — each add picks a free slot for that plantKey
   *   (see computeDrawnPlantPlacement(..., { placedItems })); when all slots are taken,
   *   falls back to the random rectangle / xBands behavior above.
   */
  const ROOM_PLANT_PROFILES = {
    aquatic: {
      tallleaves: {
        anchor: "ground",
        yMin: 56,
        yMax: 96,
        xMin: 4,
        xMax: 96,
        rotMin: -18,
        rotMax: 18,
        scaleMin: 18,
        scaleMax: 58,
        slots: [
          { x: 14, y: 72 },
          { x: 32, y: 78 },
          { x: 50, y: 74 },
          { x: 68, y: 80 },
          { x: 86, y: 76 },
          { x: 24, y: 88 }
        ]
      },
      lotusflower: {
        anchor: "center",
        yMin: 48,
        yMax: 74,
        xMin: 8,
        xMax: 92,
        rotMin: 0,
        rotMax: 0,
        scaleMin: 5,
        scaleMax: 20,
        slots: [
          { x: 22, y: 58 },
          { x: 42, y: 62 },
          { x: 58, y: 55 },
          { x: 75, y: 60 },
          { x: 18, y: 66 },
          { x: 86, y: 64 }
        ]
      },
      waterpoppy: {
        anchor: "center",
        yMin: 54,
        yMax: 84,
        xMin: 6,
        xMax: 94,
        rotMin: -28,
        rotMax: 28,
        scaleMin: 4,
        scaleMax: 28,
        slots: [
          { x: 18, y: 62 },
          { x: 38, y: 70 },
          { x: 55, y: 64 },
          { x: 74, y: 72 },
          { x: 90, y: 66 },
          { x: 30, y: 76 }
        ]
      },
      swirlygrass: {
        type: "bottomGrass",
        xBands: [
          [4, 35],
          [65, 96]
        ],
        rotMin: -28,
        rotMax: 28,
        scaleMin: 20,
        scaleMax: 44,
        slots: [{ x: 12 }, { x: 22 }, { x: 30 }, { x: 70 }, { x: 80 }, { x: 90 }]
      }
    },
    rainforest: {
      monstera: {
        anchor: "ground",
        yMin: 62,
        yMax: 94,
        xMin: 5,
        xMax: 95,
        rotMin: 0,
        rotMax: 0,
        scaleMin: 18,
        scaleMax: 56,
        slots: [
          { x: 18, y: 78 },
          { x: 40, y: 72 },
          { x: 55, y: 80 },
          { x: 72, y: 74 },
          { x: 45, y: 76 },
          { x: 30, y: 88 }
        ]
      },
      birdofparadise: {
        anchor: "ground",
        yMin: 58,
        yMax: 92,
        xMin: 5,
        xMax: 95,
        rotMin: -5,
        rotMax: 5,
        scaleMin: 16,
        scaleMax: 52,
        slots: [
          { x: 20, y: 74 },
          { x: 45, y: 70 },
          { x: 65, y: 76 },
          { x: 82, y: 72 },
          { x: 12, y: 82 },
          { x: 55, y: 84 }
        ]
      },
      pothos: { type: "vine", scaleMin: 14, scaleMax: 44 },
      curlyjungle: {
        anchor: "ground",
        yMin: 60,
        yMax: 94,
        xMin: 5,
        xMax: 95,
        rotMin: -25,
        rotMax: 25,
        scaleMin: 16,
        scaleMax: 54,
        slots: [
          { x: 16, y: 76 },
          { x: 35, y: 82 },
          { x: 52, y: 74 },
          { x: 70, y: 78 },
          { x: 88, y: 72 },
          { x: 48, y: 88 }
        ]
      }
    },
    desert: {
      tallcactus: {
        anchor: "ground",
        yMin: 48,
        yMax: 96,
        xMin: 6,
        xMax: 94,
        rotMin: -12,
        rotMax: 12,
        scaleMin: 20,
        scaleMax: 58,
        slots: [
          { x: 14, y: 72 },
          { x: 32, y: 80 },
          { x: 50, y: 76 },
          { x: 68, y: 84 },
          { x: 86, y: 78 },
          { x: 40, y: 90 }
        ]
      },
      shortcactus: {
        anchor: "ground",
        yMin: 58,
        yMax: 96,
        xMin: 8,
        xMax: 92,
        rotMin: -22,
        rotMax: 22,
        scaleMin: 14,
        scaleMax: 42,
        slots: [
          { x: 20, y: 78 },
          { x: 44, y: 84 },
          { x: 62, y: 80 },
          { x: 78, y: 88 },
          { x: 12, y: 86 },
          { x: 52, y: 92 }
        ]
      },
      desertbloom: {
        anchor: "center",
        yMin: 52,
        yMax: 82,
        xMin: 10,
        xMax: 90,
        rotMin: -18,
        rotMax: 18,
        scaleMin: 12,
        scaleMax: 38,
        slots: [
          { x: 24, y: 62 },
          { x: 46, y: 68 },
          { x: 64, y: 58 },
          { x: 82, y: 66 },
          { x: 18, y: 72 },
          { x: 54, y: 74 }
        ]
      },
      genericdesertplant: {
        anchor: "ground",
        yMin: 54,
        yMax: 94,
        xMin: 5,
        xMax: 95,
        rotMin: -20,
        rotMax: 20,
        scaleMin: 16,
        scaleMax: 50,
        slots: [
          { x: 16, y: 76 },
          { x: 36, y: 82 },
          { x: 56, y: 78 },
          { x: 74, y: 86 },
          { x: 88, y: 80 },
          { x: 28, y: 88 }
        ]
      }
    },
    palmhouse: {
      curlyshorttree: {
        anchor: "ground",
        yMin: 62,
        yMax: 96,
        xMin: 6,
        xMax: 94,
        rotMin: -14,
        rotMax: 14,
        scaleMin: 20,
        scaleMax: 52,
        slots: [
          { x: 18, y: 78 },
          { x: 38, y: 84 },
          { x: 56, y: 76 },
          { x: 74, y: 82 },
          { x: 88, y: 74 },
          { x: 48, y: 90 }
        ]
      },
      fern: {
        anchor: "ground",
        yMin: 58,
        yMax: 94,
        xMin: 5,
        xMax: 95,
        rotMin: -22,
        rotMax: 22,
        scaleMin: 16,
        scaleMax: 48,
        slots: [
          { x: 16, y: 74 },
          { x: 36, y: 80 },
          { x: 54, y: 72 },
          { x: 72, y: 78 },
          { x: 88, y: 76 },
          { x: 26, y: 86 }
        ]
      },
      spikeypalm: {
        anchor: "ground",
        yMin: 56,
        yMax: 96,
        xMin: 4,
        xMax: 96,
        rotMin: -12,
        rotMax: 12,
        scaleMin: 22,
        scaleMax: 60,
        slots: [
          { x: 14, y: 76 },
          { x: 34, y: 82 },
          { x: 52, y: 74 },
          { x: 70, y: 80 },
          { x: 88, y: 78 },
          { x: 48, y: 88 }
        ]
      },
      tallpalm: {
        anchor: "ground",
        yMin: 52,
        yMax: 96,
        xMin: 4,
        xMax: 96,
        rotMin: -10,
        rotMax: 10,
        scaleMin: 24,
        scaleMax: 64,
        slots: [
          { x: 12, y: 72 },
          { x: 32, y: 78 },
          { x: 50, y: 70 },
          { x: 68, y: 76 },
          { x: 86, y: 74 },
          { x: 44, y: 86 }
        ]
      }
    }
  };

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  let drawnPlantStackSeq = 0;
  const STACK_ORDER_Z_STRIDE = 150;
  const DRAG_Z = 2_000_000;

  /** Call when pushing a new placed plant so it stacks above older additions (depth still tweaks z within that). */
  function allocDrawnPlantStackOrder() {
    drawnPlantStackSeq += 1;
    return drawnPlantStackSeq;
  }

  /** After loading plants from storage, bump the stack counter so new plants still stack above saved ones. */
  function syncStackOrderFromLoadedItems(items) {
    if (!items || !items.length) return;
    let m = drawnPlantStackSeq;
    for (let i = 0; i < items.length; i += 1) {
      const o = items[i].stackOrder;
      if (typeof o === "number" && o > m) m = o;
    }
    drawnPlantStackSeq = m;
  }

  function zIndexForDrawnPlant(item) {
    const order = item.stackOrder ?? 0;
    return 10 + order * STACK_ORDER_Z_STRIDE + Math.round((item.depth ?? 0) * 90);
  }

  function randomPothosPlacementRaw() {
    const roll = Math.random();
    if (roll < 0.34) {
      return {
        zone: "top",
        x: 8 + Math.random() * 84,
        y: 1.5 + Math.random() * 8,
        rotate: 42 + Math.random() * 44,
        flipX: Math.random() < 0.48
      };
    }
    if (roll < 0.67) {
      return {
        zone: "left",
        x: 0.4 + Math.random() * 7,
        y: 14 + Math.random() * 72,
        rotate: -48 + Math.random() * 36,
        flipX: Math.random() < 0.38
      };
    }
    return {
      zone: "right",
      x: 93 + Math.random() * 6.6,
      y: 14 + Math.random() * 72,
      rotate: -52 + Math.random() * 40,
      flipX: Math.random() < 0.62
    };
  }

  function pothosDepthFromZone(zone, y) {
    if (zone === "top") return clamp01((y - 1.5) / 7.5);
    return clamp01((y - 14) / 72);
  }

  function usesAutoScale(sliderScalePct) {
    return sliderScalePct == null || sliderScalePct === "";
  }

  function pickXFromProfile(profile) {
    if (profile.xBands && profile.xBands.length) {
      const band = profile.xBands[Math.floor(Math.random() * profile.xBands.length)];
      const lo = Math.min(band[0], band[1]);
      const hi = Math.max(band[0], band[1]);
      return lo + Math.random() * (hi - lo);
    }
    return profile.xMin + Math.random() * (profile.xMax - profile.xMin);
  }

  /**
   * @param {Array<{ x: number, y?: number }>} slots
   * @param {string} plantKey
   * @param {Array<{ slotId?: string }>} placedItems
   * @returns {number|null} slot index, or null if none / all occupied
   */
  function pickRandomFreeSlotIndex(slots, plantKey, placedItems) {
    if (!slots || !slots.length) return null;
    const prefix = `${plantKey}:`;
    const occupied = new Set();
    for (let i = 0; i < placedItems.length; i += 1) {
      const id = placedItems[i].slotId;
      if (id == null || !String(id).startsWith(prefix)) continue;
      const tail = String(id).slice(prefix.length);
      const n = parseInt(tail, 10);
      if (!Number.isNaN(n) && n >= 0 && n < slots.length) occupied.add(n);
    }
    const free = [];
    for (let j = 0; j < slots.length; j += 1) {
      if (!occupied.has(j)) free.push(j);
    }
    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  /**
   * @param {object} profile
   * @param {number} depth 0..1 (back .. front)
   * @param {number|null|undefined} sliderScalePct
   */
  function scaleFromDepth(profile, depth, sliderScalePct) {
    if (!usesAutoScale(sliderScalePct)) {
      const base = Math.max(8, Number(sliderScalePct));
      return base * (0.48 + depth * 0.52) * (0.96 + Math.random() * 0.08);
    }
    const sm = profile.scaleMin ?? 16;
    const sx = profile.scaleMax ?? 52;
    return (sm + depth * (sx - sm)) * (0.92 + Math.random() * 0.16);
  }

  /**
   * @param {string} roomId - "aquatic" | "rainforest" | "desert" | "palmhouse"
   * @param {string} plantKey
   * @param {number|null|undefined} sliderScalePct
   * @param {{ placedItems?: Array<{ slotId?: string }> }} [context]
   */
  function computeDrawnPlantPlacement(roomId, plantKey, sliderScalePct, context) {
    const placedItems = (context && context.placedItems) || [];
    const profile = roomId && ROOM_PLANT_PROFILES[roomId] ? ROOM_PLANT_PROFILES[roomId][plantKey] : null;

    if (!profile) {
      const y = 56 + Math.random() * 38;
      const depth = clamp01((y - 56) / 38);
      const pseudo = { scaleMin: 14, scaleMax: 46 };
      return {
        x: 4 + Math.random() * 92,
        y,
        scalePct: scaleFromDepth(pseudo, depth, sliderScalePct),
        rotate: -18 + Math.random() * 36,
        flipX: Math.random() < 0.5,
        depth,
        anchor: "center"
      };
    }

    if (profile.type === "bottomGrass") {
      const rotate = profile.rotMin + Math.random() * (profile.rotMax - profile.rotMin);
      const slots = profile.slots;
      const idx = pickRandomFreeSlotIndex(slots, plantKey, placedItems);
      let x;
      let slotId;
      if (idx != null && slots && slots[idx]) {
        x = slots[idx].x;
        slotId = `${plantKey}:${idx}`;
      } else {
        x = pickXFromProfile(profile);
      }
      const depth = Math.random();
      return {
        x,
        y: 0,
        bottomOffsetPct: 0,
        scalePct: scaleFromDepth(profile, depth, sliderScalePct),
        rotate,
        flipX: Math.random() < 0.5,
        depth,
        anchor: "bottomGrass",
        slotId
      };
    }

    if (profile.type === "vine") {
      const pos = randomPothosPlacementRaw();
      const depth = pothosDepthFromZone(pos.zone, pos.y);
      return {
        x: pos.x,
        y: pos.y,
        scalePct: scaleFromDepth(profile, depth, sliderScalePct),
        rotate: pos.rotate,
        flipX: pos.flipX,
        depth,
        anchor: "vine"
      };
    }

    const span = Math.max(0.001, profile.yMax - profile.yMin);
    const slots = profile.slots;
    const idx = pickRandomFreeSlotIndex(slots, plantKey, placedItems);
    let x;
    let y;
    let depth;
    let slotId;
    if (idx != null && slots && slots[idx] && typeof slots[idx].y === "number") {
      const pt = slots[idx];
      x = pt.x;
      y = pt.y;
      depth = clamp01((y - profile.yMin) / span);
      slotId = `${plantKey}:${idx}`;
    } else {
      y = profile.yMin + Math.random() * (profile.yMax - profile.yMin);
      depth = clamp01((y - profile.yMin) / span);
      x = pickXFromProfile(profile);
    }
    const rotate = profile.rotMin + Math.random() * (profile.rotMax - profile.rotMin);

    return {
      x,
      y,
      scalePct: scaleFromDepth(profile, depth, sliderScalePct),
      rotate,
      flipX: Math.random() < 0.5,
      depth,
      anchor: profile.anchor,
      slotId
    };
  }

  function ensureUserPlantOverlay(plantLayerEl) {
    let overlay = plantLayerEl.querySelector(".user-plant-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "user-plant-overlay";
      plantLayerEl.appendChild(overlay);
    }
    return overlay;
  }

  function clearSlotReservation(item) {
    if (item && item.slotId != null) delete item.slotId;
  }

  function innerAnchorClass(item) {
    if (item.anchor === "bottomGrass") return "user-drawn-plant-host-inner--bottom-grass";
    if (item.anchor === "ground") return "user-drawn-plant-host-inner--ground";
    if (item.anchor === "vine") return "user-drawn-plant-host-inner--vine";
    return "user-drawn-plant-host-inner--center";
  }

  function syncDrawnPlantImgClasses(img, item) {
    const classes = ["user-drawn-plant"];
    if (item.anchor === "vine") classes.push("user-drawn-plant--vine");
    else if (item.anchor === "ground") classes.push("user-drawn-plant--ground");
    else if (item.anchor === "bottomGrass") classes.push("user-drawn-plant--bottom-grass");
    if (item.depth < 0.3) classes.push("user-drawn-plant--distant");
    img.className = classes.join(" ");
  }

  /**
   * Host is a zero-size anchor; % widths on children would resolve to 0, so we set img width/max-height in px from the layer.
   */
  function syncDrawnPlantHostDom(plantLayerEl, host, inner, img, item) {
    const z = zIndexForDrawnPlant(item);
    host.style.zIndex = String(z);
    host.style.setProperty("--x", `${item.x}%`);
    if (item.anchor === "bottomGrass") {
      host.classList.add("user-drawn-plant-host--bottom-grass");
      host.style.setProperty("--by", `${item.bottomOffsetPct ?? 0}%`);
    } else {
      host.classList.remove("user-drawn-plant-host--bottom-grass");
      host.style.setProperty("--y", `${item.y}%`);
    }
    inner.className = `user-drawn-plant-host-inner ${innerAnchorClass(item)}`;
    inner.style.setProperty("--rot", `${item.rotate}deg`);
    inner.style.setProperty("--flip", item.flipX ? "-1" : "1");
    const rect = plantLayerEl.getBoundingClientRect();
    const layerW = Math.max(1, rect.width);
    const layerH = Math.max(1, rect.height);
    const wPx = (layerW * Number(item.scalePct)) / 100;
    img.style.width = `${Math.max(1, wPx)}px`;
    const maxHFrac = item.anchor === "bottomGrass" ? 0.68 : item.anchor === "vine" ? 0.78 : 0.55;
    img.style.maxHeight = `${layerH * maxHFrac}px`;
    img.style.setProperty("--depth", String(item.depth));
    const opacity = 0.72 + item.depth * 0.22;
    img.style.opacity = String(opacity);
    syncDrawnPlantImgClasses(img, item);
  }

  function debounce(fn, ms) {
    let t = null;
    return function debounced(...args) {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        t = null;
        fn(...args);
      }, ms);
    };
  }

  function clearHudVisibleHosts(plantLayerEl) {
    const overlay = plantLayerEl.querySelector(".user-plant-overlay");
    if (!overlay) return;
    overlay.querySelectorAll(".user-drawn-plant-host--hud-visible").forEach((h) => {
      h.classList.remove("user-drawn-plant-host--hud-visible");
    });
  }

  function bindDrawnPlantHudDismissOutside(plantLayerEl) {
    if (plantLayerEl._drawnPlantHudDismissBound) return;
    plantLayerEl._drawnPlantHudDismissBound = true;
    document.addEventListener("pointerdown", (e) => {
      const overlay = plantLayerEl.querySelector(".user-plant-overlay");
      if (!overlay) return;
      const t = e.target;
      if (overlay.contains(t)) return;
      clearHudVisibleHosts(plantLayerEl);
    });
  }

  function bindDrawnPlantLayerResize(plantLayerEl) {
    if (plantLayerEl._drawnPlantResizeBound) return;
    plantLayerEl._drawnPlantResizeBound = true;
    const onResize = debounce(() => {
      const overlay = plantLayerEl.querySelector(".user-plant-overlay");
      const items = overlay && overlay._placedItemsRef;
      if (!overlay || !items || !items.length) return;
      overlay.querySelectorAll("[data-drawn-plant-index]").forEach((host) => {
        const i = parseInt(host.getAttribute("data-drawn-plant-index"), 10);
        if (Number.isNaN(i)) return;
        const it = items[i];
        if (!it) return;
        const inner = host.querySelector(".user-drawn-plant-host-inner");
        const im = inner && inner.querySelector("img");
        if (inner && im) syncDrawnPlantHostDom(plantLayerEl, host, inner, im, it);
      });
    }, 80);
    window.addEventListener("resize", onResize);
  }

  function createDrawnPlantImg(item) {
    const img = document.createElement("img");
    syncDrawnPlantImgClasses(img, item);
    img.src = item.src;
    img.alt = "";
    img.draggable = false;
    img.loading = "lazy";
    img.style.setProperty("--x", `${item.x}%`);
    if (item.anchor === "bottomGrass") {
      img.style.setProperty("--by", `${item.bottomOffsetPct ?? 0}%`);
    } else {
      img.style.setProperty("--y", `${item.y}%`);
    }
    img.style.setProperty("--w", `${item.scalePct}%`);
    img.style.setProperty("--rot", `${item.rotate}deg`);
    img.style.setProperty("--flip", item.flipX ? "-1" : "1");
    img.style.setProperty("--depth", String(item.depth));
    const opacity = 0.72 + item.depth * 0.22;
    img.style.opacity = String(opacity);
    img.style.zIndex = String(zIndexForDrawnPlant(item));
    return img;
  }

  /**
   * @param {HTMLElement} plantLayerEl
   * @param {Array<object>} items — same array the room mutates
   * @param {object} item
   * @param {number} itemIndex — index in `items` (stable for this render pass)
   */
  function createDrawnPlantHost(plantLayerEl, items, item, itemIndex) {
    const host = document.createElement("div");
    host.className = "user-drawn-plant-host";
    host.setAttribute("data-drawn-plant-index", String(itemIndex));
    if (item.anchor === "bottomGrass") host.classList.add("user-drawn-plant-host--bottom-grass");

    const hud = document.createElement("div");
    hud.className = "user-drawn-plant-hud";
    hud.setAttribute("role", "group");
    hud.setAttribute("aria-label", "Plant size and rotation");

    const sizeLab = document.createElement("label");
    sizeLab.textContent = "Size";
    const sizeRange = document.createElement("input");
    sizeRange.type = "range";
    sizeRange.min = "6";
    sizeRange.max = "72";
    sizeRange.step = "0.5";
    sizeLab.appendChild(sizeRange);

    const rotLab = document.createElement("label");
    rotLab.textContent = "Turn";
    const rotRange = document.createElement("input");
    rotRange.type = "range";
    rotRange.min = "-90";
    rotRange.max = "90";
    rotRange.step = "1";
    rotLab.appendChild(rotRange);

    hud.appendChild(sizeLab);
    hud.appendChild(rotLab);

    const inner = document.createElement("div");
    inner.className = `user-drawn-plant-host-inner ${innerAnchorClass(item)}`;

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    img.draggable = false;
    img.loading = "lazy";
    img.className = "user-drawn-plant";

    inner.appendChild(img);
    host.appendChild(inner);
    host.appendChild(hud);

    function getItem() {
      return items[itemIndex];
    }

    function refreshSliders() {
      const it = getItem();
      if (!it) return;
      sizeRange.value = String(it.scalePct);
      rotRange.value = String(Math.round(it.rotate));
    }

    function applySlidersToItem() {
      const it = getItem();
      if (!it) return;
      clearSlotReservation(it);
      it.scalePct = Number(sizeRange.value);
      it.rotate = Number(rotRange.value);
      syncDrawnPlantHostDom(plantLayerEl, host, inner, img, it);
    }

    sizeRange.addEventListener("input", applySlidersToItem);
    rotRange.addEventListener("input", applySlidersToItem);
    hud.addEventListener("pointerdown", (e) => e.stopPropagation());

    hud.addEventListener("focusin", () => {
      clearHudVisibleHosts(plantLayerEl);
      host.classList.add("user-drawn-plant-host--hud-visible");
    });

    let drag = null;
    let savedZ = "";

    function onPointerDown(e) {
      if (e.button !== 0) return;
      const it = getItem();
      if (!it) return;
      e.preventDefault();
      clearSlotReservation(it);
      clearHudVisibleHosts(plantLayerEl);
      drag = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: it.x,
        startY: it.y
      };
      savedZ = String(zIndexForDrawnPlant(it));
      host.style.zIndex = String(DRAG_Z);
      try {
        inner.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }

    function onPointerMove(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const it = getItem();
      if (!it) return;
      const r = plantLayerEl.getBoundingClientRect();
      const dx = ((e.clientX - drag.startClientX) / Math.max(1, r.width)) * 100;
      const dy = ((e.clientY - drag.startClientY) / Math.max(1, r.height)) * 100;
      if (it.anchor === "bottomGrass") {
        it.x = drag.startX + dx;
      } else {
        it.x = drag.startX + dx;
        it.y = drag.startY + dy;
      }
      syncDrawnPlantHostDom(plantLayerEl, host, inner, img, it);
      host.style.zIndex = String(DRAG_Z);
    }

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      drag = null;
      host.style.zIndex = savedZ || String(zIndexForDrawnPlant(getItem()));
      try {
        inner.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
      clearHudVisibleHosts(plantLayerEl);
      host.classList.add("user-drawn-plant-host--hud-visible");
    }

    inner.addEventListener("pointerdown", onPointerDown);
    inner.addEventListener("pointermove", onPointerMove);
    inner.addEventListener("pointerup", endDrag);
    inner.addEventListener("pointercancel", endDrag);

    syncDrawnPlantHostDom(plantLayerEl, host, inner, img, item);
    refreshSliders();

    return host;
  }

  /**
   * @param {HTMLElement} plantLayerEl
   * @param {Array<object>} items
   * @param {{ editable?: boolean }} [options] — set editable: false for a locked scene (e.g. eye-spy mode later)
   */
  function renderPlacedDrawnPlants(plantLayerEl, items, options) {
    const overlay = ensureUserPlantOverlay(plantLayerEl);
    overlay.innerHTML = "";
    overlay._placedItemsRef = items;
    const editable = !options || options.editable !== false;
    if (editable) {
      bindDrawnPlantLayerResize(plantLayerEl);
      bindDrawnPlantHudDismissOutside(plantLayerEl);
    }
    const sorted = items
      .map((it, index) => ({ item: it, index }))
      .sort((a, b) => {
        const ao = a.item.stackOrder ?? 0;
        const bo = b.item.stackOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return a.item.depth - b.item.depth;
      });
    sorted.forEach(({ item, index }) => {
      const node = editable
        ? createDrawnPlantHost(plantLayerEl, items, item, index)
        : createDrawnPlantImg(item);
      overlay.appendChild(node);
    });

    if (!editable && items.length) {
      const runSync = () => syncReadOnlyOverlayPlantSizes(plantLayerEl, sorted);
      requestAnimationFrame(() => {
        runSync();
        requestAnimationFrame(runSync);
      });
    }
  }

  /**
   * Read-only gallery tiles: %-based width on imgs can resolve to 0 before layout; set px sizes from the layer box.
   * @param {Array<{ item: object }>} sortedSameOrderAsDom — same order as appendChild of imgs
   */
  function syncReadOnlyOverlayPlantSizes(plantLayerEl, sortedSameOrderAsDom) {
    const overlay = plantLayerEl.querySelector(".user-plant-overlay");
    if (!overlay || !sortedSameOrderAsDom || !sortedSameOrderAsDom.length) return;
    const rect = plantLayerEl.getBoundingClientRect();
    const layerW = Math.max(1, rect.width);
    const layerH = Math.max(1, rect.height);
    const imgs = overlay.querySelectorAll("img.user-drawn-plant");
    for (let i = 0; i < sortedSameOrderAsDom.length; i += 1) {
      const item = sortedSameOrderAsDom[i].item;
      const img = imgs[i];
      if (!img || !item) continue;
      const wPx = (layerW * Number(item.scalePct)) / 100;
      img.style.width = `${Math.max(1, Math.round(wPx))}px`;
      const maxHFrac =
        item.anchor === "bottomGrass" ? 0.68 : item.anchor === "vine" ? 0.78 : 0.55;
      img.style.maxHeight = `${layerH * maxHFrac}px`;
    }
  }

  /** Recompute px sizes for read-only plants (e.g. after gallery panel resize). */
  function syncReadOnlyOverlayPlantSizesFromLayer(plantLayerEl) {
    const overlay = plantLayerEl.querySelector(".user-plant-overlay");
    const items = overlay && overlay._placedItemsRef;
    if (!overlay || !items || !items.length) return;
    const sorted = items
      .map((it, index) => ({ item: it, index }))
      .sort((a, b) => {
        const ao = a.item.stackOrder ?? 0;
        const bo = b.item.stackOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return a.item.depth - b.item.depth;
      });
    syncReadOnlyOverlayPlantSizes(plantLayerEl, sorted);
  }

  global.drawnPlantLayer = {
    ROOM_PLANT_PROFILES,
    computeDrawnPlantPlacement,
    ensureUserPlantOverlay,
    renderPlacedDrawnPlants,
    allocDrawnPlantStackOrder,
    syncStackOrderFromLoadedItems,
    syncReadOnlyOverlayPlantSizes,
    syncReadOnlyOverlayPlantSizesFromLayer
  };
})(window);
