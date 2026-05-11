(function initRainforest() {
  const skyLayerEl = document.getElementById("sky-layer");
  const plantLayerEl = document.getElementById("plant-layer");
  const greenhouseImg = document.getElementById("greenhouse-img");
  const sceneViewportEl = greenhouseImg?.closest(".scene-viewport");
  const addPlantButtonEl = document.getElementById("add-plant");
  const assetRadioEls = () => document.querySelectorAll('input[name="plant-asset"]');
  const ROOM_STORAGE_ID = "rainforest";

  const drawnAssetBase = "assets/drawnplantassets/";
  const drawnAssetFiles = {
    monstera: "monstera.png",
    birdofparadise: "birdofparadise.png",
    pothos: "pothos.png",
    curlyjungle: "curlyjungle.png"
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

  const skyPresets = {
    brightDay: {
      horizon: ["#E6F7FF", "#D9F0FC", "#CBE8F8"],
      mid: ["#BCDFF4", "#A8D0EC", "#95C2E4"],
      zenith: ["#80BFEC", "#6FAFDD"],
      layers: [
        { color: "#FCFFFF", opacity: 0.44, speed: 0.2, scale: 1.2, y: 0.62 },
        { color: "#FCFFFF", opacity: 0.34, speed: 0.1, scale: 1.6, y: 0.5 },
        { color: "#FFFCED", opacity: 0.25, speed: 0.05, scale: 2, y: 0.38 },
        { color: "#FFFCED", opacity: 0.16, speed: 0.03, scale: 2.6, y: 0.25 }
      ]
    },
    goldenHour: {
      horizon: ["#FFDFAD", "#FFD39A", "#FFC78A"],
      mid: ["#F9BB7D", "#F1AF78", "#EA9E70"],
      zenith: ["#F3B478", "#DF9F67"],
      layers: [
        { color: "#FFF5E0", opacity: 0.42, speed: 0.18, scale: 1.2, y: 0.62 },
        { color: "#FFF5E0", opacity: 0.31, speed: 0.09, scale: 1.6, y: 0.5 },
        { color: "#FFDBB0", opacity: 0.23, speed: 0.05, scale: 2, y: 0.38 },
        { color: "#FFDBB0", opacity: 0.16, speed: 0.03, scale: 2.6, y: 0.25 }
      ]
    },
    overcast: {
      horizon: ["#D2DCE1", "#C7D3D9", "#BDC9D0"],
      mid: ["#B2C0C8", "#A7B8C1", "#9CAFB9"],
      zenith: ["#96AAB6", "#889DAA"],
      layers: [
        { color: "#F2F6F9", opacity: 0.5, speed: 0.22, scale: 1.3, y: 0.65 },
        { color: "#F2F6F9", opacity: 0.4, speed: 0.11, scale: 1.8, y: 0.5 },
        { color: "#E6ECF0", opacity: 0.31, speed: 0.06, scale: 2.2, y: 0.35 },
        { color: "#E6ECF0", opacity: 0.22, speed: 0.03, scale: 2.8, y: 0.2 }
      ]
    },
    stormy: {
      horizon: ["#6C788A", "#647183", "#5D697B"],
      mid: ["#556172", "#4E5968", "#46515F"],
      zenith: ["#3C4A5B", "#344152"],
      layers: [
        { color: "#C7D5E0", opacity: 0.46, speed: 0.55, scale: 1.1, y: 0.7 },
        { color: "#C7D5E0", opacity: 0.36, speed: 0.32, scale: 1.5, y: 0.55 },
        { color: "#71808F", opacity: 0.29, speed: 0.18, scale: 2, y: 0.38 },
        { color: "#71808F", opacity: 0.23, speed: 0.08, scale: 2.5, y: 0.22 }
      ]
    },
    softDusk: {
      horizon: ["#FEDBD6", "#FBD2CF", "#F7C8C8"],
      mid: ["#F0BCC3", "#E9B4C0", "#E2ACBD"],
      zenith: ["#D6ACC6", "#C89FBA"],
      layers: [
        { color: "#FFF3F6", opacity: 0.43, speed: 0.14, scale: 1.3, y: 0.65 },
        { color: "#FFF3F6", opacity: 0.32, speed: 0.07, scale: 1.7, y: 0.5 },
        { color: "#FFD6DE", opacity: 0.24, speed: 0.04, scale: 2.2, y: 0.36 },
        { color: "#FFD6DE", opacity: 0.16, speed: 0.02, scale: 2.8, y: 0.22 }
      ]
    },
    rainforestMist: {
      horizon: ["#D2E4DC", "#C9DDD5", "#C0D6CF"],
      mid: ["#B6CEC6", "#AAC6BF", "#9EBFB9"],
      zenith: ["#78A8A8", "#6A9999"],
      layers: [
        { color: "#ECF8F2", opacity: 0.44, speed: 0.2, scale: 1.3, y: 0.67 },
        { color: "#ECF8F2", opacity: 0.34, speed: 0.11, scale: 1.9, y: 0.52 },
        { color: "#B4D2C6", opacity: 0.26, speed: 0.06, scale: 2.3, y: 0.38 },
        { color: "#B4D2C6", opacity: 0.18, speed: 0.03, scale: 2.8, y: 0.22 }
      ]
    }
  };

  const skyCycle = ["brightDay", "stormy", "brightDay", "rainforestMist", "softDusk", "overcast"];
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
    return "monstera";
  }

  function getSelectedAssetSrc() {
    const key = getSelectedAssetKey();
    const file = drawnAssetFiles[key];
    return file ? `${drawnAssetBase}${file}` : `${drawnAssetBase}monstera.png`;
  }

  function renderPlacedDrawnPlants() {
    window.drawnPlantLayer?.renderPlacedDrawnPlants(plantLayerEl, placedDrawnPlants);
    window.conservatoryEyeSpy?.syncConservatoryEyeSpyVisitor(plantLayerEl, ROOM_STORAGE_ID);
  }

  function addDrawnPlantsToRoom() {
    const key = getSelectedAssetKey();
    const src = getSelectedAssetSrc();
    const pos = window.drawnPlantLayer?.computeDrawnPlantPlacement("rainforest", key, null, {
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
  if (greenhouseImg?.complete) {
    applyViewportAspectFromLoadedImage();
  }

  const skySketch = (p) => {
    let cloudLayersFrom = [];
    let cloudLayersTo = [];

    function presetFor(key) {
      return skyPresets[key] || skyPresets.rainforestMist;
    }

    function buildCloudLayersForKey(key) {
      const preset = presetFor(key);
      return preset.layers.map((layer, i) => ({
        ...layer,
        blobs: Array.from({ length: 5 + i * 2 }, () => ({
          x: p.random(p.width),
          bw: p.random(80, 200) * layer.scale,
          bh: p.random(18, 44) * layer.scale,
          wobble: p.random(1000)
        }))
      }));
    }

    function gradHex(colors, t) {
      const seg = (colors.length - 1) * t;
      const i = Math.floor(seg);
      const f = seg - i;
      const c1 = p.color(colors[Math.min(i, colors.length - 1)]);
      const c2 = p.color(colors[Math.min(i + 1, colors.length - 1)]);
      return p.lerpColor(c1, c2, f);
    }

    function drawSkyGradBlended(keyA, keyB, blendT) {
      const pa = presetFor(keyA);
      const pb = presetFor(keyB);
      const colorsA = [...pa.horizon, ...pa.mid, ...pa.zenith];
      const colorsB = [...pb.horizon, ...pb.mid, ...pb.zenith];
      for (let y = 0; y < p.height; y += 1) {
        const ty = y / p.height;
        const cA = gradHex(colorsA, ty);
        const cB = gradHex(colorsB, ty);
        p.stroke(p.lerpColor(cA, cB, blendT));
        p.line(0, y, p.width, y);
      }
    }

    function drawCloudShape(cx, cy, bw, bh, seed) {
      const numPuffs = 5 + Math.round(bw / 60);
      for (let k = 0; k < numPuffs; k += 1) {
        const kf = k / (numPuffs - 1);
        const px = cx + (kf - 0.5) * bw;
        const arch = p.sin(kf * p.PI) * bh * 0.7;
        const pr = bh * (0.5 + p.sin(kf * p.PI) * 0.5) * (0.8 + 0.2 * p.sin(seed + k));
        p.ellipse(px, cy - arch * 0.3, pr * 2.2, pr * 1.6);
      }
      p.ellipse(cx, cy + bh * 0.18, bw * 0.82, bh * 0.55);
    }

    function advanceCloudLayer(layer) {
      layer.blobs.forEach((blob) => {
        blob.x -= layer.speed;
        if (blob.x + blob.bw * 0.5 < -10) blob.x = p.width + blob.bw * 0.5;
      });
    }

    function drawCloudLayer(layer, alphaMul) {
      const t = p.millis() * 0.001;
      layer.blobs.forEach((blob) => {
        const wobbleY = p.sin(t * 0.4 + blob.wobble) * 3;
        const cy = layer.y * p.height + wobbleY;
        p.noStroke();
        const cloudColor = p.color(layer.color);
        cloudColor.setAlpha(layer.opacity * 255 * alphaMul);
        p.fill(cloudColor);
        for (let xi = -1; xi <= 1; xi += 1) {
          drawCloudShape(blob.x + xi * p.width, cy, blob.bw, blob.bh, t + blob.wobble);
        }
      });
    }

    function rebuildBothCloudSets() {
      cloudLayersFrom = buildCloudLayersForKey(skyBlend.blendFromKey);
      cloudLayersTo = buildCloudLayersForKey(skyBlend.blendToKey);
    }

    p.setup = function setup() {
      const { width, height } = getLayerSize(skyLayerEl);
      const canvas = p.createCanvas(width, height);
      canvas.parent("sky-layer");
      rebuildBothCloudSets();
    };

    p.draw = function draw() {
      const blendApi = window.skyCycleBlend;
      const synced = blendApi.syncSkyBlend(skyCycleState, skyBlend);
      if (synced) {
        rebuildBothCloudSets();
      }
      const blendT = blendApi.getBlendT(skyBlend);
      const crossBlending = skyBlend.blendFromKey !== skyBlend.blendToKey && blendT < 1;

      drawSkyGradBlended(skyBlend.blendFromKey, skyBlend.blendToKey, blendT);

      if (crossBlending) {
        cloudLayersFrom.forEach(advanceCloudLayer);
        cloudLayersTo.forEach(advanceCloudLayer);
        cloudLayersFrom.forEach((layer) => drawCloudLayer(layer, 1 - blendT));
        cloudLayersTo.forEach((layer) => drawCloudLayer(layer, blendT));
      } else {
        cloudLayersTo.forEach(advanceCloudLayer);
        cloudLayersTo.forEach((layer) => drawCloudLayer(layer, 1));
      }
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.resizeCanvas(width, height);
      rebuildBothCloudSets();
    };
  };

  new p5(skySketch);
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

