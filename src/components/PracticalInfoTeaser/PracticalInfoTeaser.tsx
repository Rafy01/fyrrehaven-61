import styles from "./PracticalInfoTeaser.module.css";
import { chooseLang, type Lang } from "../../lib/lang";

/* ---------- Ikoner (små inline SVG’er) ---------- */
const Icon = {
  Key: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M14.5 3a4.5 4.5 0 1 0 2.8 8.03L22 15.7V18h-2v2h-2v2h-2v-3.3l-4.1-4.1a4.5 4.5 0 0 0 2.6-4.1A4.5 4.5 0 0 0 14.5 3Zm0 2a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5Z" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 5h-2v6l5 3 .9-1.8L13 12.3V7Z" />
    </svg>
  ),
  Wifi: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0-6a8 8 0 0 1 5.7 2.3l1.4-1.4A10 10 0 0 0 12 10a10 10 0 0 0-7.1 2.9l1.4 1.4A8 8 0 0 1 12 12Zm0-6c3.6 0 7 1.4 9.5 3.9l1.4-1.4A14 14 0 0 0 12 2 14 14 0 0 0 1.1 8.6l1.4 1.4A12 12 0 0 1 12 6Z" />
    </svg>
  ),
  Car: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M5 11 7.2 6.2A2 2 0 0 1 9 5h6a2 2 0 0 1 1.8 1.2L19 11v6h-1a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H5v-6Zm3.2-4L7.5 9H16.5l-.7-2h-7.6Z" />
    </svg>
  ),
  Bed: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M3 7h7a3 3 0 0 1 3 3v1h8v6h-2v-2H5v2H3V7Zm2 2v4h6v-1a1 1 0 0 0-1-1H5Zm8 2h6v-1a1 1 0 0 0-1-1h-5v2Z" />
    </svg>
  ),
  NoParty: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4.2 3 21 19.8 19.8 21 17.6 18.8A8 8 0 0 1 4 12h2a6 6 0 0 0 9.9 4.7L13 13.8V15h-2v-3.2L5.4 5.2 4.2 3ZM12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-8.7-5.3L7.8 5.2A7.9 7.9 0 0 1 12 4Z" />
    </svg>
  ),
};

export type PracticalInfoItem = {
  key: string;
  icon: keyof typeof Icon;
  titleDa: string;
  titleEn: string;
  textDa: string;
  textEn: string;
  to?: string; // intern route (valgfri)
  href?: string; // ekstern url (valgfri)
};

export type PracticalInfoTeaserProps = {
  lang: Lang;
  title?: string;
  subtitle?: string;
  items?: PracticalInfoItem[];
  ctaTo?: string; // hvor “Læs mere” peger hen (default: FAQ)
};

function defaultItems(): PracticalInfoItem[] {
  return [
    {
      key: "checkin",
      icon: "Key",
      titleDa: "Selv-indtjekning",
      titleEn: "Self check-in",
      textDa: "Nøgleboks – kode sendes 1 time før ankomst",
      textEn: "Key box – code sent 1 hour before arrival",
    },
    {
      key: "times",
      icon: "Clock",
      titleDa: "Tjek ind/ud",
      titleEn: "Check-in/out",
      textDa: "Ind 16:00 · Ud 10:00",
      textEn: "In 4:00 PM · Out 10:00 AM",
    },
    {
      key: "wifi",
      icon: "Wifi",
      titleDa: "Hurtigt Wi-Fi",
      titleEn: "Fast Wi-Fi",
      textDa: "Stabilt net i hele huset også udenfor",
      textEn: "Reliable coverage across the house and outside",
    },
    {
      key: "parking",
      icon: "Car",
      titleDa: "Parkering",
      titleEn: "Parking",
      textDa: "Plads til 6 biler ved huset",
      textEn: "Space for 6 cars by the house",
    },
    {
      key: "linens",
      icon: "Bed",
      titleDa: "Sengetøj & håndklæder",
      titleEn: "Linens & towels",
      textDa: "Medbring selv (eller tilkøb efter booking)",
      textEn: "Bring your own (or rent after booking)",
    },
    {
      key: "rules",
      icon: "NoParty",
      titleDa: "Husregler",
      titleEn: "House rules",
      textDa: "Ingen fester · Røgfrit hus",
      textEn: "No parties · No smoking",
    },
  ];
}

export default function PracticalInfoTeaser({
  lang,
  title,
  items,
}: PracticalInfoTeaserProps) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const data = items ?? defaultItems();

  return (
    <section
      className={styles.wrap}
      aria-label={t("Praktisk info", "Practical info")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {title ?? t("Praktisk info", "Practical info")}
        </h2>
      </header>

      <div className={styles.grid}>
        {data.map((item) => {
          const Ico = Icon[item.icon];
          const content = (
            <>
              <div className={styles.ico}>
                <Ico />
              </div>
              <div className={styles.texts}>
                <div className={styles.itemTitle}>
                  {t(item.titleDa, item.titleEn)}
                </div>
                <div className={styles.itemSub}>
                  {t(item.textDa, item.textEn)}
                </div>
              </div>
            </>
          );

          // Klikbart kort hvis to/href er sat
          if (item.to) {
            return (
              <a key={item.key} href={item.to} className={styles.card}>
                {content}
              </a>
            );
          }
          if (item.href) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
              >
                {content}
              </a>
            );
          }
          return (
            <div
              key={item.key}
              className={styles.card}
              role="group"
              aria-label={t(item.titleDa, item.titleEn)}
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className={styles.cta}>
      </div>
    </section>
  );
}
