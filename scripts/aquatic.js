(function initAquaticRoom() {
  const skyLayerEl = document.getElementById("sky-layer");
  const plantLayerEl = document.getElementById("plant-layer");
  const greenhouseImg = document.getElementById("greenhouse-img");
  const sceneViewportEl = greenhouseImg?.closest(".scene-viewport");
  const addPlantButtonEl = document.getElementById("add-plant");
  const assetRadioEls = () => document.querySelectorAll('input[name="plant-asset"]');
  const ROOM_STORAGE_ID = "aquatic";

  const drawnAssetBase = "assets/drawnplantassets/";
  const drawnAssetFiles = {
    tallleaves: "tallleaves.png",
    lotusflower: "lotusflower.png",
    waterpoppy: "waterpoppy.png",
    swirlygrass: "swirlygrass.png"
  };

  /** Each placement: one drawn plant in the plant layer (position/size as % of the layer). */
  const placedDrawnPlants = [];
  const maxPlacedSprites = 40;
  const dayMs = 45_000;

  function getLayerSize(layerEl) {
    const rect = layerEl.getBoundingClientRect();
    return {
      width: Math.max(1, Math.floor(rect.width)),
      height: Math.max(1, Math.floor(rect.height))
    };
  }

  function applyViewportAspectFromLoadedImage() {
    if (!greenhouseImg || !sceneViewportEl) return;
    const w = greenhouseImg.naturalWidth;
    const h = greenhouseImg.naturalHeight;
    if (!w || !h) return;
    sceneViewportEl.style.setProperty("--scene-aspect", `${w} / ${h}`);
    window.dispatchEvent(new Event("resize"));
  }

  const skyPresets = {
    aquaticBlue: {
      colors: ["#D7EEF7", "#C7E5F4", "#A8D9EE", "#86C8E5", "#6CB9D8", "#56ABC8"],
      layers: [
        { color: "#F0FAFC", opacity: 0.42, speed: 0.17, scale: 1.25, y: 0.63 },
        { color: "#E4F6FA", opacity: 0.32, speed: 0.09, scale: 1.65, y: 0.49 },
        { color: "#B8E4F0", opacity: 0.24, speed: 0.05, scale: 2.05, y: 0.36 },
        { color: "#9FD6E8", opacity: 0.15, speed: 0.03, scale: 2.55, y: 0.22 }
      ]
    },
    brightDay: {
      colors: ["#E8F4FF", "#DDEEFF", "#D0E8FE", "#BCDDF8", "#A9D1F0", "#96C2E8"],
      layers: [
        { color: "#FCFFFF", opacity: 0.44, speed: 0.2, scale: 1.2, y: 0.62 },
        { color: "#FCFFFF", opacity: 0.34, speed: 0.1, scale: 1.6, y: 0.5 },
        { color: "#FFFCED", opacity: 0.25, speed: 0.05, scale: 2, y: 0.38 },
        { color: "#FFFCED", opacity: 0.16, speed: 0.03, scale: 2.6, y: 0.25 }
      ]
    },
    softDusk: {
      colors: ["#F7DFE8", "#EECFE1", "#E4C3DE", "#D5B7D9", "#C5AACC", "#B29DC0"],
      layers: [
        { color: "#FFF3F6", opacity: 0.43, speed: 0.14, scale: 1.3, y: 0.65 },
        { color: "#FFF3F6", opacity: 0.32, speed: 0.07, scale: 1.7, y: 0.5 },
        { color: "#FFD6DE", opacity: 0.24, speed: 0.04, scale: 2.2, y: 0.36 },
        { color: "#FFD6DE", opacity: 0.16, speed: 0.02, scale: 2.8, y: 0.22 }
      ]
    }
  };

  const skyCycle = ["brightDay", "aquaticBlue", "brightDay", "softDusk", "aquaticBlue", "softDusk"];
  let skyPhaseStartedAt = Date.now();
  const skyCycleState = {
    cycleTargetKey:
      skyCycle[Math.floor((Date.now() - skyPhaseStartedAt) / dayMs) % skyCycle.length],
    skyCycle,
    skyPhaseStartedAt,
    dayMs
  };
  const skyBlend = {
    blendFromKey: skyCycleState.cycleTargetKey,
    blendToKey: skyCycleState.cycleTargetKey,
    blendStartMs: null
  };

  function startSkyCycle() {
    const tick = () => {
      const phase = Math.floor((Date.now() - skyPhaseStartedAt) / dayMs) % skyCycle.length;
      skyCycleState.cycleTargetKey = skyCycle[phase];
    };
    tick();
    window.setInterval(tick, 2000);
  }

  function getSelectedAssetKey() {
    const radios = assetRadioEls();
    for (let i = 0; i < radios.length; i += 1) {
      if (radios[i].checked) return radios[i].value;
    }
    return "tallleaves";
  }

  function getSelectedAssetSrc() {
    const key = getSelectedAssetKey();
    const file = drawnAssetFiles[key];
    return file ? `${drawnAssetBase}${file}` : `${drawnAssetBase}tallleaves.png`;
  }

  function renderPlacedDrawnPlants() {
    window.drawnPlantLayer?.renderPlacedDrawnPlants(plantLayerEl, placedDrawnPlants);
    window.conservatoryEyeSpy?.syncConservatoryEyeSpyVisitor(plantLayerEl, ROOM_STORAGE_ID);
  }

  function addDrawnPlantsToRoom() {
    const key = getSelectedAssetKey();
    const src = getSelectedAssetSrc();
    const pos = window.drawnPlantLayer?.computeDrawnPlantPlacement("aquatic", key, null, {
      placedItems: placedDrawnPlants
    });
    if (!pos) return;
    placedDrawnPlants.push({
      src,
      x: pos.x,
      y: pos.y,
      bottomOffsetPct: pos.bottomOffsetPct,
      scalePct: pos.scalePct,
      rotate: pos.rotate,
      flipX: pos.flipX,
      depth: pos.depth,
      anchor: pos.anchor,
      slotId: pos.slotId,
      stackOrder: window.drawnPlantLayer.allocDrawnPlantStackOrder()
    });
    while (placedDrawnPlants.length > maxPlacedSprites) {
      placedDrawnPlants.shift();
    }
    renderPlacedDrawnPlants();
  }

  greenhouseImg?.addEventListener("load", applyViewportAspectFromLoadedImage);
  if (greenhouseImg?.complete) applyViewportAspectFromLoadedImage();

  const skySketch = (p) => {
    window.createGradientCloudSkySketch(p, {
      skyPresets,
      defaultKey: "aquaticBlue",
      getLayerSize,
      skyLayerEl,
      skyCycleState,
      skyBlend
    });
  };

  new p5(skySketch);
  if (typeof window.initAquaticFountain === "function") {
    window.initAquaticFountain("fountain-layer");
  }
  if (typeof window.initAquaticPlants === "function" && plantLayerEl) {
    window.initAquaticPlants("plant-layer");
  }
  startSkyCycle();

  function hydrateFromSavedRoom() {
    const loaded = window.conservatoryStorage?.loadRoomPlants?.(ROOM_STORAGE_ID);
    if (!loaded?.length) return;
    for (let i = 0; i < loaded.length; i += 1) placedDrawnPlants.push(loaded[i]);
    window.drawnPlantLayer?.syncStackOrderFromLoadedItems(placedDrawnPlants);
  }
  hydrateFromSavedRoom();
  renderPlacedDrawnPlants();
  window.conservatoryEyeSpy?.bindEyeSpyResize(plantLayerEl, ROOM_STORAGE_ID);

  addPlantButtonEl?.addEventListener("click", addDrawnPlantsToRoom);

  document.getElementById("done-next-room")?.addEventListener("click", () => {
    if (!window.conservatoryStorage) return;
    window.conservatoryStorage.saveRoomPlants(ROOM_STORAGE_ID, placedDrawnPlants);
    window.conservatoryStorage.markRoomFinished(ROOM_STORAGE_ID);
    window.location.href = window.conservatoryStorage.getNextRoomPage(ROOM_STORAGE_ID);
  });
})();
