(function initDesertRoom() {
  const skyLayerEl = document.getElementById("sky-layer");
  const plantLayerEl = document.getElementById("plant-layer");
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
      colors: ["#E8F4FF", "#DDEEFF", "#D0E8FE", "#BADAF6", "#A3C9EA", "#8AB8DD"]
    },
    goldenHour: {
      colors: ["#FFE5BA", "#FFD6A2", "#FFC88D", "#F8AF72", "#E99766", "#D8855E"]
    },
    overcast: {
      colors: ["#D8DFE8", "#CBD4DE", "#BEC9D4", "#AEBCCC", "#9EAFBF", "#8D9FB2"]
    },
    stormy: {
      colors: ["#7A8798", "#6F7D8F", "#637286", "#56657A", "#48586D", "#3D4E63"]
    },
    softDusk: {
      colors: ["#FFE0D4", "#FDD3CA", "#FBC7C2", "#E8B5BD", "#D3A6B9", "#C49AB5"]
    }
  };

  let currentSkyPresetKey = skySelectEl?.value || "goldenHour";
  greenhouseImg?.addEventListener("load", applyViewportAspectFromLoadedImage);
  if (greenhouseImg?.complete) applyViewportAspectFromLoadedImage();

  const skySketch = (p) => {
    p.setup = function setup() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.createCanvas(width, height).parent("sky-layer");
    };

    p.draw = function draw() {
      const preset = skyPresets[currentSkyPresetKey] || skyPresets.goldenHour;
      for (let y = 0; y < p.height; y += 1) {
        const seg = (preset.colors.length - 1) * (y / p.height);
        const i = Math.floor(seg);
        const f = seg - i;
        const c1 = p.color(preset.colors[Math.min(i, preset.colors.length - 1)]);
        const c2 = p.color(preset.colors[Math.min(i + 1, preset.colors.length - 1)]);
        p.stroke(p.lerpColor(c1, c2, f));
        p.line(0, y, p.width, y);
      }
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.resizeCanvas(width, height);
    };
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
        clusterCount: 4,
        clusterWidthRatio: 0.2,
        spanStart: 0.06,
        spanEnd: 0.94
      });
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(plantLayerEl);
      p.resizeCanvas(width, height);
    };
  };

  new p5(skySketch);
  new p5(plantSketch);

  skySelectEl?.addEventListener("change", (e) => {
    currentSkyPresetKey = e.target.value;
  });
})();
