import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./GalleryTeaser.module.css";
import Buttons from "../Buttons";
import LazyImage from "../LazyImage";

export type GalleryItem = {
  src: string; // thumbnail
  full?: string; // stor version (fallback = src)
  alt?: string; // "" hvis dekorativt
  objectPosition?: string;
};

type CTA =
  | { label: string; to: string; href?: never; external?: never }
  | { label: string; href: string; to?: never; external?: boolean }
  | { label: string; to?: never; href?: never; external?: never };

export type GalleryTeaserProps = {
  title?: string;
  subtitle?: string;
  items: GalleryItem[];
  cta?: CTA;
  align?: "left" | "center";
  dense?: boolean;
  aspect?: string; // fx "9 / 16"
  stagger?: boolean | number; // true=12px, tal=px, false=ingen
};

export default function GalleryTeaser({
  title,
  subtitle,
  items,
  cta,
  align = "center",
  dense = false,
  aspect = "9 / 16",
  stagger = true,
}: GalleryTeaserProps) {
  const first3 = items.slice(0, 3);
  const fourth = items[3];
  const extraCount = Math.max(0, items.length - 4);

  // Lightbox
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const total = items.length;

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

  // touch-swipe
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) =>
    (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
  };

  const collageStyle = {
    ["--aspect" as string]: aspect,
    ["--amp" as string]: typeof stagger === "number" ? `${stagger}px` : "12px",
  } as React.CSSProperties;

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

      {/* 4 lodrette piller */}
      <div
        className={[styles.collage, stagger ? styles.staggered : ""].join(" ")}
        style={collageStyle}
      >
        {first3.map((it, i) => (
          <button
            key={`pill-${i}`}
            className={styles.pillBtn}
            aria-label={
              it.alt ? `Åbn billede: ${it.alt}` : `Åbn billede ${i + 1}`
            }
            onClick={() => openAt(i)}
          >
            <div className={styles.pill}>
              <LazyImage
                className={styles.img}
                src={it.src}
                alt={it.alt ?? ""}
                loading="lazy"
                style={
                  it.objectPosition
                    ? { objectPosition: it.objectPosition }
                    : undefined
                }
              />
            </div>
          </button>
        ))}

        <button
          className={styles.pillBtn}
          aria-label={
            fourth?.alt
              ? `Åbn billede: ${fourth.alt}`
              : `Åbn billede ${Math.min(4, items.length)}`
          }
          onClick={() => openAt(Math.min(3, items.length - 1))}
        >
          <div className={styles.pill}>
            {fourth ? (
              <LazyImage
                className={styles.img}
                src={fourth.src}
                alt={fourth.alt ?? ""}
                loading="lazy"
                style={
                  fourth.objectPosition
                    ? { objectPosition: fourth.objectPosition }
                    : undefined
                }
              />
            ) : (
              <div className={styles.placeholder} aria-hidden="true" />
            )}
            {extraCount > 0 && (
              <div className={styles.more} aria-hidden="true">
                <span className={styles.moreBadge}>+{extraCount}</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {cta && (
        <div
          className={[
            styles.ctaRow,
            align === "center" ? styles.center : "",
          ].join(" ")}
        >
          {cta.to ? (
            <Buttons variant="secondary" label={cta.label} to={cta.to} />
          ) : cta.href ? (
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
          <Dialog.Content
            className={styles.lbContent}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label="Billedfremviser"
          >
            {total > 0 && (
              <>
                <button
                  className={styles.lbClose}
                  aria-label="Luk"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>

                <button
                  className={`${styles.lbNav} ${styles.prev}`}
                  aria-label="Forrige"
                  onClick={prev}
                >
                  ‹
                </button>

                <figure className={styles.lbFigure}>
                  <LazyImage
                    className={styles.lbImg}
                    src={items[index].full ?? items[index].src}
                    alt={items[index].alt ?? ""}
                    loading="eager"
                  />
                  {items[index].alt ? (
                    <figcaption className={styles.lbCap}>
                      {items[index].alt}
                    </figcaption>
                  ) : null}
                  <div className={styles.lbCounter}>
                    {index + 1} / {total}
                  </div>
                </figure>

                <button
                  className={`${styles.lbNav} ${styles.next}`}
                  aria-label="Næste"
                  onClick={next}
                >
                  ›
                </button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
