(function initGallery() {
  const GALLERY_PANELS = [
    { roomId: "palmhouse", layerId: "plant-layer-gallery-palmhouse", label: "Palm House" },
    { roomId: "rainforest", layerId: "plant-layer-gallery-rainforest", label: "Rainforest" },
    { roomId: "desert", layerId: "plant-layer-gallery-desert", label: "Desert" },
    { roomId: "aquatic", layerId: "plant-layer-gallery-aquatic", label: "Aquatic" }
  ];

  const bundle =
    window.conservatoryStorage?.readBundle?.() ||
    ({
      rooms: {},
      finishedRoomIds: [],
      eyeSpy: { released: false, placements: {}, found: {} }
    });

  const allFourDone = window.conservatoryStorage?.allFourRoomsMarkedDone?.() ?? false;

  const roomIdsForStatus = window.conservatoryStorage?.ROOM_IDS || [
    "palmhouse",
    "rainforest",
    "desert",
    "aquatic"
  ];
  const allRoomsPopulated = roomIdsForStatus.every(
    (id) => Array.isArray(bundle.rooms[id]) && bundle.rooms[id].length > 0
  );

  const animalEligible = allFourDone && allRoomsPopulated;

  function pageHrefForRoomId(roomId) {
    const flow = window.conservatoryStorage?.ROOM_FLOW;
    if (!flow) return null;
    const row = flow.find((r) => r.id === roomId);
    return row ? row.page : null;
  }

  /** When eye spy is unlocked, room titles and preview tiles link into each live biome. */
  function wireGalleryRoomNavigation() {
    if (!animalEligible) return;
    document.querySelectorAll(".gallery-figure").forEach((fig) => {
      const vp = fig.querySelector(".gallery-viewport[data-gallery-room]");
      const h2 = fig.querySelector("h2.gallery-panel-title");
      if (!vp || !h2 || vp.dataset.galleryNavWired === "1") return;
      const roomId = vp.getAttribute("data-gallery-room");
      const href = pageHrefForRoomId(roomId);
      if (!href) return;
      const label = h2.textContent.trim();
      const a = document.createElement("a");
      a.className = "gallery-panel-title__link";
      a.href = href;
      a.textContent = label;
      h2.replaceChildren(a);

      const go = () => {
        window.location.href = href;
      };
      vp.classList.add("gallery-viewport--room-link");
      vp.tabIndex = 0;
      vp.setAttribute("role", "link");
      vp.setAttribute("aria-label", `Open ${label} — edit this room`);
      vp.addEventListener("click", go);
      vp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
      vp.dataset.galleryNavWired = "1";
    });
  }

  const statusEl = document.getElementById("gallery-tour-status");
  if (statusEl) {
    if (allFourDone) {
      if (animalEligible) {
        statusEl.textContent =
          "All four rooms complete. Tap a room title or its preview to jump into that biome. Activate eye spy mode below to hide animals in the folliage.";
      } else {
        statusEl.textContent = "All four rooms are saved. Open any biome from the menu below.";
      }
    } else {
      const n = window.conservatoryStorage?.getFinishedCount?.() ?? 0;
      statusEl.textContent = `Tour progress: ${n} of 4 rooms marked done. Use “Done - Save & Go to Next Room” in each biome, then return here after the last room.`;
    }
  }

  const unlockMsg = document.getElementById("eyespy-unlock-msg");
  if (unlockMsg) {
    if (animalEligible) {
      unlockMsg.textContent =
        "You have finished the tour with plants added to each biome — animal eye spy is unlocked. Use “Hide visitors in rooms” above, then open each biome to find tiny animals tucked in the foliage.";
    } else {
      unlockMsg.textContent =
        "Make sure to add plants in all rooms to unlock eye spy mode (finish the tour with “Done - Save & Go to Next Room” and at least one plant saved in each biome).";
    }
  }

  function applyAspectFromImage(img, viewportEl) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h) viewportEl.style.setProperty("--scene-aspect", `${w} / ${h}`);
  }

  function renderPanel(cfg) {
    const layerEl = document.getElementById(cfg.layerId);
    const viewport = document.querySelector(`.gallery-viewport[data-gallery-room="${cfg.roomId}"]`);
    const gh = viewport?.querySelector(".greenhouse-layer");
    if (!viewport || !layerEl || !window.drawnPlantLayer) return;

    const plants = window.conservatoryStorage?.loadRoomPlants?.(cfg.roomId);
    const list = Array.isArray(plants) ? plants : [];
    window.drawnPlantLayer.syncStackOrderFromLoadedItems(list);
    window.drawnPlantLayer.renderPlacedDrawnPlants(layerEl, list, { editable: false });

    if (gh) {
      const apply = () => applyAspectFromImage(gh, viewport);
      gh.addEventListener("load", apply);
      if (gh.complete) apply();
    }
  }

  function renderAllPanels() {
    GALLERY_PANELS.forEach(renderPanel);
    requestAnimationFrame(() => {
      GALLERY_PANELS.forEach((cfg) => {
        const layerEl = document.getElementById(cfg.layerId);
        if (layerEl) window.drawnPlantLayer?.syncReadOnlyOverlayPlantSizesFromLayer(layerEl);
      });
    });
  }

  function startRenderPanels() {
    requestAnimationFrame(() => {
      requestAnimationFrame(renderAllPanels);
    });
  }
  if (document.readyState === "complete") {
    startRenderPanels();
  } else {
    window.addEventListener("load", startRenderPanels);
  }

  let resizeT = null;
  window.addEventListener("resize", () => {
    if (resizeT) window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      GALLERY_PANELS.forEach((cfg) => {
        const layerEl = document.getElementById(cfg.layerId);
        if (layerEl) window.drawnPlantLayer?.syncReadOnlyOverlayPlantSizesFromLayer(layerEl);
      });
    }, 150);
  });

  const animalPanel = document.getElementById("animal-eyespy-panel");
  const hideInRoomsBtn = document.getElementById("animal-eyespy-hide-in-rooms");
  const clearVisitorsBtn = document.getElementById("animal-eyespy-clear");
  const animalStatus = document.getElementById("animal-eyespy-status");

  if (animalPanel && animalEligible) {
    animalPanel.hidden = false;
  }

  wireGalleryRoomNavigation();

  function refreshAnimalUiFromStorage() {
    const { released } = window.conservatoryStorage?.getEyeSpyState?.() || { released: false };
    if (clearVisitorsBtn) clearVisitorsBtn.hidden = !released;
    if (animalStatus && released) {
      animalStatus.textContent =
        "Visitors are hiding in your live rooms. Open Palm House, Rainforest, Desert, and Aquatic from the menu below to spot each one.";
    }
  }
  refreshAnimalUiFromStorage();

  if (hideInRoomsBtn && animalEligible) {
    hideInRoomsBtn.addEventListener("click", () => {
      window.conservatoryStorage?.releaseEyeSpyVisitors?.();
      refreshAnimalUiFromStorage();
      if (animalStatus) {
        animalStatus.textContent =
          "Placed in each live room. Open a biome from the menu, tap a visitor when you spot them — you will jump to the next room until all four are found.";
      }
    });
  }

  if (clearVisitorsBtn && animalEligible) {
    clearVisitorsBtn.addEventListener("click", () => {
      window.conservatoryStorage?.clearEyeSpyVisitors?.();
      if (clearVisitorsBtn) clearVisitorsBtn.hidden = true;
      if (animalStatus) {
        animalStatus.textContent = "Visitors removed from all rooms. Press Hide visitors in rooms to play again.";
      }
    });
  }

  const startOver = document.getElementById("gallery-start-over");
  if (startOver) {
    startOver.addEventListener("click", () => {
      const ok = window.confirm(
        "Clear all saved rooms, eye spy visitors, and tour progress in this browser? This cannot be undone."
      );
      if (!ok) return;
      window.conservatoryStorage?.clearAllAndReset?.();
      window.location.href = "index.html";
    });
  }
})();
