// src/app/ScrollMemory.tsx
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollMemory() {
  const loc = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
  const lastKeyboardActivation = useRef(0);

  useEffect(() => {
    const interactiveSelector =
      'a[href], button, [role="button"], [role="link"], [role="menuitem"]';

    const onPointerDown = () => {
      lastKeyboardActivation.current = 0;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(interactiveSelector)) return;

      lastKeyboardActivation.current = Date.now();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

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
    const key = `fh61:scroll:${loc.pathname}${loc.search}`;
    const savedY = parseInt(sessionStorage.getItem(key) || "0", 10);
    const keyboardNavigation =
      navType !== "POP" && Date.now() - lastKeyboardActivation.current < 1500;
    const shouldRestore = navType === "POP" || keyboardNavigation;
    const targetY = shouldRestore && Number.isFinite(savedY) ? savedY : 0;

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
    lastKeyboardActivation.current = 0;

    return () => {
      cancelled = true;
      sessionStorage.setItem(key, String(window.scrollY));
      document.documentElement.classList.remove("scroll-restore-instant");
    };
  }, [loc.pathname, loc.search, navType]);

  useEffect(() => {
    const key = `fh61:scroll:${loc.pathname}${loc.search}`;
    // Gem løbende position for denne rute
    let ticking = false;
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          save();
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [loc.pathname, loc.search]);

  return null;
}
