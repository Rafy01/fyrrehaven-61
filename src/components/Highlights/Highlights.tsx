import React from "react";
import { Link } from "react-router-dom";
import { Heading, Text } from "@radix-ui/themes";
import styles from "./Highlights.module.css";
import Buttons from "../Buttons";
import LazyImage from "../LazyImage";

/** Navigation-union pr. kort */
type LinkLike =
  | { to: string; href?: never; external?: never }
  | { href: string; to?: never; external?: boolean }
  | { to?: never; href?: never; external?: never };

/** Medie pr. kort: ikon (ReactNode) eller billede */
export type HighlightMedia =
  | { kind: "icon"; icon: React.ReactNode }
  | {
      kind: "image";
      src: string;
      alt?: string;
      aspect?: string;
      objectPosition?: string;
    };

export type HighlightItem = LinkLike & {
  title: string;
  body?: string;
  media?: HighlightMedia;
  badge?: string;
  ctaLabel?: string; // hvis sat + link findes → vis knap
};

export type HighlightsProps = {
  id?: string;
  title?: string; // sektionstitel (fx “Højdepunkter”)
  subtitle?: string; // valgfri undertekst
  items: HighlightItem[]; // 3–4 kort anbefales
  align?: "left" | "center";
  dense?: boolean; // lidt mindre vertical spacing
};

function CardWrapper({
  to,
  href,
  external,
  children,
  className,
}: {
  to?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  className: string;
}) {
  if (to) {
    return (
      <Link to={to} className={className} aria-label={undefined}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
        aria-label={undefined}
      >
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

export default function Highlights({
  id,
  title,
  subtitle,
  items,
  align = "left",
  dense = false,
}: HighlightsProps) {
  const sectionAlign = align === "center" ? styles.center : "";
  const hasCarousel = items.length > 4;
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const offsetRef = React.useRef(0);
  const cycleWidthRef = React.useRef(0);
  const dragStartXRef = React.useRef(0);
  const dragStartOffsetRef = React.useRef(0);
  const isHoveringRef = React.useRef(false);
  const canHoverRef = React.useRef(false);
  const isFocusWithinRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  const didDragRef = React.useRef(false);
  const isTapPausedRef = React.useRef(false);
  const [carouselOffset, setCarouselOffset] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isInView, setIsInView] = React.useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    React.useState(false);
  const isCarouselActive = hasCarousel;
  const carouselItems = isCarouselActive ? [...items, ...items] : items;

  const setWrappedOffset = React.useCallback((nextOffset: number) => {
    const cycleWidth = cycleWidthRef.current;
    const wrappedOffset =
      cycleWidth > 0
        ? ((nextOffset % cycleWidth) + cycleWidth) % cycleWidth
        : Math.max(0, nextOffset);

    offsetRef.current = wrappedOffset;
    setCarouselOffset(wrappedOffset);
  }, []);

  const updatePauseState = React.useCallback(() => {
    setIsPaused(
      isHoveringRef.current ||
        isFocusWithinRef.current ||
        isDraggingRef.current ||
        isTapPausedRef.current
    );
  }, []);

  React.useEffect(() => {
    if (!hasCarousel) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const syncMedia = () => {
      setPrefersReducedMotion(reducedMotionQuery.matches);
      canHoverRef.current = hoverQuery.matches;
      if (!hoverQuery.matches) {
        isHoveringRef.current = false;
      }
    };

    syncMedia();
    reducedMotionQuery.addEventListener("change", syncMedia);
    hoverQuery.addEventListener("change", syncMedia);

    return () => {
      reducedMotionQuery.removeEventListener("change", syncMedia);
      hoverQuery.removeEventListener("change", syncMedia);
    };
  }, [hasCarousel]);

  React.useEffect(() => {
    if (!hasCarousel) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [hasCarousel]);

  React.useEffect(() => {
    if (!hasCarousel) return;

    const measureCarousel = () => {
      const track = trackRef.current;
      const firstCard = track?.querySelector<HTMLElement>(
        `.${styles.card}`
      );
      if (!track || !firstCard) return;

      const trackStyles = window.getComputedStyle(track);
      const gap = Number.parseFloat(trackStyles.columnGap || "0");
      cycleWidthRef.current = (firstCard.offsetWidth + gap) * items.length;
      setWrappedOffset(offsetRef.current);
    };

    measureCarousel();

    const resizeObserver = new ResizeObserver(measureCarousel);
    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [hasCarousel, items.length, setWrappedOffset]);

  React.useEffect(() => {
    if (
      !hasCarousel ||
      !isInView ||
      isPaused ||
      prefersReducedMotion
    ) {
      return;
    }

    let animationFrame = 0;
    let lastTime = window.performance.now();
    const pixelsPerMs = 0.028;

    const tick = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setWrappedOffset(offsetRef.current + delta * pixelsPerMs);
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    hasCarousel,
    isInView,
    isPaused,
    prefersReducedMotion,
    setWrappedOffset,
  ]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!hasCarousel) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    setIsDragging(true);
    updatePauseState();
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDraggingRef.current) return;

    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      didDragRef.current = true;
    }
    setWrappedOffset(dragStartOffsetRef.current - deltaX);
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDraggingRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const shouldToggleTapPause =
      event.type === "pointerup" &&
      event.pointerType !== "mouse" &&
      !didDragRef.current;

    isDraggingRef.current = false;
    setIsDragging(false);
    if (shouldToggleTapPause) {
      isTapPausedRef.current = !isTapPausedRef.current;
    }
    updatePauseState();
  };

  const handleClickCapture = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!didDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  const renderCard = (
    it: HighlightItem,
    idx: number,
    isDuplicate = false
  ) => {
    const hasCta = !!(it.ctaLabel && (it.to || it.href));

    return (
      <article
        key={`${isDuplicate ? "duplicate" : "item"}-${idx}`}
        role={isDuplicate ? undefined : "listitem"}
        aria-hidden={isDuplicate ? "true" : undefined}
        className={styles.card}
      >
        <CardWrapper
          to={isDuplicate ? undefined : it.to}
          href={isDuplicate ? undefined : it.href}
          external={isDuplicate ? undefined : it.external}
          className={styles.cardBody}
        >
          {it.media && (
            <figure
              className={styles.media}
              style={
                it.media.kind === "image" && it.media.aspect
                  ? ({
                      ["--aspect"]: it.media.aspect,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {it.media.kind === "icon" ? (
                <div className={styles.iconBox} aria-hidden="true">
                  {it.media.icon}
                </div>
              ) : (
                <div className={styles.imgFrame}>
                  <LazyImage
                    src={it.media.src}
                    alt={it.media.alt ?? ""}
                    className={styles.img}
                    loading="lazy"
                    style={
                      it.media.objectPosition
                        ? { objectPosition: it.media.objectPosition }
                        : undefined
                    }
                  />
                </div>
              )}
            </figure>
          )}

          {it.badge && <span className={styles.badge}>{it.badge}</span>}

          <Heading as="h3" size="4" className={styles.title}>
            {it.title}
          </Heading>

          {it.body && (
            <Text as="p" color="gray" className={styles.body}>
              {it.body}
            </Text>
          )}
        </CardWrapper>

        {hasCta && !isDuplicate && (
          <div className={styles.ctaRow}>
            <Buttons
              variant="secondary"
              label={it.ctaLabel!}
              {...(it.to
                ? { to: it.to }
                : { href: it.href!, external: it.external })}
            />
          </div>
        )}
      </article>
    );
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      className={[styles.wrap, dense ? styles.dense : ""].join(" ")}
    >
      {(title || subtitle) && (
        <header className={[styles.header, sectionAlign].join(" ")}>
          {title && (
            <Heading as="h2" size="7" className={styles.hTitle}>
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text as="p" color="gray" className={styles.hSubtitle}>
              {subtitle}
            </Text>
          )}
        </header>
      )}

      <div
        className={[
          styles.carousel,
          isCarouselActive ? styles.carouselEnabled : "",
          isDragging ? styles.dragging : "",
        ].join(" ")}
        onMouseEnter={() => {
          if (!canHoverRef.current) return;
          isHoveringRef.current = true;
          updatePauseState();
        }}
        onMouseLeave={() => {
          if (!canHoverRef.current) return;
          isHoveringRef.current = false;
          updatePauseState();
        }}
        onFocus={() => {
          isFocusWithinRef.current = true;
          updatePauseState();
        }}
        onBlur={() => {
          isFocusWithinRef.current = false;
          updatePauseState();
        }}
      >
        <div
          className={styles.viewport}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClickCapture={handleClickCapture}
        >
          <div
            ref={trackRef}
            className={[
              styles.grid,
              isCarouselActive ? styles.carouselTrack : "",
            ].join(" ")}
            role="list"
            style={
              isCarouselActive
                ? ({
                    ["--carousel-offset"]: `${carouselOffset}px`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {carouselItems.map((it, idx) =>
              renderCard(it, idx, isCarouselActive && idx >= items.length)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
