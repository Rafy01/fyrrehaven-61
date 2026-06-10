import React, { useEffect, useRef, useState } from "react";
import styles from "./LocationAndDistances.module.css";
import Buttons from "../Buttons";
import { pathOf } from "../../lib/routes";
import { chooseLang, type Lang } from "../../lib/lang";
import { DISTANCE_ICONS as Icon } from "../../lib/icons";

export type DistanceItem = {
  key: string;
  icon: keyof typeof Icon;
  labelDa: string;
  labelEn: string;
  labelDe?: string;
  value: string; // fx "900 m", "2.5 km", "8 min"
  subDa?: string;
  subEn?: string;
  subDe?: string;
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
  ctaLabelDe?: string;
};

const defaultItems: DistanceItem[] = [
  {
    key: "beach",
    icon: "Beach",
    labelDa: "Strand",
    labelEn: "Beach",
    labelDe: "Strand",
    value: "900 m",
  },
  {
    key: "forest",
    icon: "Forest",
    labelDa: "Skovstier",
    labelEn: "Forest trails",
    labelDe: "Waldwege",
    value: "50 m",
  },
  {
    key: "walk",
    icon: "Walk",
    labelDa: "Lokal købmand",
    labelEn: "Local shop",
    labelDe: "Lokaler Kaufmann",
    value: "12 min",
    subDa: "til fods",
    subEn: "on foot",
    subDe: "zu Fuß",
  },
  {
    key: "shop",
    icon: "Shop",
    labelDa: "Supermarked",
    labelEn: "Supermarket",
    labelDe: "Supermarkt",
    value: "3.2 km",
  },
  {
    key: "city",
    icon: "City",
    labelDa: "Nærmeste by",
    labelEn: "Nearest town",
    labelDe: "Nächster Ort",
    value: "8 km",
  },
  {
    key: "car",
    icon: "Car",
    labelDa: "Aarhus",
    labelEn: "Aarhus",
    labelDe: "Aarhus",
    value: "55 min",
    subDa: "i bil",
    subEn: "by car",
    subDe: "mit dem Auto",
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
  ctaLabelDe,
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
      aria-label={t("Beliggenhed & afstande", "Location & distances", "Lage & Entfernungen")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {title ?? t("Beliggenhed & afstande", "Location & distances", "Lage & Entfernungen")}
        </h2>
        {subtitle ? (
          <p className={styles.subtitle}>{subtitle}</p>
        ) : (
          <p className={styles.subtitle}>
            {t(
              "Skovområde tæt på stranden – perfekt til familier",
              "Forest setting near the beach — ideal for families",
              "Waldlage nahe am Strand – ideal für Familien"
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
              title={t("Kort over området", "Map of the area", "Karte der Umgebung")}
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
              labelDe="In Google Maps öffnen"
              href={openMapUrl}
              external
            />
            <Buttons
              labelDa={ctaLabelDa ?? "Rutevejledning"}
              labelEn={ctaLabelEn ?? "Get directions"}
              labelDe={ctaLabelDe ?? "Route anzeigen"}
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
                    <Ico className={styles.icon} aria-hidden="true" />
                  </span>
                  <span className={styles.label}>
                    {t(it.labelDa, it.labelEn, it.labelDe ?? it.labelEn)}
                    {it.subDa || it.subEn ? (
                      <span className={styles.sub}>
                        {" · "}
                        {t(it.subDa ?? "", it.subEn ?? "", it.subDe ?? it.subEn ?? "")}
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
              "Distances are approximate and may vary.",
              "Entfernungen sind ungefähre Angaben und können variieren."
            )}
          </p>
          <Buttons
            labelDa={ctaLabelDa ?? "Se området"}
            labelEn={ctaLabelEn ?? "See the area"}
            labelDe={ctaLabelDe ?? "Umgebung ansehen"}
            href={pathOf(lang, "area")}
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
