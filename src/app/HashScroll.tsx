// src/app/HashScroll.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function HashScroll() {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    // vent ét frame så DOM-sektionen med id'et findes
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hash, key]);

  return null;
}
