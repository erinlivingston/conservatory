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

  const statusEl = document.getElementById("gallery-tour-status");
  if (statusEl) {
    if (allFourDone) {
      statusEl.textContent =
        "All four rooms are saved on this device. Tiles show greenhouse art and your placed plants (sharp, not rasterized). Use the menu to open any room — motion and p5 effects only appear there.";
    } else {
      const n = window.conservatoryStorage?.getFinishedCount?.() ?? 0;
      statusEl.textContent = `Tour progress: ${n} of 4 rooms marked done. Use “Done — save & next room” in each biome, then return here after Aquatic.`;
    }
  }

  const unlockMsg = document.getElementById("eyespy-unlock-msg");
  if (unlockMsg) {
    if (animalEligible) {
      unlockMsg.textContent =
        "You have finished the tour with plants in every room — animal eye spy is unlocked. Use “Hide visitors in rooms” above, then open each biome from the bottom menu to find the tiny drawings tucked in the foliage.";
    } else {
      unlockMsg.textContent =
        "Make sure to add plants in all rooms to unlock eye spy mode (finish the tour with “Done — save & next room” and at least one plant saved in each biome).";
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
      const ok = global.confirm(
        "Clear all saved rooms, eye spy visitors, and tour progress in this browser? This cannot be undone."
      );
      if (!ok) return;
      window.conservatoryStorage?.clearAllAndReset?.();
      global.location.href = "index.html";
    });
  }
})();
