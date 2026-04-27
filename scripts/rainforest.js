/**
 * Rainforest room: same layer stack as Palm House.
 *
 * Fruiting L-system adapted from Eric Davidson’s generative-plants turtle
 * (https://github.com/erdavids/Portfolio/tree/master/generative-plants).
 *
 * Flower overlays are temporarily disabled while the jungle mist effect
 * is being tuned.
 */
(function initRainforest() {
  const skyLayerEl = document.getElementById("sky-layer");
  const plantLayerEl = document.getElementById("plant-layer");
  const greenhouseImg = document.getElementById("greenhouse-img");
  const sceneViewportEl = greenhouseImg?.closest(".scene-viewport");
  const greenhouseSelect = document.getElementById("greenhouse-asset");
  const skySelectEl = document.getElementById("sky-preset");
  const regenBtn = document.getElementById("regenerate-canopy");
  const iterationsEl = document.getElementById("ls-iterations");
  const ROOM_ASSET_BY_VIEW = {
    jungle: "assets/jungle.png",
    rainforest: "assets/jungle.png",
    "palm-house": "assets/palmhouse.png",
    palmhouse: "assets/palmhouse.png",
    desert: "assets/desert.png",
    aquatic: "assets/aquatic.png"
  };

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

  function setGreenhouseAsset(src) {
    if (!greenhouseImg) return;
    const currentSrc = greenhouseImg.getAttribute("src");
    if (currentSrc === src) {
      applyViewportAspectFromLoadedImage();
      return;
    }
    greenhouseImg.src = src;
  }

  function applyInitialViewFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const rawView = params.get("view");
    if (!rawView) return;
    const view = rawView.trim().toLowerCase();
    const src = ROOM_ASSET_BY_VIEW[view];
    if (!src) return;
    if (greenhouseSelect) greenhouseSelect.value = src;
    setGreenhouseAsset(src);
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
  applyInitialViewFromQuery();

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

  function defaultLsOpts(minDim) {
    const baseLen = minDim * 0.11;
    return {
      axiom: "F",
      iterations: 5,
      length: baseLen,
      lengthChange: 0.5,
      lengthDrift: 0.05,
      angle: 25,
      angleDrift: 5,
      lineColor: [34, 52, 38],
      lineWidth: 1.2,
      lineOpacity: 150,
      opacityDrift: 50,
      fruit: [200, 140, 100],
      redDrift: 20,
      greenDrift: 20,
      blueDrift: 20,
      rule0a: "F",
      rule0b: "Go[-F]S[+G+F*][+F]S[-G-F*]",
      rule1a: "G",
      rule1b: "G[+F]G[-F]S"
    };
  }

  function buildRules(opts) {
    return [
      { a: opts.rule0a, b: opts.rule0b },
      { a: opts.rule1a, b: opts.rule1b }
    ];
  }

  function applyRulesOnce(sentence, rules) {
    let next = "";
    for (let i = 0; i < sentence.length; i += 1) {
      const c = sentence.charAt(i);
      let found = false;
      for (let j = 0; j < rules.length; j += 1) {
        if (c === rules[j].a) {
          next += rules[j].b;
          found = true;
          break;
        }
      }
      if (!found) next += c;
    }
    return next;
  }

  function buildLSystem(p, opts, rules) {
    let sentence = opts.axiom;
    let len = opts.length;
    const iters = p.constrain(opts.iterations, 1, 8);
    for (let iter = 0; iter < iters; iter += 1) {
      len *= opts.lengthChange + p.random(-opts.lengthDrift, opts.lengthDrift);
      sentence = applyRulesOnce(sentence, rules);
    }
    return { sentence, len };
  }

  function turtleFruitingTree(p, opts, sentence, segLen, ox, oy, seed) {
    let ang;
    let circleCalls = 0;
    p.randomSeed(seed + 50_003);
    p.push();
    p.translate(ox, oy);
    p.rotate(p.random(-0.45, 0.45));
    p.strokeWeight(opts.lineWidth);

    for (let i = 0; i < sentence.length; i += 1) {
      const current = sentence.charAt(i);
      if (current === "F" || current === "G") {
        p.stroke(
          opts.lineColor[0],
          opts.lineColor[1],
          opts.lineColor[2],
          p.constrain(
            opts.lineOpacity + p.random(-opts.opacityDrift, opts.opacityDrift),
            40,
            255
          )
        );
        p.line(0, 0, 0, -segLen);
        p.translate(0, -segLen);
      } else if (current === "+") {
        ang = p.radians(p.random(opts.angle - opts.angleDrift, opts.angle + opts.angleDrift));
        p.rotate(ang);
      } else if (current === "-") {
        ang = p.radians(p.random(opts.angle - opts.angleDrift, opts.angle + opts.angleDrift));
        p.rotate(-ang);
      } else if (current === "[") {
        p.push();
      } else if (current === "]") {
        p.pop();
      } else if (current === "S") {
        p.translate(0, -segLen / 4);
      } else if (current === "*") {
        p.noFill();
        circleCalls += 1;
        if (circleCalls > 28 && p.random(1) < 0.42) {
          p.noStroke();
          p.fill(
            opts.fruit[0] + p.random(-opts.redDrift, opts.redDrift),
            opts.fruit[1] + p.random(-opts.greenDrift, opts.greenDrift),
            opts.fruit[2] + p.random(-opts.blueDrift, opts.blueDrift),
            220
          );
          p.circle(0, 0, p.random(3, 11));
          p.noFill();
        }
      }
    }
    p.pop();
  }

  const plantSketch = (p) => {
    let treeSeeds = [12041, 88302, 55120];
    let treeCache = null;

    function readIterations() {
      const v = Number(iterationsEl?.value);
      if (!Number.isFinite(v)) return 5;
      return p.constrain(Math.round(v), 3, 7);
    }

    function invalidateTreeCache() {
      treeCache = null;
    }

    function regenerateCanopy() {
      treeSeeds = [
        p.floor(p.random(10_000, 99_999)),
        p.floor(p.random(10_000, 99_999)),
        p.floor(p.random(10_000, 99_999))
      ];
      invalidateTreeCache();
    }

    p.setup = function setup() {
      const { width, height } = getLayerSize(plantLayerEl);
      p.createCanvas(width, height).parent("plant-layer");
    };

    p.draw = function draw() {
      p.clear();
      const minDim = p.min(p.width, p.height);
      const opts = defaultLsOpts(minDim);
      opts.iterations = readIterations();
      const rules = buildRules(opts);

      const bases = [
        { x: p.width * 0.22, y: p.height + minDim * 0.04 },
        { x: p.width * 0.52, y: p.height + minDim * 0.02 },
        { x: p.width * 0.78, y: p.height + minDim * 0.05 }
      ];

      if (!treeCache) {
        treeCache = bases.map((_, idx) => {
          p.randomSeed(treeSeeds[idx]);
          return buildLSystem(p, opts, rules);
        });
      }

      bases.forEach((base, idx) => {
        const { sentence, len } = treeCache[idx];
        turtleFruitingTree(p, opts, sentence, len, base.x, base.y, treeSeeds[idx]);
      });

    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(plantLayerEl);
      p.resizeCanvas(width, height);
      invalidateTreeCache();
    };

    p.regenerateCanopy = regenerateCanopy;
    p.invalidateTreeCache = invalidateTreeCache;
  };

  new p5(skySketch);
  const plantInstance = new p5(plantSketch);

  skySelectEl?.addEventListener("change", (e) => {
    currentSkyPresetKey = e.target.value;
  });

  greenhouseSelect?.addEventListener("change", (e) => {
    setGreenhouseAsset(e.target.value);
  });

  regenBtn?.addEventListener("click", () => {
    plantInstance.regenerateCanopy?.();
  });

  function invalidateOnIterations() {
    plantInstance.invalidateTreeCache?.();
  }

  iterationsEl?.addEventListener("input", invalidateOnIterations);
  iterationsEl?.addEventListener("change", invalidateOnIterations);
})();

