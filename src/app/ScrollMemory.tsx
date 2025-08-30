import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remembers scrollY per route and restores it on reload / back / forward.
 * - Uses sessionStorage (tab-scoped). Switch to localStorage below if you
 *   want cross-session persistence.
 * - Skips restoring when there’s a hash (#anchor) so the anchor wins.
 */
export default function ScrollMemory() {
  const loc = useLocation();

  useEffect(() => {
    const key = `fh61:scroll:${loc.pathname}${loc.search}`;

    // ---- restore (once, after layout has settled a bit)
    if (!loc.hash) {
      const raw = sessionStorage.getItem(key); // change to localStorage if desired
      const saved = raw ? parseInt(raw, 10) : 0;

      if (saved > 0) {
        let attempts = 0;
        const maxAttempts = 20; // ~1s total
        const delay = 50;

        const imagesReady = () =>
          Array.from(document.images).every((img) => img.complete);

        const tryRestore = () => {
          attempts += 1;
          if (document.readyState === "complete" && imagesReady()) {
            window.scrollTo({ top: saved, left: 0, behavior: "auto" });
            return;
          }
          if (attempts < maxAttempts) {
            window.setTimeout(tryRestore, delay);
          } else {
            // best effort fallback
            window.scrollTo({ top: saved, left: 0, behavior: "auto" });
          }
        };

        // Start after a tick to let initial render paint
        requestAnimationFrame(tryRestore);
      }
    }

    // ---- persist on scroll (throttled via rAF) and on unload
    let ticking = false;
    const save = () => {
      sessionStorage.setItem(key, String(window.scrollY)); // or localStorage
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          save();
          ticking = false;
        });
      }
    };
    const onBeforeUnload = () => save();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onBeforeUnload);

    // Also save when leaving this route
    return () => {
      save();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [loc.pathname, loc.search, loc.hash]);

  return null;
}
