/**
 * Rainforest plant effect factory (fruiting L-system canopy).
 */
(function initRainforestPlants(globalObj) {
  function createRainforestPlantSketch(getLayerSize, plantLayerEl, options = {}) {
    return function rainforestPlantSketch(p) {
      let treeSeeds = [12041, 88302, 55120];
      let treeCache = null;
      const iterations = Number.isFinite(options.iterations) ? options.iterations : 5;

      function defaultLsOpts(minDim) {
        const baseLen = minDim * 0.11;
        return {
          axiom: "F",
          iterations,
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

      function buildLSystem(opts, rules) {
        let sentence = opts.axiom;
        let len = opts.length;
        const iters = p.constrain(opts.iterations, 1, 8);
        for (let iter = 0; iter < iters; iter += 1) {
          len *= opts.lengthChange + p.random(-opts.lengthDrift, opts.lengthDrift);
          sentence = applyRulesOnce(sentence, rules);
        }
        return { sentence, len };
      }

      function turtleFruitingTree(opts, sentence, segLen, ox, oy, seed) {
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
              p.circle(0, 0, p.random(3, 20));
              p.noFill();
            }
          }
        }
        p.pop();
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
        const rules = buildRules(opts);
        const bases = [
          { x: p.width * 0.22, y: p.height + minDim * 0.04 },
          { x: p.width * 0.52, y: p.height + minDim * 0.02 },
          { x: p.width * 0.78, y: p.height + minDim * 0.05 }
        ];

        if (!treeCache) {
          treeCache = bases.map((_, idx) => {
            p.randomSeed(treeSeeds[idx]);
            return buildLSystem(opts, rules);
          });
        }

        bases.forEach((base, idx) => {
          const { sentence, len } = treeCache[idx];
          turtleFruitingTree(opts, sentence, len, base.x, base.y, treeSeeds[idx]);
        });
      };

      p.windowResized = function windowResized() {
        const { width, height } = getLayerSize(plantLayerEl);
        p.resizeCanvas(width, height);
        invalidateTreeCache();
      };

      p.regenerateCanopy = regenerateCanopy;
    };
  }

  globalObj.createRainforestPlantSketch = createRainforestPlantSketch;
})(window);


// rainforest-plants.js — generative pothos vining plant with p5.js
// Usage: initRainforestPlants('your-container-id')
// Requires p5.js to be loaded before this script

function initRainforestPlants(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  new p5(function(p) {
    const W = container.offsetWidth || 660;
    const H = Math.round(W * 1.0);

    // Smaller foliage vs greenhouse; stems scale with this too.
    const PLANT_SCALE = 0.55;
    const VINE_COUNT = 25;

    // Vines: Catmull-Rom spline [x,y] in 0–1 canvas space; anchors spread across the top.
    function buildCanopyVines() {
      const out = [];
      for (let i = 0; i < VINE_COUNT; i += 1) {
        const u = VINE_COUNT <= 1 ? 0.5 : i / (VINE_COUNT - 1);
        const xTop = 0.02 + u * 0.96;
        const dir = i % 2 === 0 ? 1 : -1;
        const wander = 0.11 + (i % 5) * 0.018;
        const segCount = 11;
        const pts = [];
        for (let s = 0; s <= segCount; s += 1) {
          const fy = 0.018 + (s / segCount) * 0.945;
          const progress = s / segCount;
          const sway =
            dir * Math.sin(progress * Math.PI * 1.45 + i * 0.65) * wander * progress;
          const xDrift = Math.sin(i * 1.27 + progress * 4.4) * 0.072 * progress;
          const x = Math.min(0.98, Math.max(0.02, xTop + sway + xDrift));
          pts.push([x, fy]);
        }
        const leafN = 7 + (i % 4);
        const leafT = Array.from({ length: leafN }, (_, j) => 0.06 + ((j + 0.5) / leafN) * 0.88);
        const leafSide = leafT.map((_, j) => (j % 2 === 0 ? 1 : -1));
        const baseSz = (0.038 + (i % 4) * 0.0035) * PLANT_SCALE;
        const leafSize = leafT.map((_, j) => baseSz + (j % 3) * 0.0028 * PLANT_SCALE);
        out.push({
          pts,
          leafSide,
          leafSize,
          leafT,
          tint: i % 3
        });
      }
      return out;
    }

    const vines = buildCanopyVines();

    // Body fill colors [r, g, b] per tint index
    const BODY = [
      [52,  112, 64],   // 0 — deep green
      [62,  126, 72],   // 1 — mid green
      [88,  148, 72],   // 2 — yellow-green variegated
    ];

    // Vein colors per tint index
    const VEIN = [
      [82,  150, 90],
      [96,  162, 100],
      [130, 178, 90],
    ];

    const STEM_C = [72, 108, 54];
    const vinePhase = vines.map((_, i) => i * 0.77);

    // Catmull-Rom spline point evaluation
    function catmullPt(pts, t) {
      const n     = pts.length;
      const total = n - 1;
      const seg   = Math.min(Math.floor(t * total), total - 1);
      const lt    = (t * total) - seg;
      const p0 = pts[Math.max(seg-1, 0)];
      const p1 = pts[seg];
      const p2 = pts[Math.min(seg+1, n-1)];
      const p3 = pts[Math.min(seg+2, n-1)];
      const t2 = lt*lt, t3 = lt*lt*lt;
      return {
        x: 0.5*((2*p1[0])+(-p0[0]+p2[0])*lt+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        y: 0.5*((2*p1[1])+(-p0[1]+p2[1])*lt+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      };
    }

    // Tangent direction along the spline
    function catmullTangent(pts, t) {
      const eps = 0.002;
      const a   = catmullPt(pts, Math.max(t - eps, 0));
      const b   = catmullPt(pts, Math.min(t + eps, 1));
      const dx  = b.x - a.x;
      const dy  = b.y - a.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      return { tx: dx/len, ty: dy/len };
    }

    function makeAnimatedPt(rawPts, vineIdx) {
      const swayPhase = vinePhase[vineIdx];
      const swayAmp = W * 0.005 * (0.85 + PLANT_SCALE * 0.2);
      return function animatedPt(tPos) {
        const t = p.frameCount * 0.018;
        const pos = catmullPt(rawPts, tPos);
        const weight = Math.pow(tPos, 1.12);
        const wobble = Math.sin(t * 1.2 + swayPhase + tPos * 6.4) * swayAmp * weight;
        return { x: pos.x + wobble, y: pos.y };
      };
    }

    function drawHeartLeaf(cx, cy, size, angle, tint, pulse = 0) {
      const s        = size * W;
      const [r,g,b]  = BODY[tint];
      const [vr,vg,vb] = VEIN[tint];

      p.push();
      p.translate(cx, cy);
      p.rotate(angle);

      // Heart shape: two bezier lobes meeting at bottom tip
      p.noStroke();
      p.fill(r, g, b, 248);
      p.beginShape();
      p.vertex(0, s * 0.52);
      // Left lobe
      p.bezierVertex(
        -s * 0.90,  s * 0.20,
        -s * 0.95, -s * 0.40,
        -s * 0.38, -s * 0.52
      );
      // Top center dip
      p.bezierVertex(
        -s * 0.10, -s * 0.62,
         s * 0.10, -s * 0.62,
         s * 0.38, -s * 0.52
      );
      // Right lobe back to tip
      p.bezierVertex(
         s * 0.95, -s * 0.40,
         s * 0.90,  s * 0.20,
         0,         s * 0.52
      );
      p.endShape(p.CLOSE);

      // Dark inner wedge for a cleaner graphic feel
      p.fill(r - 16, g - 18, b - 12, 90);
      p.beginShape();
      p.vertex(0, s * 0.52);
      p.bezierVertex(-s*0.88, s*0.18, -s*0.92, -s*0.38, -s*0.36, -s*0.50);
      p.bezierVertex(-s*0.12, -s*0.60, 0, -s*0.58, 0, -s*0.30);
      p.bezierVertex(-s*0.10, s*0.10, -s*0.20, s*0.32, 0, s*0.52);
      p.endShape(p.CLOSE);

      // Center vein
      p.stroke(vr, vg, vb, 190);
      p.strokeWeight(s * 0.034);
      p.noFill();
      p.line(0, -s*0.46, 0, s*0.50);

      // Side veins — 3 pairs branching from center
      p.strokeWeight(s * 0.016);
      const veinPairs = [
        { t: 0.15, angle: 38 },
        { t: 0.40, angle: 44 },
        { t: 0.65, angle: 50 },
      ];
      veinPairs.forEach(v => {
        const vy   = -s*0.46 + (s*0.96) * v.t;
        const vlen = s * (0.36 - v.t * 0.08);
        const va   = p.radians(v.angle);
        p.line(0, vy,  Math.sin(va)*vlen, vy + Math.cos(va)*vlen * 0.5);
        p.line(0, vy, -Math.sin(va)*vlen, vy + Math.cos(va)*vlen * 0.5);
      });

      // Surface sheen
      p.stroke(255, 255, 255, 32 + pulse * 4);
      p.strokeWeight(s * 0.10);
      p.noFill();
      p.beginShape();
      p.vertex(s*0.12, -s*0.34);
      p.bezierVertex(s*0.42, -s*0.14, s*0.48, s*0.06, s*0.20, s*0.22);
      p.endShape();

      // Outer edge line helps reduce blurry appearance.
      p.noFill();
      p.stroke(r - 24, g - 28, b - 20, 205);
      p.strokeWeight(Math.max(0.6, s * 0.028));
      p.beginShape();
      p.vertex(0, s * 0.52);
      p.bezierVertex(-s * 0.90,  s * 0.20, -s * 0.95, -s * 0.40, -s * 0.38, -s * 0.52);
      p.bezierVertex(-s * 0.10, -s * 0.62, s * 0.10, -s * 0.62, s * 0.38, -s * 0.52);
      p.bezierVertex(s * 0.95, -s * 0.40, s * 0.90, s * 0.20, 0, s * 0.52);
      p.endShape();

      p.pop();
    }

    function drawVine(vine, vineIdx, rawPts, animatedPt) {
      const steps = 112;
      const [sr, sg, sb] = STEM_C;
      const t = p.frameCount * 0.018;
      const swayPhase = vinePhase[vineIdx];
      const stemW = W * (0.0044 * PLANT_SCALE + 0.0024);
      const stemHiW = W * (0.0019 * PLANT_SCALE + 0.001);

      // Stem
      p.noFill();
      p.stroke(sr - 8, sg - 10, sb - 6, 240);
      p.strokeWeight(stemW);
      p.beginShape();
      for (let i = 0; i <= steps; i += 1) {
        const pos = animatedPt(i / steps);
        p.curveVertex(pos.x, pos.y);
      }
      p.endShape();

      p.stroke(sr + 26, sg + 28, sb + 20, 135);
      p.strokeWeight(stemHiW);
      p.beginShape();
      for (let i = 0; i <= steps; i += 1) {
        const pos = animatedPt(i / steps);
        p.curveVertex(pos.x - W * 0.0016, pos.y);
      }
      p.endShape();
      p.noStroke();

      vine.leafT.forEach((lt, i) => {
        const pos = animatedPt(lt);
        const tan = catmullTangent(rawPts, lt);
        const side = vine.leafSide[i];
        const sz = vine.leafSize[i];
        const pulse = Math.sin(t * 1.5 + swayPhase + i * 0.6);

        const petioleLen = sz * W * (0.26 + 0.02 * pulse);
        const perpX = -tan.ty * side;
        const perpY = tan.tx * side;
        const px = pos.x + perpX * petioleLen;
        const py = pos.y + perpY * petioleLen;

        p.stroke(STEM_C[0] - 4, STEM_C[1] - 6, STEM_C[2] - 4, 220);
        p.strokeWeight(W * (0.0022 * PLANT_SCALE + 0.001));
        p.line(pos.x, pos.y, px, py);
        p.noStroke();

        const leafAngle =
          Math.atan2(perpY, perpX) + Math.PI / 2 + side * (0.12 + 0.06 * pulse);
        drawHeartLeaf(px, py, sz * (0.98 + 0.02 * pulse), leafAngle, vine.tint, pulse);
      });
    }

    function drawNodes(vine, vineIdx, animatedPt) {
      const t = p.frameCount * 0.018;
      vine.leafT.forEach((lt) => {
        const pos = animatedPt(lt);
        const drift = Math.sin(t * 1.1 + vinePhase[vineIdx] + lt * 6) * W * 0.0012;
        p.noStroke();
        p.fill(STEM_C[0] - 8, STEM_C[1] - 8, STEM_C[2] - 6, 220);
        p.circle(pos.x + drift, pos.y, W * (0.0055 * PLANT_SCALE + 0.003));
      });
    }

    p.setup = function() {
      const cnv = p.createCanvas(W, H);
      cnv.parent(containerId);
      p.pixelDensity(1);
    };

    p.draw = function draw() {
      p.clear();
      vines.forEach((vine, idx) => {
        const rawPts = vine.pts.map((pt) => [pt[0] * W, pt[1] * H]);
        const animatedPt = makeAnimatedPt(rawPts, idx);
        drawVine(vine, idx, rawPts, animatedPt);
        drawNodes(vine, idx, animatedPt);
      });
    };
  });
}