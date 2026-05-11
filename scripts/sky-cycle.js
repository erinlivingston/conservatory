/**
 * Shared sky day-cycle + smooth preset blending for biome rooms.
 * The room tick updates cycleTargetKey; p5 draw() calls syncSkyBlend() then getBlendT().
 */
(function skyCycleApi() {
  const BLEND_MS = 9000;

  function smoothstep(u) {
    const t = Math.min(1, Math.max(0, u));
    return t * t * (3 - 2 * t);
  }

  /**
   * When the cycle target preset changes, start a cross-blend from the last shown preset.
   * @returns {boolean} true if a new blend started (rebuild cloud / gradient sources).
   */
  function syncSkyBlend(state, blend) {
    if (state.cycleTargetKey !== blend.blendToKey) {
      blend.blendFromKey = blend.blendToKey;
      blend.blendToKey = state.cycleTargetKey;
      blend.blendStartMs = Date.now();
      return true;
    }
    return false;
  }

  /** Smoothstep blend factor 0..1 between blendFromKey and blendToKey. */
  function getBlendT(blend) {
    if (blend.blendStartMs == null) return 1;
    const u = (Date.now() - blend.blendStartMs) / BLEND_MS;
    if (u >= 1) {
      blend.blendStartMs = null;
      blend.blendFromKey = blend.blendToKey;
      return 1;
    }
    return smoothstep(u);
  }

  window.skyCycleBlend = {
    BLEND_MS,
    smoothstep,
    syncSkyBlend,
    getBlendT
  };
})();
