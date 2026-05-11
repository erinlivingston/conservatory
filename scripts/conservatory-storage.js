/**
 * Persist user-placed drawn plants per room, eye-spy visitor placements + find progress,
 * and "Done" tour progress. Stored in localStorage.
 */
(function registerConservatoryStorage(global) {
  const STORAGE_KEY = "conservatory.bundle.v1";

  /** @type {{ id: string, page: string, label: string }[]} */
  const ROOM_FLOW = [
    { id: "palmhouse", page: "palm-house.html", label: "Palm House" },
    { id: "rainforest", page: "rainforest.html", label: "Rainforest" },
    { id: "desert", page: "desert.html", label: "Desert" },
    { id: "aquatic", page: "aquatic.html", label: "Aquatic" }
  ];

  const ROOM_IDS = ROOM_FLOW.map((r) => r.id);

  function normalizeEyeSpy(raw) {
    const eye = raw && typeof raw === "object" ? raw : {};
    const found = eye.found && typeof eye.found === "object" ? eye.found : {};
    return {
      released: !!eye.released,
      placements: eye.placements && typeof eye.placements === "object" ? eye.placements : {},
      found: { ...found }
    };
  }

  function emptyBundle() {
    return { rooms: {}, finishedRoomIds: [], eyeSpy: normalizeEyeSpy(null) };
  }

  function readBundle() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyBundle();
      const o = JSON.parse(raw);
      return {
        rooms: o.rooms && typeof o.rooms === "object" ? o.rooms : {},
        finishedRoomIds: Array.isArray(o.finishedRoomIds) ? o.finishedRoomIds : [],
        eyeSpy: normalizeEyeSpy(o.eyeSpy)
      };
    } catch {
      return emptyBundle();
    }
  }

  function writeBundle(bundle) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  }

  function zIndexForPlant(p, fallbackIndex) {
    const order = p.stackOrder ?? fallbackIndex;
    return 10 + order * 150 + Math.round((p.depth ?? 0) * 90);
  }

  /**
   * Random placements per room (small sprites, tucked in foliage). Clears find progress.
   */
  function releaseEyeSpyVisitors() {
    const b = readBundle();
    const placements = {};
    for (let r = 0; r < ROOM_IDS.length; r += 1) {
      const roomId = ROOM_IDS[r];
      const plants = Array.isArray(b.rooms[roomId]) ? b.rooms[roomId] : [];
      let minZ = 200;
      let maxZ = 320;
      if (plants.length) {
        const zs = plants.map((p, i) => zIndexForPlant(p, i));
        minZ = Math.min(...zs);
        maxZ = Math.max(...zs);
      }
      let zIndex = minZ + Math.floor(Math.random() * Math.max(1, maxZ - minZ + 1));
      if (Math.random() < 0.55 && maxZ > minZ) {
        const mid = Math.floor((minZ + maxZ) / 2);
        zIndex = minZ + Math.floor(Math.random() * Math.max(1, mid - minZ + 1));
      }
      const anchorRoll = Math.random();
      let anchor = "center";
      let x = 20 + Math.random() * 60;
      let y = 52 + Math.random() * 36;
      let bottomOffsetPct = 0;
      if (anchorRoll < 0.18) {
        anchor = "bottomGrass";
        y = 0;
        x = Math.random() < 0.5 ? 4 + Math.random() * 22 : 74 + Math.random() * 22;
        bottomOffsetPct = Math.random() * 6;
      } else if (anchorRoll < 0.42) {
        anchor = "ground";
        y = 60 + Math.random() * 30;
        x = 18 + Math.random() * 64;
      } else if (Math.random() < 0.28) {
        x = Math.random() < 0.5 ? 8 + Math.random() * 18 : 74 + Math.random() * 18;
        y = 55 + Math.random() * 32;
      }
      placements[roomId] = {
        x,
        y,
        anchor,
        bottomOffsetPct,
        scalePct: 2.8 + Math.random() * 3.2,
        rotate: -45 + Math.random() * 90,
        flipX: Math.random() < 0.5,
        zIndex
      };
    }
    b.eyeSpy = { released: true, placements, found: {} };
    writeBundle(b);
  }

  function clearEyeSpyVisitors() {
    const b = readBundle();
    b.eyeSpy = { released: false, placements: {}, found: {} };
    writeBundle(b);
  }

  /** @returns {{ released: boolean, placements: object, found: object }} */
  function getEyeSpyState() {
    const b = readBundle();
    const e = normalizeEyeSpy(b.eyeSpy);
    return { released: e.released, placements: e.placements, found: e.found };
  }

  function pageForRoomId(roomId) {
    const row = ROOM_FLOW.find((r) => r.id === roomId);
    return row ? row.page : "palm-house.html";
  }

  function allRoomsFound(found) {
    return ROOM_IDS.every((id) => found[id]);
  }

  /**
   * User tapped the visitor in this room: advance hunt or finish.
   * @param {string} roomId
   */
  function handleEyeSpyAnimalClick(roomId) {
    const b = readBundle();
    if (!b.eyeSpy?.released || !b.eyeSpy.placements?.[roomId]) return;

    const found = { ...(b.eyeSpy.found || {}) };
    if (found[roomId]) return;

    found[roomId] = true;
    b.eyeSpy = { ...normalizeEyeSpy(b.eyeSpy), found };
    writeBundle(b);

    if (allRoomsFound(found)) {
      global.setTimeout(() => completeEyeSpyHuntDialog(), 80);
      return;
    }

    const startIdx = ROOM_IDS.indexOf(roomId);
    for (let i = 1; i <= 4; i += 1) {
      const nextId = ROOM_IDS[(startIdx + i) % 4];
      if (!found[nextId]) {
        global.location.href = pageForRoomId(nextId);
        return;
      }
    }
  }

  function completeEyeSpyHuntDialog() {
    global.alert("You found all four visitors!");
    if (
      global.confirm(
        "Hide them again in new spots? Your saved rooms and plants stay the same — the hunt starts over in Palm House."
      )
    ) {
      releaseEyeSpyVisitors();
      global.location.href = "palm-house.html";
      return;
    }
    if (
      global.confirm(
        "Reset the whole conservatory (all rooms, plants, and tour progress) and return to the entrance?"
      )
    ) {
      clearAllAndReset();
      global.location.href = "index.html";
      return;
    }
    global.location.href = "gallery.html";
  }

  /**
   * @param {string} roomId
   * @param {Array<object>} plants — plain serializable objects (same shape as placedDrawnPlants)
   */
  function saveRoomPlants(roomId, plants) {
    const b = readBundle();
    b.rooms[roomId] = plants.map((p) => ({ ...p }));
    writeBundle(b);
  }

  /** Mark this room as finished in the tour. Idempotent. */
  function markRoomFinished(roomId) {
    const b = readBundle();
    if (!b.finishedRoomIds.includes(roomId)) b.finishedRoomIds.push(roomId);
    writeBundle(b);
  }

  /** @returns {Array<object>|null} */
  function loadRoomPlants(roomId) {
    const b = readBundle();
    const arr = b.rooms[roomId];
    if (!Array.isArray(arr)) return null;
    return arr.map((p) => ({ ...p }));
  }

  function getNextRoomPage(currentRoomId) {
    const i = ROOM_FLOW.findIndex((r) => r.id === currentRoomId);
    if (i === -1) return "palm-house.html";
    if (i >= ROOM_FLOW.length - 1) return "gallery.html";
    return ROOM_FLOW[i + 1].page;
  }

  function allFourRoomsMarkedDone() {
    const b = readBundle();
    return ROOM_IDS.every((id) => b.finishedRoomIds.includes(id));
  }

  function getFinishedCount() {
    return readBundle().finishedRoomIds.length;
  }

  /** Clear saved rooms, eye spy, and tour flags (same browser only). */
  function clearAllAndReset() {
    global.localStorage.removeItem(STORAGE_KEY);
  }

  global.conservatoryStorage = {
    STORAGE_KEY,
    ROOM_FLOW,
    ROOM_IDS,
    readBundle,
    writeBundle,
    saveRoomPlants,
    markRoomFinished,
    loadRoomPlants,
    getNextRoomPage,
    allFourRoomsMarkedDone,
    getFinishedCount,
    clearAllAndReset,
    releaseEyeSpyVisitors,
    clearEyeSpyVisitors,
    getEyeSpyState,
    handleEyeSpyAnimalClick
  };
})(window);
