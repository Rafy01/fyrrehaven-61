import styles from "./PracticalInfoTeaser.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
import { PRACTICAL_INFO_ICONS as Icon } from "../../lib/icons";

export type PracticalInfoItem = {
  key: string;
  icon: keyof typeof Icon;
  titleDa: string;
  titleEn: string;
  titleDe?: string;
  textDa: string;
  textEn: string;
  textDe?: string;
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
      titleDe: "Selbst-Check-in",
      textDa: "Nøgleboks – kode sendes 1 time før ankomst",
      textEn: "Key box – code sent 1 hour before arrival",
      textDe: "Schlüsselkasten – Code wird 1 Stunde vor Ankunft gesendet",
    },
    {
      key: "times",
      icon: "Clock",
      titleDa: "Tjek ind/ud",
      titleEn: "Check-in/out",
      titleDe: "Check-in/out",
      textDa: "Ind 16:00 · Ud 10:00",
      textEn: "In 4:00 PM · Out 10:00 AM",
      textDe: "Anreise 16:00 · Abreise 10:00",
    },
    {
      key: "wifi",
      icon: "Wifi",
      titleDa: "Hurtigt Wi-Fi",
      titleEn: "Fast Wi-Fi",
      titleDe: "Schnelles WLAN",
      textDa: "Stabilt net i hele huset også udenfor",
      textEn: "Reliable coverage across the house and outside",
      textDe: "Stabile Verbindung im ganzen Haus und auch draußen",
    },
    {
      key: "parking",
      icon: "Car",
      titleDa: "Parkering",
      titleEn: "Parking",
      titleDe: "Parken",
      textDa: "Plads til 6 biler ved huset",
      textEn: "Space for 6 cars by the house",
      textDe: "Platz für 6 Autos am Haus",
    },
    {
      key: "linens",
      icon: "Bed",
      titleDa: "Sengetøj & håndklæder",
      titleEn: "Linens & towels",
      titleDe: "Bettwäsche & Handtücher",
      textDa: "Medbring selv (eller tilkøb efter booking)",
      textEn: "Bring your own (or rent after booking)",
      textDe: "Bitte selbst mitbringen oder nach der Buchung dazubuchen",
    },
    {
      key: "rules",
      icon: "NoParty",
      titleDa: "Husregler",
      titleEn: "House rules",
      titleDe: "Hausregeln",
      textDa: "Ingen fester · Røgfrit hus",
      textEn: "No parties · No smoking",
      textDe: "Keine Partys · Nichtraucherhaus",
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
      aria-label={t("Praktisk info", "Practical info", "Praktische Infos")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {title ?? t("Praktisk info", "Practical info", "Praktische Infos")}
        </h2>
      </header>

      <div className={styles.grid}>
        {data.map((item) => {
          const Ico = Icon[item.icon];
          const content = (
            <>
              <div className={styles.ico}>
                <Ico className={styles.icon} aria-hidden="true" />
              </div>
              <div className={styles.texts}>
                <div className={styles.itemTitle}>
                  {t(item.titleDa, item.titleEn, item.titleDe ?? item.titleEn)}
                </div>
                <div className={styles.itemSub}>
                  {t(item.textDa, item.textEn, item.textDe ?? item.textEn)}
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
              aria-label={t(item.titleDa, item.titleEn, item.titleDe ?? item.titleEn)}
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
