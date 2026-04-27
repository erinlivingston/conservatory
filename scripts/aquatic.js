(function initAquaticRoom() {
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
    aquaticBlue: ["#D7EEF7", "#C7E5F4", "#A8D9EE", "#86C8E5", "#6CB9D8", "#56ABC8"],
    brightDay: ["#E8F4FF", "#DDEEFF", "#D0E8FE", "#BCDDF8", "#A9D1F0", "#96C2E8"],
    softDusk: ["#F7DFE8", "#EECFE1", "#E4C3DE", "#D5B7D9", "#C5AACC", "#B29DC0"]
  };

  let currentSkyPresetKey = skySelectEl?.value || "aquaticBlue";
  greenhouseImg?.addEventListener("load", applyViewportAspectFromLoadedImage);
  if (greenhouseImg?.complete) applyViewportAspectFromLoadedImage();

  const skySketch = (p) => {
    p.setup = function setup() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.createCanvas(width, height).parent("sky-layer");
    };

    p.draw = function draw() {
      const colors = skyPresets[currentSkyPresetKey] || skyPresets.aquaticBlue;
      for (let y = 0; y < p.height; y += 1) {
        const seg = (colors.length - 1) * (y / p.height);
        const i = Math.floor(seg);
        const f = seg - i;
        const c1 = p.color(colors[Math.min(i, colors.length - 1)]);
        const c2 = p.color(colors[Math.min(i + 1, colors.length - 1)]);
        p.stroke(p.lerpColor(c1, c2, f));
        p.line(0, y, p.width, y);
      }
    };

    p.windowResized = function windowResized() {
      const { width, height } = getLayerSize(skyLayerEl);
      p.resizeCanvas(width, height);
    };
  };

  new p5(skySketch);
  if (typeof window.initAquaticPlants === "function" && plantLayerEl) {
    window.initAquaticPlants("plant-layer");
  }

  skySelectEl?.addEventListener("change", (e) => {
    currentSkyPresetKey = e.target.value;
  });
})();
