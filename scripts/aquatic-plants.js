/**
 * Aquatic lily pads — HSB cluster layout, depth-sorted, notch + veins.
 * Usage: initAquaticPlants('plant-layer')
 */
function initAquaticPlants(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  new p5((p) => {
    let pads = [];
    let t = 0;

    function buildPads() {
      pads = [];
      const W = p.width;
      const H = p.height;

      const clusters = [
        { cx: W * 0.22 },
        { cx: W * 0.55 },
        { cx: W * 0.82 },
      ];

      const rows = [
        { yFrac: 0.79, sizeMin: 32, sizeMax: 44, depth: 0.38, spread: 0.16 },
        { yFrac: 0.86, sizeMin: 38, sizeMax: 52, depth: 0.62, spread: 0.18 },
        { yFrac: 0.93, sizeMin: 44, sizeMax: 58, depth: 0.85, spread: 0.20 },
      ];

      for (const cl of clusters) {
        for (const row of rows) {
          const count = row.yFrac > 0.85 ? 4 : 3;
          for (let i = 0; i < count; i++) {
            const x = cl.cx + p.random(-W * row.spread, W * row.spread);
            const y = row.yFrac * H + p.random(-5, 5);
            const size = p.random(row.sizeMin, row.sizeMax);
            pads.push(new LilyPad(x, y, size, row.depth));
          }
        }
      }

      for (let i = 0; i < 10; i++) {
        const depthR = p.random();
        const x = p.random(W * 0.05, W * 0.95);
        const y = p.map(depthR, 0, 1, H * 0.79, H * 0.96);
        const size = p.map(depthR, 0, 1, 30, 52);
        pads.push(new LilyPad(x, y, size, depthR));
      }

      pads.sort((a, b) => a.baseY - b.baseY);
    }

    class LilyPad {
      constructor(x, y, size, depth) {
        this.x = x;
        this.baseX = x;
        this.y = y;
        this.baseY = y;
        this.size = size;
        this.depth = depth;
        this.notchAngle = p.random(p.TWO_PI);
        this.wobbleOffset = p.random(100);
        this.wobbleSpeed = p.random(0.008, 0.018);
      }

      update(tick) {
        this.y = this.baseY + p.sin(tick * this.wobbleSpeed * 60 + this.wobbleOffset) * (3 + this.depth * 5);
        this.x = this.baseX + p.sin(tick * this.wobbleSpeed * 40 + this.wobbleOffset) * (1 + this.depth * 2);
      }

      draw() {
        const squish = p.map(this.depth, 0, 1, 0.22, 0.42);
        const w = this.size;

        // shadow
        p.noStroke();
        p.fill(15, 30, 25, 55);
        p.ellipse(this.x + 2, this.y + 3, w * 0.9, w * squish * 0.7);

        // pad color
        const hue  = p.map(this.depth, 0, 1, 132, 142);
        const sat  = p.map(this.depth, 0, 1, 58, 72);
        const bri  = p.map(this.depth, 0, 1, 28, 42);
        const briHi = p.map(this.depth, 0, 1, 38, 52);

        // main body with notch
        p.fill(hue, sat, bri, 230);
        p.beginShape();
        const steps = 38;
        for (let i = 0; i < steps; i++) {
          const a = (p.TWO_PI / steps) * i;
          const notchDiff = p.abs(((a - this.notchAngle + p.PI * 3) % p.TWO_PI) - p.PI);
          if (notchDiff < 0.26) continue;
          const r = w * 0.5 * (1 + p.sin(a * 7 + this.wobbleOffset) * 0.018);
          p.vertex(this.x + p.cos(a) * r, this.y + p.sin(a) * r * squish);
        }
        p.endShape(p.CLOSE);

        // highlight
        p.fill(hue, sat - 15, briHi, 90);
        p.ellipse(this.x - w * 0.07, this.y - w * squish * 0.12, w * 0.5, w * squish * 0.35);

        // veins
        p.stroke(hue, sat, bri - 8, 75);
        p.strokeWeight(0.5);
        for (let v = 0; v < 7; v++) {
          const va = this.notchAngle + p.map(v, 0, 6, 0.4, p.TWO_PI - 0.4);
          p.line(this.x, this.y, this.x + p.cos(va) * w * 0.43, this.y + p.sin(va) * w * 0.43 * squish);
        }
        p.noStroke();
      }
    }

    p.setup = function () {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      p.createCanvas(w, h).parent(containerId);
      p.pixelDensity(1);
      p.colorMode(p.HSB, 360, 100, 100, 255);
      p.frameRate(30);
      p.noStroke();
      buildPads();
    };

    p.draw = function () {
      p.clear();
      t += 0.016;
      for (const pad of pads) {
        pad.update(t);
        pad.draw();
      }
    };

    p.windowResized = function () {
      const rect = container.getBoundingClientRect();
      const nw = Math.max(1, Math.floor(rect.width));
      const nh = Math.max(1, Math.floor(rect.height));
      p.resizeCanvas(nw, nh);
      buildPads();
    };
  });
}

window.initAquaticPlants = initAquaticPlants;
