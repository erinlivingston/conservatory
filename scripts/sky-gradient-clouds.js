/**
 * Shared p5 sky: vertical gradient from preset.colors + drifting cloud layers from preset.layers.
 * Used by desert and aquatic rooms; palm/rainforest use horizon/mid/zenith instead.
 */
(function skyGradientCloudsApi() {
  /**
   * @param {object} p p5 instance
   * @param {object} ctx
   * @param {Record<string, { colors: string[], layers: Array<{color:string,opacity:number,speed:number,scale:number,y:number}> }>} ctx.skyPresets
   * @param {string} ctx.defaultKey
   * @param {() => { width: number, height: number }} ctx.getLayerSize
   * @param {HTMLElement | null} ctx.skyLayerEl
   * @param {object} ctx.skyCycleState
   * @param {object} ctx.skyBlend
   */
  function createSkySketch(p, ctx) {
    const { skyPresets, defaultKey, getLayerSize, skyLayerEl, skyCycleState, skyBlend } = ctx;
    let cloudLayersFrom = [];
    let cloudLayersTo = [];

    function presetFor(key) {
      return skyPresets[key] || skyPresets[defaultKey];
    }

    function buildCloudLayersForKey(key) {
      const preset = presetFor(key);
      const layers = preset.layers || [];
      return layers.map((layer, i) => ({
        ...layer,
        blobs: Array.from({ length: 5 + i * 2 }, () => ({
          x: p.random(p.width),
          bw: p.random(80, 200) * layer.scale,
          bh: p.random(18, 44) * layer.scale,
          wobble: p.random(1000)
        }))
      }));
    }

    function rowColor(colors, ty) {
      const seg = (colors.length - 1) * ty;
      const i = Math.floor(seg);
      const f = seg - i;
      const c1 = p.color(colors[Math.min(i, colors.length - 1)]);
      const c2 = p.color(colors[Math.min(i + 1, colors.length - 1)]);
      return p.lerpColor(c1, c2, f);
    }

    function drawGradientBlended(keyA, keyB, blendT) {
      const pa = presetFor(keyA);
      const pb = presetFor(keyB);
      for (let y = 0; y < p.height; y += 1) {
        const ty = y / p.height;
        const cA = rowColor(pa.colors, ty);
        const cB = rowColor(pb.colors, ty);
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
      p.createCanvas(width, height).parent(skyLayerEl);
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

      drawGradientBlended(skyBlend.blendFromKey, skyBlend.blendToKey, blendT);

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
  }

  window.createGradientCloudSkySketch = createSkySketch;
})();
