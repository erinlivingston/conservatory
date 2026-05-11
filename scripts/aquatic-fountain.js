/**
 * Small p5 fountain for the aquatic room — transparent canvas, drops, bubbles, ripples, mist.
 * Mounts to #fountain-layer (below #plant-layer so drawn plants + lily pads stay on top).
 */
(function registerAquaticFountain(global) {
  function initAquaticFountain(layerId) {
    const container = document.getElementById(layerId);
    if (!container) return;

    const sketch = (p) => {
      let drops = [];
      let bubbles = [];
      let ripples = [];
      /** Layout derived from reference art (~460×320); recomputed on resize. */
      let layout = { CX: 200, POOL_Y: 200, POOL_W: 200, POOL_H: 30 };

      function computeLayout() {
        const w = p.width;
        const h = p.height;
        const refW = 460;
        const refH = 320;
        layout.CX = (340 / refW) * w;
        /* Slightly higher so the jet reads against the pool / window */
        layout.POOL_Y = (268 / refH) * h;
        layout.POOL_W = (260 / refW) * w;
        layout.POOL_H = (38 / refH) * h;
      }

      class Drop {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = layout.CX + p.random(-8, 8);
          this.y = layout.POOL_Y - p.random(95, Math.min(240, p.height * 0.58));
          this.vx = p.random(-1.2, 1.2);
          this.vy = p.random(-3.5, -1.5);
          this.r = p.random(2, 4);
          this.alpha = 220;
        }
        update() {
          this.vy += 0.18;
          this.x += this.vx;
          this.y += this.vy;
          if (this.y >= layout.POOL_Y) {
            ripples.push(new Ripple(this.x, layout.POOL_Y));
            this.reset();
          }
        }
        draw() {
          p.noStroke();
          p.fill(160, 210, 220, this.alpha);
          p.ellipse(this.x, this.y, this.r * 0.8, this.r * 1.4);
        }
      }

      class Bubble {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = layout.CX + p.random(-layout.POOL_W * 0.35, layout.POOL_W * 0.35);
          this.y = layout.POOL_Y + p.random(4, layout.POOL_H - 6);
          this.r = p.random(2, 5);
          this.vy = p.random(-0.3, -0.08);
          this.life = 1.0;
        }
        update() {
          this.x += p.sin(p.frameCount * 0.05 + this.y) * 0.3;
          this.y += this.vy;
          this.life -= 0.012;
          if (this.life <= 0 || this.y < layout.POOL_Y - 2) this.reset();
        }
        draw() {
          p.noFill();
          p.stroke(180, 225, 230, this.life * 160);
          p.strokeWeight(0.8);
          p.ellipse(this.x, this.y, this.r * 2, this.r * 2);
        }
      }

      class Ripple {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.r = 2;
          this.life = 1.0;
        }
        update() {
          this.r += 1.4;
          this.life -= 0.035;
        }
        draw() {
          p.noFill();
          p.stroke(160, 210, 220, this.life * 120);
          p.strokeWeight(0.8);
          p.ellipse(this.x, this.y, this.r * 2, this.r * 0.45 * 2);
        }
        dead() {
          return this.life <= 0;
        }
      }

      function refillActors() {
        drops.length = 0;
        bubbles.length = 0;
        ripples.length = 0;
        for (let i = 0; i < 22; i += 1) drops.push(new Drop());
        for (let j = 0; j < 18; j += 1) bubbles.push(new Bubble());
      }

      p.setup = function setup() {
        const rect = container.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        p.createCanvas(w, h).parent(container);
        const cnv = p.canvas;
        if (cnv) {
          cnv.style.position = "absolute";
          cnv.style.top = "0";
          cnv.style.left = "0";
        }
        p.colorMode(p.RGB);
        p.frameRate(40);
        computeLayout();
        refillActors();
      };

      function drawWaterJetLines() {
        const jetBase = layout.POOL_Y - 1;
        const jetReach = p.min(layout.POOL_Y * 0.52, p.height * 0.38);
        const jetTop = jetBase - jetReach;
        p.noFill();
        for (let i = 0; i < 7; i += 1) {
          const ox = (i - 3) * 1.85;
          const x = layout.CX + ox;
          const distFromCenter = Math.abs(i - 3) / 3;
          const alpha = p.lerp(175, 95, distFromCenter);
          p.stroke(175, 228, 236, alpha);
          p.strokeWeight(i === 3 ? 1.35 : 0.75);
          p.line(x, jetBase, x, jetTop);
        }
      }

      p.draw = function draw() {
        p.clear();
        ripples = ripples.filter((r) => !r.dead());
        for (let i = 0; i < ripples.length; i += 1) {
          ripples[i].update();
          ripples[i].draw();
        }
        for (let j = 0; j < bubbles.length; j += 1) {
          bubbles[j].update();
          bubbles[j].draw();
        }
        drawWaterJetLines();
        for (let k = 0; k < drops.length; k += 1) {
          drops[k].update();
          drops[k].draw();
        }
        for (let m = 0; m < 5; m += 1) {
          const mx = layout.CX + p.random(-18, 18);
          const my = layout.POOL_Y + p.random(-8, 4);
          p.noStroke();
          p.fill(180, 220, 225, p.random(8, 22));
          p.ellipse(mx, my, p.random(10, 24), p.random(5, 12));
        }
      };

      p.windowResized = function windowResized() {
        const rect = container.getBoundingClientRect();
        const nw = Math.max(1, Math.floor(rect.width));
        const nh = Math.max(1, Math.floor(rect.height));
        p.resizeCanvas(nw, nh);
        computeLayout();
        refillActors();
      };
    };

    new p5(sketch);
  }

  global.initAquaticFountain = initAquaticFountain;
})(window);
