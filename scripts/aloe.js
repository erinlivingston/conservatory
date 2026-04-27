/**
 * Desert aloe renderer for p5 scenes.
 * Usage: drawAloePlant(p, { width?: number, height?: number, groundRatio?: number })
 */
(function initAloeRenderer(globalObj) {
  function drawAloePlant(p, opts = {}) {
    const W = Number.isFinite(opts.width) ? opts.width : p.width;
    const H = Number.isFinite(opts.height) ? opts.height : p.height;
    const ground = H * (Number.isFinite(opts.groundRatio) ? opts.groundRatio : 0.88);
    const clusterCount = Math.max(1, Math.floor(opts.clusterCount || 1));
    const spanStart = Number.isFinite(opts.spanStart) ? opts.spanStart : 0;
    const spanEnd = Number.isFinite(opts.spanEnd) ? opts.spanEnd : 1;
    const clusterWidth = Number.isFinite(opts.clusterWidthRatio) ? opts.clusterWidthRatio : 1;

    const leaves = [
      { bx: 0.4, angle: -80, len: 0.58, thick: 0.052, curve: 0.1, tint: 0 },
      { bx: 0.48, angle: -94, len: 0.7, thick: 0.058, curve: -0.04, tint: 0 },
      { bx: 0.57, angle: -87, len: 0.52, thick: 0.048, curve: 0.11, tint: 1 },
      { bx: 0.36, angle: -72, len: 0.44, thick: 0.042, curve: 0.16, tint: 1 },
      { bx: 0.63, angle: -102, len: 0.46, thick: 0.044, curve: -0.13, tint: 1 },
      { bx: 0.44, angle: -108, len: 0.38, thick: 0.036, curve: -0.18, tint: 2 },
      { bx: 0.55, angle: -76, len: 0.42, thick: 0.038, curve: 0.14, tint: 2 },
      { bx: 0.3, angle: -64, len: 0.32, thick: 0.03, curve: 0.24, tint: 4 },
      { bx: 0.68, angle: -115, len: 0.34, thick: 0.032, curve: -0.22, tint: 3 },
      { bx: 0.43, angle: -91, len: 0.28, thick: 0.026, curve: -0.06, tint: 4 },
      { bx: 0.6, angle: -85, len: 0.3, thick: 0.028, curve: 0.12, tint: 3 }
    ];

    const tints = [
      [44, 105, 62],
      [54, 118, 72],
      [66, 130, 82],
      [80, 145, 94],
      [138, 182, 74]
    ];

    const stripeTints = [
      [68, 135, 84],
      [82, 148, 96],
      [98, 160, 108],
      [108, 172, 118],
      [168, 208, 100]
    ];

    function leafColor(tintIdx, alpha = 255) {
      const [r, g, b] = tints[tintIdx];
      return p.color(r, g, b, alpha);
    }

    function stripeColor(tintIdx, alpha = 255) {
      const [r, g, b] = stripeTints[tintIdx];
      return p.color(r, g, b, alpha);
    }

    function cubicBezier(p0, p1, p2, p3, t) {
      const mt = 1 - t;
      return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    }

    function getSpinePts(leaf, steps = 60) {
      const len = leaf.len * H;
      const rad = p.radians(leaf.angle);
      const bx = leaf.bx * W;
      const by = ground;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const crvX = leaf.curve * len;
      const droopAmt = len * 0.04;
      const tipX = bx + dx * len * 0.6 + crvX;
      const tipY = by + dy * len + droopAmt;
      const c1x = bx + dx * len * 0.28 + crvX * 0.2;
      const c1y = by + dy * len * 0.28 + droopAmt * 0.1;
      const c2x = bx + dx * len * 0.62 + crvX * 0.75;
      const c2y = by + dy * len * 0.68 + droopAmt * 0.65;
      const baseThick = leaf.thick * W;
      const pts = [];

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = cubicBezier(bx, c1x, c2x, tipX, t);
        const y = cubicBezier(by, c1y, c2y, tipY, t);
        const halfW = baseThick * 0.5 * Math.pow(1 - t, 0.55) * (t < 0.02 ? t / 0.02 : 1);
        let tx;
        let ty;

        if (i < steps) {
          const nt = (i + 1) / steps;
          tx = cubicBezier(bx, c1x, c2x, tipX, nt) - x;
          ty = cubicBezier(by, c1y, c2y, tipY, nt) - y;
        } else {
          const pt = (i - 1) / steps;
          tx = x - cubicBezier(bx, c1x, c2x, tipX, pt);
          ty = y - cubicBezier(by, c1y, c2y, tipY, pt);
        }

        const tlen = Math.sqrt(tx * tx + ty * ty) || 1;
        pts.push({ x, y, px: -ty / tlen, py: tx / tlen, halfW, t });
      }

      return { pts, tipX, tipY };
    }

    function drawLeaf(leaf) {
      const { pts, tipX, tipY } = getSpinePts(leaf);
      const baseThick = leaf.thick * W;

      p.noStroke();
      p.fill(leafColor(leaf.tint));
      p.beginShape();
      pts.forEach((pt) => p.vertex(pt.x + pt.px * pt.halfW, pt.y + pt.py * pt.halfW));
      p.vertex(tipX, tipY);
      for (let i = pts.length - 1; i >= 0; i -= 1) {
        const pt = pts[i];
        p.vertex(pt.x - pt.px * pt.halfW, pt.y - pt.py * pt.halfW);
      }
      p.endShape(p.CLOSE);

      p.noFill();
      p.strokeWeight(baseThick * 0.055);
      for (let s = 0; s < 2; s += 1) {
        const offset = ((s + 1) / 3) * 2 - 1;
        p.stroke(stripeColor(leaf.tint, 160));
        p.beginShape();
        pts.forEach((pt) => {
          if (pt.halfW > 0.5) {
            p.curveVertex(
              pt.x + pt.px * pt.halfW * offset * 0.55,
              pt.y + pt.py * pt.halfW * offset * 0.55
            );
          }
        });
        p.endShape();
      }

      p.fill(leafColor(Math.max(0, leaf.tint - 1), 230));
      p.noStroke();
      for (let i = 5; i < pts.length - 2; i += 5) {
        const pt = pts[i];
        const next = pts[Math.min(i + 2, pts.length - 1)];
        const spikeLen = pt.halfW * 0.58 * (1 - pt.t * 0.5);
        const spikeW = pt.halfW * 0.22;
        for (let s = -1; s <= 1; s += 2) {
          const ex = pt.x + s * pt.px * (pt.halfW + spikeLen);
          const ey = pt.y + s * pt.py * (pt.halfW + spikeLen);
          const bax = pt.x + s * pt.px * pt.halfW - next.px * spikeW * s * 0.5 + (next.x - pt.x) * 0.15;
          const bay = pt.y + s * pt.py * pt.halfW - next.py * spikeW * s * 0.5 + (next.y - pt.y) * 0.15;
          const bbx = pt.x + s * pt.px * pt.halfW + next.px * spikeW * s * 0.5 - (next.x - pt.x) * 0.15;
          const bby = pt.y + s * pt.py * pt.halfW + next.py * spikeW * s * 0.5 - (next.y - pt.y) * 0.15;
          p.beginShape();
          p.vertex(bax, bay);
          p.vertex(ex, ey);
          p.vertex(bbx, bby);
          p.endShape(p.CLOSE);
        }
      }

      p.stroke(leafColor(leaf.tint, 90));
      p.strokeWeight(baseThick * 0.06);
      p.noFill();
      p.beginShape();
      pts.forEach((pt) => p.curveVertex(pt.x, pt.y));
      p.endShape();

      p.stroke(255, 255, 255, 28);
      p.strokeWeight(baseThick * 0.18);
      p.noFill();
      p.beginShape();
      pts.forEach((pt) => p.curveVertex(pt.x + pt.px * pt.halfW * 0.3, pt.y + pt.py * pt.halfW * 0.3));
      p.endShape();
    }

    const order = [...leaves.keys()].sort((a, b) => leaves[b].len - leaves[a].len);
    const usableSpan = Math.max(0.001, spanEnd - spanStart);
    for (let c = 0; c < clusterCount; c += 1) {
      const center = spanStart + usableSpan * ((c + 0.5) / clusterCount);
      const adjustedLeaves = leaves.map((leaf) => ({
        ...leaf,
        bx: center + (leaf.bx - 0.5) * clusterWidth
      }));
      order.forEach((idx) => drawLeaf(adjustedLeaves[idx]));
    }
  }

  globalObj.drawAloePlant = drawAloePlant;
})(window);
