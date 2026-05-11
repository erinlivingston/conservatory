(function initDesertRoom() {
  const skyLayerEl = document.getElementById("sky-layer");
  const plantLayerEl = document.getElementById("plant-layer");
  const greenhouseImg = document.getElementById("greenhouse-img");
  const sceneViewportEl = greenhouseImg?.closest(".scene-viewport");
  const addPlantButtonEl = document.getElementById("add-plant");
  const assetRadioEls = () => document.querySelectorAll('input[name="plant-asset"]');
  const ROOM_STORAGE_ID = "desert";

  const drawnAssetBase = "assets/drawnplantassets/";
  const drawnAssetFiles = {
    tallcactus: "tallcactus.png",
    shortcactus: "shortcactus.png",
    desertbloom: "desertbloom.png",
    genericdesertplant: "genericdesertplant.png"
  };

  const placedDrawnPlants = [];
  const maxPlacedSprites = window.conservatoryStorage?.MAX_DRAWN_PLANTS_PER_ROOM ?? 40;
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

  // Same drifting cloud layers as Palm House for matching preset names (gradient stays desert-tuned).
  const skyPresets = {
    brightDay: {
      colors: ["#E8F4FF", "#DDEEFF", "#D0E8FE", "#BADAF6", "#A3C9EA", "#8AB8DD"],
      layers: [
        { color: "#FCFFFF", opacity: 0.44, speed: 0.2, scale: 1.2, y: 0.62 },
        { color: "#FCFFFF", opacity: 0.34, speed: 0.1, scale: 1.6, y: 0.5 },
        { color: "#FFFCED", opacity: 0.25, speed: 0.05, scale: 2, y: 0.38 },
        { color: "#FFFCED", opacity: 0.16, speed: 0.03, scale: 2.6, y: 0.25 }
      ]
    },
    goldenHour: {
      colors: ["#FFE5BA", "#FFD6A2", "#FFC88D", "#F8AF72", "#E99766", "#D8855E"],
      layers: [
        { color: "#FFF5E0", opacity: 0.42, speed: 0.18, scale: 1.2, y: 0.62 },
        { color: "#FFF5E0", opacity: 0.31, speed: 0.09, scale: 1.6, y: 0.5 },
        { color: "#FFDBB0", opacity: 0.23, speed: 0.05, scale: 2, y: 0.38 },
        { color: "#FFDBB0", opacity: 0.16, speed: 0.03, scale: 2.6, y: 0.25 }
      ]
    },
    overcast: {
      colors: ["#D8DFE8", "#CBD4DE", "#BEC9D4", "#AEBCCC", "#9EAFBF", "#8D9FB2"],
      layers: [
        { color: "#F2F6F9", opacity: 0.5, speed: 0.22, scale: 1.3, y: 0.65 },
        { color: "#F2F6F9", opacity: 0.4, speed: 0.11, scale: 1.8, y: 0.5 },
        { color: "#E6ECF0", opacity: 0.31, speed: 0.06, scale: 2.2, y: 0.35 },
        { color: "#E6ECF0", opacity: 0.22, speed: 0.03, scale: 2.8, y: 0.2 }
      ]
    },
    stormy: {
      colors: ["#7A8798", "#6F7D8F", "#637286", "#56657A", "#48586D", "#3D4E63"],
      layers: [
        { color: "#C7D5E0", opacity: 0.46, speed: 0.55, scale: 1.1, y: 0.7 },
        { color: "#C7D5E0", opacity: 0.36, speed: 0.32, scale: 1.5, y: 0.55 },
        { color: "#71808F", opacity: 0.29, speed: 0.18, scale: 2, y: 0.38 },
        { color: "#71808F", opacity: 0.23, speed: 0.08, scale: 2.5, y: 0.22 }
      ]
    },
    softDusk: {
      colors: ["#FFE0D4", "#FDD3CA", "#FBC7C2", "#E8B5BD", "#D3A6B9", "#C49AB5"],
      layers: [
        { color: "#FFF3F6", opacity: 0.43, speed: 0.14, scale: 1.3, y: 0.65 },
        { color: "#FFF3F6", opacity: 0.32, speed: 0.07, scale: 1.7, y: 0.5 },
        { color: "#FFD6DE", opacity: 0.24, speed: 0.04, scale: 2.2, y: 0.36 },
        { color: "#FFD6DE", opacity: 0.16, speed: 0.02, scale: 2.8, y: 0.22 }
      ]
    }
  };

  const skyCycle = ["brightDay", "stormy", "brightDay", "goldenHour", "softDusk", "overcast"];
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
    return "tallcactus";
  }

  function getSelectedAssetSrc() {
    const key = getSelectedAssetKey();
    const file = drawnAssetFiles[key];
    return file ? `${drawnAssetBase}${file}` : `${drawnAssetBase}tallcactus.png`;
  }

  function renderPlacedDrawnPlants() {
    window.drawnPlantLayer?.renderPlacedDrawnPlants(plantLayerEl, placedDrawnPlants);
    window.conservatoryEyeSpy?.syncConservatoryEyeSpyVisitor(plantLayerEl, ROOM_STORAGE_ID);
  }

  function addDrawnPlantsToRoom() {
    const key = getSelectedAssetKey();
    const src = getSelectedAssetSrc();
    const pos = window.drawnPlantLayer?.computeDrawnPlantPlacement("desert", key, null, {
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
      defaultKey: "goldenHour",
      getLayerSize,
      skyLayerEl,
      skyCycleState,
      skyBlend
    });
  };

  const plantSketch = (p) => {
    p.setup = function setup() {
      const { width, height } = getLayerSize(plantLayerEl);
      p.createCanvas(width, height).parent("plant-layer");
    };

    p.draw = function draw() {
      p.clear();
      window.drawAloePlant?.(p, {
        groundRatio: 0.985,
        clusterCount: 1,
        clusterWidthRatio: 0.48,
        spanStart: 0.05,
        spanEnd: 0.34,
        scale: 1.62,
        spikey: true,
        animateSpikes: true
      });
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(plantLayerEl);
      p.resizeCanvas(width, height);
    };
  };

  new p5(skySketch);
  new p5(plantSketch);
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
