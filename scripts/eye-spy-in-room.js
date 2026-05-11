/**
 * Draws the eye-spy visitor in the live plant layer (between user plant z-indexes).
 * Clicking finds the visitor and sends the player to the next room (or completion flow).
 */
(function registerEyeSpyInRoom(global) {
  const ASSET_BY_ROOM = {
    palmhouse: "assets/drawneyespyassets/palmciveteyespy.png",
    rainforest: "assets/drawneyespyassets/birdeyespy.png",
    desert: "assets/drawneyespyassets/desertrateyespy.png",
    aquatic: "assets/drawneyespyassets/frogeyespy.png"
  };

  function hostZBounds(plantLayerEl) {
    const hosts = plantLayerEl.querySelectorAll(".user-drawn-plant-host");
    if (!hosts.length) return { minZ: 80, maxZ: 200 };
    const zs = [];
    for (let i = 0; i < hosts.length; i += 1) {
      const z = parseInt(hosts[i].style.zIndex, 10);
      if (!Number.isNaN(z) && z > 0) zs.push(z);
    }
    if (!zs.length) return { minZ: 80, maxZ: 200 };
    return { minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  /**
   * @param {HTMLElement} plantLayerEl
   * @param {string} roomId
   */
  function syncConservatoryEyeSpyVisitor(plantLayerEl, roomId) {
    if (!plantLayerEl || !roomId || !global.conservatoryStorage) return;
    const overlay = plantLayerEl.querySelector(".user-plant-overlay");
    const mountParent = overlay || plantLayerEl;
    const prev = mountParent.querySelector(".eye-spy-visitor-root");
    if (prev) prev.remove();

    const { released, placements, found } = global.conservatoryStorage.getEyeSpyState();
    if (!released) return;
    if (found && found[roomId]) return;

    const placement = placements[roomId];
    const src = ASSET_BY_ROOM[roomId];
    if (!placement || !src) return;

    const { minZ, maxZ } = hostZBounds(mountParent);
    let z = typeof placement.zIndex === "number" ? placement.zIndex : Math.round((minZ + maxZ) / 2);
    z = clamp(z, minZ, maxZ);

    const root = document.createElement("div");
    root.className = "eye-spy-visitor-root";
    root.setAttribute("aria-hidden", "false");
    root.style.zIndex = String(z);
    root.style.setProperty("--x", `${placement.x}%`);

    const inner = document.createElement("div");
    inner.className = "eye-spy-visitor-inner";

    if (placement.anchor === "bottomGrass") {
      root.classList.add("eye-spy-visitor-root--bottom-grass");
      root.style.setProperty("--by", `${placement.bottomOffsetPct ?? 0}%`);
      inner.classList.add("eye-spy-visitor-inner--bottom-grass");
    } else if (placement.anchor === "ground") {
      root.style.setProperty("--y", `${placement.y}%`);
      inner.classList.add("eye-spy-visitor-inner--ground");
    } else {
      root.style.setProperty("--y", `${placement.y}%`);
      inner.classList.add("eye-spy-visitor-inner--center");
    }

    const hit = document.createElement("button");
    hit.type = "button";
    hit.className = "eye-spy-visitor-hit";
    hit.setAttribute("aria-label", "Hidden visitor — tap if you found them");

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.className = "eye-spy-visitor-img";
    img.draggable = false;
    img.decoding = "async";
    inner.style.setProperty("--rot", `${placement.rotate}deg`);
    inner.style.setProperty("--flip", placement.flipX ? "-1" : "1");

    const rect = plantLayerEl.getBoundingClientRect();
    const layerW = Math.max(1, rect.width);
    const layerH = Math.max(1, rect.height);
    /** Slightly larger than raw placement so visitors stay findable without dominating the scene */
    const VISITOR_RENDER_SCALE = 1.18;
    const wPx = ((layerW * Number(placement.scalePct)) / 100) * VISITOR_RENDER_SCALE;
    img.style.width = `${Math.max(1, Math.round(wPx))}px`;
    const maxHFrac =
      placement.anchor === "bottomGrass" ? 0.24 : placement.anchor === "ground" ? 0.2 : 0.175;
    img.style.maxHeight = `${layerH * maxHFrac * VISITOR_RENDER_SCALE}px`;

    function onActivate(e) {
      e.preventDefault();
      e.stopPropagation();
      global.conservatoryStorage?.handleEyeSpyAnimalClick?.(roomId);
    }

    hit.addEventListener("click", onActivate);
    hit.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") onActivate(e);
    });

    hit.appendChild(img);
    inner.appendChild(hit);
    root.appendChild(inner);
    mountParent.appendChild(root);
  }

  function bindEyeSpyResize(plantLayerEl, roomId) {
    if (!plantLayerEl || plantLayerEl._conservatoryEyeSpyResizeBound) return;
    plantLayerEl._conservatoryEyeSpyResizeBound = true;
    let t = null;
    window.addEventListener("resize", () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => syncConservatoryEyeSpyVisitor(plantLayerEl, roomId), 120);
    });
  }

  global.conservatoryEyeSpy = {
    syncConservatoryEyeSpyVisitor,
    bindEyeSpyResize
  };
})(window);
