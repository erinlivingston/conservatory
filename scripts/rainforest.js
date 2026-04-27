(function initRainforest() {
  const skyLayerEl = document.getElementById("sky-layer");
  const greenhouseImg = document.getElementById("greenhouse-img");
  const sceneViewportEl = greenhouseImg?.closest(".scene-viewport");
  const skySelectEl = document.getElementById("sky-preset");

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

  let currentSkyPresetKey = skySelectEl?.value || "rainforestMist";

  greenhouseImg?.addEventListener("load", applyViewportAspectFromLoadedImage);
  if (greenhouseImg?.complete) {
    applyViewportAspectFromLoadedImage();
  }

  const skySketch = (p) => {
    let activeSkyPreset = skyPresets[currentSkyPresetKey] || skyPresets.rainforestMist;
    let cloudLayers = [];
    let lastSkyPresetKey = currentSkyPresetKey;

    function rebuildCloudLayers() {
      activeSkyPreset = skyPresets[currentSkyPresetKey] || skyPresets.rainforestMist;
      cloudLayers = activeSkyPreset.layers.map((layer, i) => ({
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

    function drawSkyGrad() {
      const allColors = [...activeSkyPreset.horizon, ...activeSkyPreset.mid, ...activeSkyPreset.zenith];
      for (let y = 0; y < p.height; y += 1) {
        p.stroke(gradHex(allColors, y / p.height));
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

    function drawCloudLayer(layer) {
      const t = p.millis() * 0.001;
      layer.blobs.forEach((blob) => {
        blob.x -= layer.speed;
        if (blob.x + blob.bw * 0.5 < -10) blob.x = p.width + blob.bw * 0.5;
        const wobbleY = p.sin(t * 0.4 + blob.wobble) * 3;
        const cy = layer.y * p.height + wobbleY;
        p.noStroke();
        const cloudColor = p.color(layer.color);
        cloudColor.setAlpha(layer.opacity * 255);
        p.fill(cloudColor);
        for (let xi = -1; xi <= 1; xi += 1) {
          drawCloudShape(blob.x + xi * p.width, cy, blob.bw, blob.bh, t + blob.wobble);
        }
      });
    }

    p.setup = function setup() {
      const { width, height } = getLayerSize(skyLayerEl);
      const canvas = p.createCanvas(width, height);
      canvas.parent("sky-layer");
      rebuildCloudLayers();
    };

    p.draw = function draw() {
      if (lastSkyPresetKey !== currentSkyPresetKey) {
        lastSkyPresetKey = currentSkyPresetKey;
        rebuildCloudLayers();
      }
      drawSkyGrad();
      cloudLayers.forEach(drawCloudLayer);
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.resizeCanvas(width, height);
      rebuildCloudLayers();
    };
  };

  new p5(skySketch);
  if (typeof window.initRainforestPlants === "function") {
    window.initRainforestPlants("plant-layer");
  }

  skySelectEl?.addEventListener("change", (e) => {
    currentSkyPresetKey = e.target.value;
  });
})();

