/**
 * Simple aquatic plant strokes (optional helper for other scenes).
 */
(function registerAquaticPlantHelper(globalObj) {
  function drawAquaticPlants(p) {
    p.clear();
  }

  globalObj.drawAquaticPlants = drawAquaticPlants;
})(window);


// aquatic-plants.js — lily pads with p5.js
// Usage: initAquaticPlants('your-container-id')
// Requires p5.js to be loaded before this script

function initAquaticPlants(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  new p5(function(p) {
    const W = container.offsetWidth || 660;
    const H = Math.round(W * 0.92);

    // Lily pads: x, y center as fraction of canvas; r radius / W; rot, gap (notch) in rad
    const pads = [
      { x: 0.12, y: 0.78, r: 0.048, rot: 0.5, gap: 1.05 },
      { x: 0.22, y: 0.86, r: 0.042, rot: 2.2, gap: 0.95 },
      { x: 0.30, y: 0.74, r: 0.055, rot: 1.1, gap: 1.1 },
      { x: 0.38, y: 0.84, r: 0.046, rot: 3.4, gap: 1.0 },
      { x: 0.44, y: 0.76, r: 0.078, rot: 0.4, gap: 1.2 },
      { x: 0.54, y: 0.80, r: 0.062, rot: 2.8, gap: 0.9 },
      { x: 0.48, y: 0.84, r: 0.052, rot: 1.8, gap: 1.0 },
      { x: 0.58, y: 0.74, r: 0.068, rot: 4.1, gap: 1.1 },
      { x: 0.50, y: 0.88, r: 0.044, rot: 0.7, gap: 0.85 },
      { x: 0.42, y: 0.82, r: 0.056, rot: 3.3, gap: 1.05 },
      { x: 0.62, y: 0.86, r: 0.050, rot: 5.0, gap: 0.95 },
      { x: 0.38, y: 0.78, r: 0.045, rot: 2.1, gap: 1.15 },
      { x: 0.56, y: 0.90, r: 0.038, rot: 1.2, gap: 0.8 },
      { x: 0.46, y: 0.72, r: 0.060, rot: 3.8, gap: 1.0 },
      { x: 0.65, y: 0.79, r: 0.042, rot: 0.2, gap: 0.9 },
      { x: 0.72, y: 0.85, r: 0.040, rot: 4.5, gap: 0.92 },
      { x: 0.82, y: 0.77, r: 0.052, rot: 1.6, gap: 1.08 },
      { x: 0.88, y: 0.88, r: 0.038, rot: 2.9, gap: 0.88 },
      { x: 0.08, y: 0.90, r: 0.036, rot: 0.9, gap: 0.9 },
    ];

    const padPhase = pads.map((_, i) => i * 0.91);

    // Perspective skew: compresses y and pulls x inward to simulate top-down view
    function skewPt(x, y, cx, cy) {
      const yScale = 0.38;
      const xPull = 0.18;
      const dy = y - cy;
      const dx = x - cx;
      return {
        x: cx + dx * (1 - xPull * Math.abs(dy / (W * 0.1))),
        y: cy + dy * yScale
      };
    }

    function drawLilyPad(pad, idx) {
      const t = p.frameCount * 0.016;
      const drift = Math.sin(t + padPhase[idx]) * (W * 0.004);
      const cx = pad.x * W;
      const cy = pad.y * H + drift;
      const r = pad.r * W;
      const gap = pad.gap;
      const rot = pad.rot + Math.sin(t * 0.8 + padPhase[idx] * 0.5) * 0.045;
      const steps = 52;

      function skewedPts(radiusScale) {
        const pts = [];
        for (let i = 0; i <= steps; i += 1) {
          const a = rot + gap / 2 + (i / steps) * (p.TWO_PI - gap);
          const rx = cx + Math.cos(a) * r * radiusScale;
          const ry = cy + Math.sin(a) * r * radiusScale;
          const s = skewPt(rx, ry, cx, cy);
          pts.push(s);
        }
        return pts;
      }

      const outerPts = skewedPts(1.0);

      p.noStroke();
      p.fill(46, 116, 62, 240);
      p.beginShape();
      p.vertex(cx, cy);
      outerPts.forEach((pt) => p.vertex(pt.x, pt.y));
      p.endShape(p.CLOSE);

      p.noFill();
      p.stroke(34, 90, 48, 205);
      p.strokeWeight(r * 0.034);
      p.beginShape();
      outerPts.forEach((pt) => p.vertex(pt.x, pt.y));
      p.endShape();

      p.stroke(66, 136, 74, 150);
      p.strokeWeight(r * 0.019);
      const veinCount = 8;
      for (let v = 0; v < veinCount; v += 1) {
        const a = rot + gap / 2 + ((v + 0.5) / veinCount) * (p.TWO_PI - gap);
        const es = skewPt(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, cx, cy);
        p.line(cx, cy, es.x, es.y);
      }

      const midA = rot + gap / 2 + (p.TWO_PI - gap) / 2;
      const spineEnd = skewPt(cx + Math.cos(midA) * r * 0.94, cy + Math.sin(midA) * r * 0.94, cx, cy);
      p.stroke(72, 146, 78, 165);
      p.strokeWeight(r * 0.026);
      p.line(cx, cy, spineEnd.x, spineEnd.y);

      p.noStroke();
      p.fill(62, 132, 74, 215);
      const lipA = rot;
      const lipW = r * 0.16;
      const lipH = r * 0.055;
      p.push();
      const lipS = skewPt(cx + Math.cos(lipA) * r * 0.05, cy + Math.sin(lipA) * r * 0.05, cx, cy);
      p.translate(lipS.x, lipS.y);
      p.rotate(lipA + Math.atan2(Math.sin(lipA) * 0.38, Math.cos(lipA)));
      p.rect(-lipW * 0.5, -lipH * 0.5, lipW, lipH, lipH * 0.4);
      p.pop();
      p.noStroke();
    }

    p.setup = function setup() {
      const cnv = p.createCanvas(W, H);
      cnv.parent(containerId);
      p.pixelDensity(1);
    };

    p.draw = function draw() {
      p.clear();
      pads.forEach((pad, idx) => drawLilyPad(pad, idx));
    };
  });
}
