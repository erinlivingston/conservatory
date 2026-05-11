/**
 * Entrance footer: every file in drawnplantassets in a fixed order, left to right with overlap;
 * repeats the full sequence to span the viewport (measured after one cycle loads).
 */
(function initEntrancePlantStrip() {
  const strip = document.querySelector(".entrance-plant-strip");
  if (!strip) return;

  const BASE = "assets/drawnplantassets/";
  const FILES = [
    "birdofparadise.png",
    "curlyjungle.png",
    "curlyshorttree.png",
    "desertbloom.png",
    "fern.png",
    "genericdesertplant.png",
    "lotusflower.png",
    "monstera.png",
    "pothos.png",
    "shortcactus.png",
    "spikeypalm.png",
    "swirlygrass.png",
    "tallcactus.png",
    "tallleaves.png",
    "tallpalm.png",
    "waterpoppy.png"
  ];

  function appendCycle() {
    for (let i = 0; i < FILES.length; i += 1) {
      const img = document.createElement("img");
      img.src = BASE + FILES[i];
      img.alt = "";
      img.className = "entrance-plant-strip__plant";
      img.decoding = "async";
      strip.appendChild(img);
    }
  }

  function waitImagesLoaded(root, cb) {
    const imgs = root.querySelectorAll("img");
    if (!imgs.length) {
      cb();
      return;
    }
    let pending = imgs.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) cb();
    };
    imgs.forEach((img) => {
      if (img.complete) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
  }

  function refillStrip() {
    strip.replaceChildren();
    appendCycle();
    waitImagesLoaded(strip, () => {
      window.requestAnimationFrame(() => {
        const cycleW = strip.scrollWidth;
        const target = Math.max(window.innerWidth, 320) * 1.12;
        if (!cycleW || cycleW <= 0) return;
        const extra = Math.min(7, Math.max(0, Math.ceil(target / cycleW) - 1));
        for (let c = 0; c < extra; c += 1) appendCycle();
      });
    });
  }

  let resizeT = null;
  window.addEventListener("resize", () => {
    if (resizeT) window.clearTimeout(resizeT);
    resizeT = window.setTimeout(refillStrip, 180);
  });

  refillStrip();
})();
