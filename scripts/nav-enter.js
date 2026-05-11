/**
 * Bottom nav "Enter" chip: resets saved conservatory data and returns to the entrance.
 * Requires conservatory-storage.js (room + gallery pages).
 */
(function initNavEnter() {
  document.querySelectorAll(".room-nav-enter").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (!window.conservatoryStorage) {
        window.location.href = "index.html";
        return;
      }
      const ok = window.confirm(
        "Reset all saved rooms, snapshots, and tour progress in this browser and return to the entrance?"
      );
      if (!ok) return;
      window.conservatoryStorage.clearAllAndReset();
      window.location.href = "index.html";
    });
  });
})();
