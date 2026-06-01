import React, { useEffect, useRef, useState } from "react";
import styles from "./LocationAndDistances.module.css";
import Buttons from "../Buttons";
import { pathOf } from "../../lib/routes";
import { chooseLang, type Lang } from "../../lib/lang";

/** Små inline-ikoner (ingen ekstra lib) */
const Icon = {
  Beach: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M3 18h18v2H3v-2Zm7.5-9c1.7 0 3.2.8 4.2 2.1l-1.6.9c-.7-.9-1.7-1.4-2.6-1.4-1 0-2 .5-2.7 1.4l-1.6-.9c1-1.3 2.5-2.1 4.3-2.1Zm0-4c3.1 0 5.8 1.9 7 4.6l-1.8 1c-.9-2-3-3.4-5.2-3.4s-4.4 1.4-5.3 3.4l-1.7-1C4.7 6.9 7.4 5 10.5 5Zm8 12c-1.2 0-2.1.5-2.8 1.1-.7-.6-1.6-1.1-2.7-1.1s-2.1.5-2.8 1.1c-.7-.6-1.6-1.1-2.7-1.1S5.4 17.5 4.7 18c.8.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c-.7-.5-1.6-1.1-2.8-1.1Z" />
    </svg>
  ),
  Forest: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M7 2 2 10h3l-3 5h4v5h2v-5h4l-3-5h3L7 2Zm10 3-4 7h3l-3 4h4v4h2v-4h3l-3-4h3l-5-7Z" />
    </svg>
  ),
  Walk: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M13 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-1.3 6.2 1.9.6c1 .3 1.7 1.3 1.7 2.4V20h-2v-5.3l-1-.3-1.7 2.7L9 20H7.1l1.7-3-1.3-2.1-2.4 1.2-.9-1.8 3.4-1.7 1.3-2.4c.5-1 1.7-1.5 2.8-1.1Z" />
    </svg>
  ),
  Car: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M5 11 7.2 6.2A2 2 0 0 1 9 5h6a2 2 0 0 1 1.8 1.2L19 11v6h-1a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H5v-6Zm3.2-4L7.5 9H16.5l-.7-2h-7.6Z" />
    </svg>
  ),
  Shop: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4 7h16l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Zm2-4h12l1 3H5l1-3Zm2 9h2v6H8v-6Zm6 0h2v6h-2v-6Z" />
    </svg>
  ),
  City: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4 20V8h6V4h4l6 6v10h-6v-4H10v4H4Zm8-12v2h2V8h-2Z" />
    </svg>
  ),
};

export type DistanceItem = {
  key: string;
  icon: keyof typeof Icon;
  labelDa: string;
  labelEn: string;
  value: string; // fx "900 m", "2.5 km", "8 min"
  subDa?: string;
  subEn?: string;
};

export type LocationAndDistancesProps = {
  lang: Lang;
  /** Google My Maps embed URL */
  mapEmbedUrl: string;
  /** “Åbn i Google Maps” (viewer) – valgfri */
  mapLinkUrl?: string;
  /** Rutevejledning (Google Directions) – valgfri */
  directionsTo?: string; // fx "Fyrrehaven 61, DK" eller "56.XXX,10.XXX"
  title?: string;
  subtitle?: string;
  aspect?: string; // "3 / 2" | "16 / 10" | "4 / 3"
  items?: DistanceItem[];
  ctaLabelDa?: string;
  ctaLabelEn?: string;
};

const defaultItems: DistanceItem[] = [
  {
    key: "beach",
    icon: "Beach",
    labelDa: "Strand",
    labelEn: "Beach",
    value: "900 m",
  },
  {
    key: "forest",
    icon: "Forest",
    labelDa: "Skovstier",
    labelEn: "Forest trails",
    value: "50 m",
  },
  {
    key: "walk",
    icon: "Walk",
    labelDa: "Lokal købmand",
    labelEn: "Local shop",
    value: "12 min",
    subDa: "til fods",
    subEn: "on foot",
  },
  {
    key: "shop",
    icon: "Shop",
    labelDa: "Supermarked",
    labelEn: "Supermarket",
    value: "3.2 km",
  },
  {
    key: "city",
    icon: "City",
    labelDa: "Nærmeste by",
    labelEn: "Nearest town",
    value: "8 km",
  },
  {
    key: "car",
    icon: "Car",
    labelDa: "Aarhus",
    labelEn: "Aarhus",
    value: "55 min",
    subDa: "i bil",
    subEn: "by car",
  },
];

export default function LocationAndDistances({
  lang,
  mapEmbedUrl,
  mapLinkUrl,
  directionsTo,
  title,
  subtitle,
  aspect = "16 / 10",
  items,
  ctaLabelDa,
  ctaLabelEn,
}: LocationAndDistancesProps) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const list = items ?? defaultItems;

  // Lazy-load iframe, kun når sektionen er i viewport
  const [ready, setReady] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const directionsUrl = directionsTo
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        directionsTo
      )}`
    : mapLinkUrl ?? mapEmbedUrl;

  const openMapUrl = mapLinkUrl ?? mapEmbedUrl;

  return (
    <section
      className={styles.wrap}
      aria-label={t("Beliggenhed & afstande", "Location & distances")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {title ?? t("Beliggenhed & afstande", "Location & distances")}
        </h2>
        {subtitle ? (
          <p className={styles.subtitle}>{subtitle}</p>
        ) : (
          <p className={styles.subtitle}>
            {t(
              "Skovområde tæt på stranden – perfekt til familier",
              "Forest setting near the beach — ideal for families"
            )}
          </p>
        )}
      </header>

      <div className={styles.grid}>
        {/* Map */}
        <div
          className={styles.mapBox}
          style={{ ["--aspect" as keyof React.CSSProperties]: aspect }}
          ref={boxRef}
        >
          {!ready && <div className={styles.skeleton} aria-hidden="true" />}
          {ready && (
            <iframe
              title={t("Kort over området", "Map of the area")}
              className={styles.iframe}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          )}

          <div className={styles.mapActions}>
            <Buttons
              variant="secondary"
              labelDa="Åbn i Google Maps"
              labelEn="Open in Google Maps"
              href={openMapUrl}
              external
            />
            <Buttons
              labelDa={ctaLabelDa ?? "Rutevejledning"}
              labelEn={ctaLabelEn ?? "Get directions"}
              href={directionsUrl}
              external
            />
          </div>
        </div>

        {/* Distances list */}
        <div className={styles.list}>
          <ul className={styles.ul}>
            {list.map((it) => {
              const Ico = Icon[it.icon];
              return (
                <li key={it.key} className={styles.li}>
                  <span className={styles.ico}>
                    <Ico />
                  </span>
                  <span className={styles.label}>
                    {t(it.labelDa, it.labelEn)}
                    {it.subDa || it.subEn ? (
                      <span className={styles.sub}>
                        {" · "}
                        {t(it.subDa ?? "", it.subEn ?? "")}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.value}>{it.value}</span>
                </li>
              );
            })}
          </ul>

          <p className={styles.note}>
            {t(
              "Afstande er omtrentlige og kan variere.",
              "Distances are approximate and may vary."
            )}
          </p>
          <Buttons
            labelDa={ctaLabelDa ?? "Se området"}
            labelEn={ctaLabelEn ?? "See the area"}
            href={pathOf(lang, "area")}
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
