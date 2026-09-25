// src/app/ScrollMemory.tsx
import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SCROLL_MEMORY_PREFIX = "fh61:scroll:";
const SCROLL_MEMORY_TTL_MS = 30 * 60 * 1000;

function memoryKey(pathname: string, search: string) {
  return `${SCROLL_MEMORY_PREFIX}${pathname}${search}`;
}

function readSavedScroll(key: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      !saved ||
      typeof saved !== "object" ||
      Date.now() - Number(saved.updatedAtMs || 0) > SCROLL_MEMORY_TTL_MS
    ) {
      sessionStorage.removeItem(key);
      return 0;
    }
    return Math.max(0, Number(saved.y || 0));
  } catch {
    sessionStorage.removeItem(key);
    return 0;
  }
}

function saveScroll(key: string) {
  sessionStorage.setItem(
    key,
    JSON.stringify({ y: Math.max(0, window.scrollY), updatedAtMs: Date.now() })
  );
}

export default function ScrollMemory() {
  const loc = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"

  // Lad os selv styre scroll-restore
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("scrollRestoration" in window.history)
    )
      return;
    const prev = window.history.scrollRestoration as ScrollRestoration; // 'auto' | 'manual'
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* no-op */
    }
    return () => {
      try {
        window.history.scrollRestoration = prev; // <- ingen string-cast
      } catch {
        /* no-op */
      }
    };
  }, []);

  useLayoutEffect(() => {
    const key = memoryKey(loc.pathname, loc.search);
    if (loc.hash) return;

    const shouldRestore = navType === "POP";
    const targetY = shouldRestore ? readSavedScroll(key) : 0;

    const restoreInstantly = () => {
      document.documentElement.classList.add("scroll-restore-instant");
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    };

    restoreInstantly();

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = shouldRestore ? 12 : 2;

    const tick = () => {
      if (cancelled) return;
      attempts += 1;
      restoreInstantly();

      if (attempts < maxAttempts) {
        window.setTimeout(tick, 50);
      } else {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("scroll-restore-instant");
        });
      }
    };

    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      saveScroll(key);
      document.documentElement.classList.remove("scroll-restore-instant");
    };
  }, [loc.hash, loc.pathname, loc.search, navType]);

  useEffect(() => {
    const key = memoryKey(loc.pathname, loc.search);
    let ticking = false;
    const onPageHide = () => saveScroll(key);
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          saveScroll(key);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      saveScroll(key);
    };
  }, [loc.pathname, loc.search]);

  return null;
}
