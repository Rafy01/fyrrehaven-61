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
import LazyImage from "../LazyImage";
import { chooseLang } from "../../lib/lang";

import type { Lang } from "../../lib/lang";
export type { Lang };

export type GalleryItem = {
  src: string; // thumbnail
  full?: string; // stor version (fallback = src)
  alt?: string;
  altDa?: string;
  altEn?: string;
  altDe?: string;
  captionDa?: string;
  captionEn?: string;
  captionDe?: string;
};

type CTA =
  | { label: string; to: string; href?: never; external?: never }
  | { label: string; href: string; to?: never; external?: boolean }
  | { label: string; to?: never; href?: never; external?: never };

export type GalleryProps = {
  lang?: Lang;
  title?: string;
  subtitle?: string;
  /** Flad liste af billeder (fra fælles mappe). Vi grupperer automatisk efter undermappe. */
  items: GalleryItem[];
  cta?: CTA;
  align?: "left" | "center";
  dense?: boolean;
  /** Fast “ens” tile-størrelse (ratio styres af w/h) */
  tile?: { width: number; height: number };
  gap?: number;
  /** Vis kun N mapper (lightbox viser alt i den valgte mappe) */
  maxItems?: number;
  /** Hvordan skal cover-billedet udfylde tile? */
  fit?: "cover" | "fill";
};

/* ───────────────── helpers ───────────────── */

function tPick(da: string, en: string, lang: Lang, de = en) {
  return chooseLang(lang, da, en, de);
}
function getCaption(it: GalleryItem, lang: Lang): string {
  const cap =
    lang === "da" ? it.captionDa : lang === "de" ? it.captionDe : it.captionEn;
  if (cap && cap.trim()) return cap.trim();
  const a = lang === "da" ? it.altDa : lang === "de" ? it.altDe : it.altEn;
  if (a && a.trim()) return a.trim();
  return it.alt ?? "";
}

/** slug fra src: '/gallery/<slug>/fil.webp' -> '<slug>'; ellers 'misc' */
function folderOf(src: string): string {
  const m = src.match(/\/gallery\/([^/]+)\//i);
  return (m?.[1] ?? "misc").toLowerCase();
}
const FOLDER_LABELS: Record<string, { da: string; en: string; de: string }> = {
  outdoor: { da: "Udendørs", en: "Outdoor", de: "Outdoor" },
  evening: { da: "Aften", en: "Evening", de: "Abend" },
  indoor: { da: "Indendørs", en: "Indoor", de: "Innen" },
  pool: { da: "Pool", en: "Pool", de: "Pool" },
  sauna: { da: "Sauna", en: "Sauna", de: "Sauna" },
  area: { da: "Området", en: "Area", de: "Umgebung" },
  floorplan: { da: "Plantegning", en: "Floor plan", de: "Grundriss" },
  misc: { da: "Blandet", en: "Misc", de: "Verschiedenes" },
};
function labelFor(slug: string, lang: Lang): string {
  const fromMap = FOLDER_LABELS[slug];
  if (fromMap) return chooseLang(lang, fromMap.da, fromMap.en, fromMap.de);
  // Fallback: Capitalize slug
  return slug.slice(0, 1).toUpperCase() + slug.slice(1);
}

type Folder = {
  id: string; // slug
  labelDa: string;
  labelEn: string;
  labelDe: string;
  items: GalleryItem[]; // alle billeder i mappen
  cover: GalleryItem; // første billede bruges som cover
};

/** Byg mappe-struktur i stabil rækkefølge ud fra første optræden i items */
function buildFolders(items: GalleryItem[]): Folder[] {
  const map = new Map<string, Folder>();
  for (const it of items) {
    const slug = folderOf(it.src);
    let f = map.get(slug);
    if (!f) {
      f = {
        id: slug,
        labelDa: labelFor(slug, "da"),
        labelEn: labelFor(slug, "en"),
        labelDe: labelFor(slug, "de"),
        items: [],
        cover: it,
      };
      map.set(slug, f);
    }
    f.items.push(it);
    // behold første som cover
  }
  return Array.from(map.values());
}

/* ───────────────── component ───────────────── */

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
  // Grupper til mapper
  const folders = useMemo(() => buildFolders(items ?? []), [items]);
  const visibleFolders = useMemo(
    () => (typeof maxItems === "number" ? folders.slice(0, maxItems) : folders),
    [folders, maxItems]
  );

  // Lightbox (pr. mappe)
  const [open, setOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [index, setIndex] = useState(0);

  const total = activeFolder?.items.length ?? 0;

  const openFolder = (f: Folder) => {
    setActiveFolder(f);
    setIndex(0);
    setOpen(true);
  };
  const prev = useCallback(() => {
    if (!activeFolder) return;
    setIndex(
      (i) => (i - 1 + activeFolder.items.length) % activeFolder.items.length
    );
  }, [activeFolder]);
  const next = useCallback(() => {
    if (!activeFolder) return;
    setIndex((i) => (i + 1) % activeFolder.items.length);
  }, [activeFolder]);

  // Piletaster
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

      {/* Grid: én tile pr. mappe */}
      <div className={styles.grid} style={gridStyle}>
        {visibleFolders.map((f) => {
          const label = chooseLang(lang, f.labelDa, f.labelEn, f.labelDe);
          const cover = f.cover;
          const count = f.items.length;
          const extra = Math.max(0, count - 1); // ← antal ud over cover

          const countWord =
            lang === "da"
              ? count === 1
                ? "billede"
                : "billeder"
              : lang === "de"
              ? count === 1
                ? "Foto"
                : "Fotos"
              : count === 1
              ? "photo"
              : "photos";

          return (
            <button
              key={f.id}
              className={styles.tileBtn}
              onClick={() => openFolder(f)}
              aria-label={`${label} – ${count} ${countWord}`}
            >
              <div className={styles.tile}>
                <LazyImage
                  className={`${styles.img} ${fitClass}`}
                  src={cover.src}
                  alt={getCaption(cover, lang) || ""}
                  loading="lazy"
                />
                {/* Overlay med navn + (evt.) antal */}
                <div className={styles.tileOverlay} aria-hidden="true" />
                <span className={styles.tileTitle}>{label}</span>
                {/* Vis KUN badge hvis der er mere end 1 billede i mappen */}
                {extra > 0 && (
                  <span className={styles.tileBadge}>+{extra}</span>
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

      {/* Lightbox pr. mappe */}
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
            <Dialog.Title className={styles.srOnly}>
              {activeFolder
                ? chooseLang(
                    lang,
                    activeFolder.labelDa,
                    activeFolder.labelEn,
                    activeFolder.labelDe
                  )
                : ""}
            </Dialog.Title>
            <Dialog.Description className={styles.srOnly}>
              {tPick(
                "Billedviser. Brug venstre/højre piletaster for at bladre.",
                "Image viewer. Use left/right arrows to navigate.",
                lang,
                "Bilderanzeige. Verwenden Sie die Pfeiltasten links/rechts, um zu navigieren."
              )}
            </Dialog.Description>

            {activeFolder && total > 0 && (
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
                  <LazyImage
                    className={styles.lbImg}
                    src={
                      activeFolder.items[index].full ??
                      activeFolder.items[index].src
                    }
                    alt={getCaption(activeFolder.items[index], lang) || ""}
                    loading="eager"
                  />
                  <div className={styles.lbCounter}>
                    {index + 1} / {total}
                  </div>

                  {getCaption(activeFolder.items[index], lang) ? (
                    <figcaption className={styles.lbCap}>
                      {getCaption(activeFolder.items[index], lang)}
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
