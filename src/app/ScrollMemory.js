// src/components/ScrollMemory.tsx
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
export default function ScrollMemory() {
    const loc = useLocation();
    const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
    // Lad os selv styre scroll-restore
    useEffect(() => {
        if (typeof window === "undefined" ||
            !("scrollRestoration" in window.history))
            return;
        const prev = window.history.scrollRestoration; // 'auto' | 'manual'
        try {
            window.history.scrollRestoration = "manual";
        }
        catch {
            /* no-op */
        }
        return () => {
            try {
                window.history.scrollRestoration = prev; // <- ingen string-cast
            }
            catch {
                /* no-op */
            }
        };
    }, []);
    useEffect(() => {
        const key = `fh61:scroll:${loc.pathname}${loc.search}`;
        const restore = (y) => {
            let i = 0;
            const max = 20;
            const delay = 50;
            const imagesReady = () => Array.from(document.images).every((img) => img.complete);
            const tick = () => {
                i++;
                if (document.readyState === "complete" && imagesReady()) {
                    window.scrollTo({ top: y, left: 0, behavior: "auto" });
                    return;
                }
                if (i < max)
                    setTimeout(tick, delay);
                else
                    window.scrollTo({ top: y, left: 0, behavior: "auto" });
            };
            requestAnimationFrame(tick);
        };
        // Klik-navigation (PUSH/REPLACE) => top. Back/forward (POP) => genskab.
        if (!loc.hash) {
            if (navType === "POP") {
                const raw = sessionStorage.getItem(key);
                const saved = raw ? parseInt(raw, 10) : 0;
                restore(saved);
            }
            else {
                restore(0);
            }
        }
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
        return () => {
            save();
            window.removeEventListener("scroll", onScroll);
        };
    }, [loc.pathname, loc.search, loc.hash, navType]);
    return null;
}
