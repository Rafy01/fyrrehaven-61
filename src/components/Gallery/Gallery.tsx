import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./Gallery.module.css";
import Buttons from "../Buttons";

export type Lang = "da" | "en";

export type GalleryItem = {
  src: string; // thumbnail
  full?: string; // stor version (fallback = src)
  alt?: string; // fallback alt
  altDa?: string; // valgfri sprog-specifik alt
  altEn?: string;
  captionDa?: string; // fuld tekst (vises under billedet i lightbox)
  captionEn?: string;
};

type CTA =
  | { label: string; to: string; href?: never; external?: never }
  | { label: string; href: string; to?: never; external?: boolean }
  | { label: string; to?: never; href?: never; external?: never };

export type GalleryProps = {
  lang?: Lang;
  title?: string;
  subtitle?: string;
  items: GalleryItem[];
  cta?: CTA;
  align?: "left" | "center";
  dense?: boolean;
  /** Fast “ens” tile-størrelse (ratio styres af w/h) */
  tile?: { width: number; height: number };
  gap?: number;
  /** Vis kun N felter – sidste får +N-badge (lightbox viser alle) */
  maxItems?: number;
  /** Hvordan skal billedet udfylde tile? "cover" (pænt beskåret) eller "fill" (stræk) */
  fit?: "cover" | "fill";
};

function tPick(da: string, en: string, lang: Lang) {
  return lang === "da" ? da : en;
}

function getCaption(it: GalleryItem, lang: Lang): string {
  const cap = lang === "da" ? it.captionDa : it.captionEn;
  if (cap && cap.trim()) return cap.trim();
  const a = lang === "da" ? it.altDa : it.altEn;
  if (a && a.trim()) return a.trim();
  return it.alt ?? "";
}

export default function Gallery({
  lang = "da",
  title,
  subtitle,
  items,
  cta,
  align = "center",
  dense = false,
  tile = { width: 260, height: 360 },
  gap = 14,
  maxItems,
  fit = "cover",
}: GalleryProps) {
  const all = items ?? [];
  const visibleItems = useMemo(
    () => (typeof maxItems === "number" ? all.slice(0, maxItems) : all),
    [all, maxItems]
  );
  const extraCount = Math.max(0, all.length - (visibleItems?.length ?? 0));

  // Lightbox
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const total = all.length;

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  // Touch swipe
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) =>
    (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
  };

  // CSS vars (ens tile-dimensioner for alle)
  const gridStyle = {
    ["--tile-w" as string]: `${tile.width}px`,
    ["--tile-h" as string]: `${tile.height}px`,
    ["--gap" as string]: `${gap}px`,
  } as React.CSSProperties;

  const fitClass = fit === "fill" ? styles.fill : styles.cover;

  return (
    <section className={[styles.wrap, dense ? styles.dense : ""].join(" ")}>
      {(title || subtitle) && (
        <header
          className={[
            styles.header,
            align === "center" ? styles.center : "",
          ].join(" ")}
        >
          {title && <h2 className={styles.hTitle}>{title}</h2>}
          {subtitle && <p className={styles.hSubtitle}>{subtitle}</p>}
        </header>
      )}

      {/* Grid: ALLE tiles er 100% samme størrelse */}
      <div className={styles.grid} style={gridStyle}>
        {visibleItems.map((it, i) => {
          const isLastVisible = i === visibleItems.length - 1;
          return (
            <button
              key={`tile-${i}`}
              className={styles.tileBtn}
              onClick={() => {
                if (extraCount > 0 && isLastVisible) {
                  setIndex(visibleItems.length);
                  setOpen(true);
                } else {
                  openAt(i);
                }
              }}
              aria-label={
                it.alt
                  ? tPick(
                      `Åbn billede: ${it.alt}`,
                      `Open image: ${it.alt}`,
                      lang
                    )
                  : tPick(`Åbn billede ${i + 1}`, `Open image ${i + 1}`, lang)
              }
            >
              <div className={styles.tile}>
                <img
                  className={`${styles.img} ${fitClass}`}
                  src={it.src}
                  alt={getCaption(it, lang) || ""}
                  loading="lazy"
                />
                {extraCount > 0 && isLastVisible && (
                  <div className={styles.more} aria-hidden="true">
                    <span className={styles.moreBadge}>+{extraCount}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {cta && (
        <div
          className={[
            styles.ctaRow,
            align === "center" ? styles.center : "",
          ].join(" ")}
        >
          {"to" in cta && cta.to ? (
            <Buttons variant="secondary" label={cta.label} to={cta.to} />
          ) : "href" in cta && cta.href ? (
            <Buttons
              variant="secondary"
              label={cta.label}
              href={cta.href}
              external={cta.external}
            />
          ) : null}
        </div>
      )}

      {/* Lightbox */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.lbOverlay} />
        </Dialog.Portal>
        <Dialog.Portal>
          <Dialog.Content
            className={styles.lbContent}
            aria-label={tPick("Billedfremviser", "Lightbox", lang)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {total > 0 && (
              <>
                <button
                  className={styles.lbClose}
                  aria-label={tPick("Luk", "Close", lang)}
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>

                <button
                  className={`${styles.lbNav} ${styles.prev}`}
                  aria-label={tPick("Forrige", "Previous", lang)}
                  onClick={prev}
                >
                  ‹
                </button>

                <button
                  className={`${styles.lbNav} ${styles.next}`}
                  aria-label={tPick("Næste", "Next", lang)}
                  onClick={next}
                >
                  ›
                </button>

                <figure className={styles.lbFigure}>
                  <img
                    className={styles.lbImg}
                    src={all[index].full ?? all[index].src}
                    alt={getCaption(all[index], lang) || ""}
                  />
                  <div className={styles.lbCounter}>
                    {index + 1} / {total}
                  </div>

                  {/* Tekst direkte under billedet */}
                  {getCaption(all[index], lang) ? (
                    <figcaption className={styles.lbCap}>
                      {getCaption(all[index], lang)}
                    </figcaption>
                  ) : null}
                </figure>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
