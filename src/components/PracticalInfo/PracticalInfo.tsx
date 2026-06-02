import { Link } from "react-router-dom";
import styles from "./PracticalInfo.module.css";
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
  Roll: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4 7a5 5 0 1 1 10 0v9H9a5 5 0 0 1-5-5V7Zm10 0a3 3 0 1 0-6 0v4a3 3 0 1 0 6 0V7Zm2 1h4v10H16V8Z" />
    </svg>
  ),
  Heat: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path
        d="M7 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3M12 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3M17 4c1 1 1 2 0 3s-1 2 0 3 1 2 0 3-1 2 0 3"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.6"
      />
    </svg>
  ),
  Washer: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M5 3h14v18H5V3Zm2 2v2h10V5H7Zm5 4a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 9Zm-3-4h2v2H9V5Zm4 0h2v2h-2V5Z" />
    </svg>
  ),
  Tv: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4 6h16v10H4V6Zm5 12h6v2H9v-2Z" />
    </svg>
  ),
  Gamepad: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M7 8h10a5 5 0 1 1 0 10h-1l-2-2H10l-2 2H7a5 5 0 1 1 0-10Zm1.5 2.5H7v1.5H5.5V14H7v1.5h1.5V14H10v-1.5H8.5v-2Zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-2 3a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />
    </svg>
  ),
  Ac: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M3 6h18v4H3V6Zm2 8h2l-1 2h2l-1 2h-2l1-2H4l1-2Zm7 0h2l-1 2h2l-1 2h-2l1-2h-2l1-2Zm7 0h2l-1 2h2l-1 2h-2l1-2h-2l1-2Z" />
    </svg>
  ),
  Ev: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M6 6h8l-3 5h3l-6 7 2.5-6H7l-1-6Zm10.5 0 1.5 3h2v2h-2l-1 2h-1l1-2h-2V9h2l-1.5-3h1Z" />
    </svg>
  ),
  Baby: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M12 3a5 5 0 1 1-4.9 6H5a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H9v-2h2a1 1 0 1 0 0-2H7a5 5 0 0 1 0-10h.1A5 5 0 0 1 12 3Z" />
    </svg>
  ),
  Iron: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M3 15h16a2 2 0 0 0 2-2V9h-6a7 7 0 0 0-7 7H3v-1Z" />
    </svg>
  ),
  Grill: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M4 7h16v2H4V7Zm1 4h14a7 7 0 0 1-7 6 7 7 0 0 1-7-6Zm6 6h2l3 4h-2l-1-2h-2l-1 2H8l3-4Z" />
    </svg>
  ),
};

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

export type PracticalInfoProps = {
  lang: Lang;
  /** Overskrift og kort underoverskrift (valgfrit) */
  title?: string;
  subtitle?: string;
  /** Data – hvis ikke givet, bruges defaults nedenfor */
  items?: PracticalInfoItem[];
  /** Teaser = begrænset antal items, Full = alle */
  variant?: "teaser" | "full";
  /** Max items når variant=teaser */
  maxItems?: number;
  /** Valgfri CTA under grid */
  ctaTo?: string;
  ctaHref?: string;
  ctaLabelDa?: string;
  ctaLabelEn?: string;
  ctaLabelDe?: string;
};

function defaultItems(): PracticalInfoItem[] {
  return [
    // ——— eksisterende nøglepunkter ———
    {
      key: "checkin",
      icon: "Key",
      titleDa: "Selv-indtjekning",
      titleEn: "Self check-in",
      titleDe: "Selbst-Check-in",
      textDa: "Nøgleboks – kode sendes 1 time før ankomst",
      textEn: "Key box – code is sent 1 hour prior to arrival",
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

    // ——— NYE punkter fra din liste ———
    {
      key: "starter-pack",
      icon: "Roll",
      titleDa: "Startpakke ",
      titleEn: "Starter pack",
      titleDe: "Starterpaket",
      textDa: "Toiletpapir, køkkenrulle, opvaskemiddel, opvasketabs, håndsæbe, diverse klude",
      textEn: "Toilet paper, kitchen roll, dish soap, dishwasher tablets, hand soap, various cloths",
      textDe: "Toilettenpapier, Küchenrolle, Spülmittel, Spülmaschinentabs, Handseife und verschiedene Tücher",
    },
    {
      key: "floor-heat",
      icon: "Heat",
      titleDa: "Gulvvarme",
      titleEn: "Underfloor heating",
      titleDe: "Fußbodenheizung",
      textDa: "Gulvvarme i hele huset for jævn komfort",
      textEn: "Underfloor heating throughout for even comfort",
      textDe: "Fußbodenheizung im ganzen Haus für gleichmäßigen Komfort",
    },
    {
      key: "laundry",
      icon: "Washer",
      titleDa: "Vask & tørring",
      titleEn: "Laundry",
      titleDe: "Waschen & Trocknen",
      textDa: "Vaskemaskine og tørretumbler til rådighed",
      textEn: "Washing machine and tumble dryer available",
      textDe: "Waschmaschine und Trockner stehen zur Verfügung",
    },
    {
      key: "tv",
      icon: "Tv",
      titleDa: 'Fjernsyn 55"',
      titleEn: '55" TV',
      titleDe: '55" Fernseher',
      textDa: "Stue med 55” TV til hygge og film",
      textEn: "Living room with 55” TV for movies & nights in",
      textDe: "Wohnzimmer mit 55-Zoll-Fernseher für Filme und gemütliche Abende",
    },
    {
      key: "playstation",
      icon: "Gamepad",
      titleDa: "PlayStation",
      titleEn: "PlayStation",
      titleDe: "PlayStation",
      textDa: "PlayStation med familievenlige spil",
      textEn: "PlayStation with family-friendly games",
      textDe: "PlayStation mit familienfreundlichen Spielen",
    },
    {
      key: "ac",
      icon: "Ac",
      titleDa: "Aircondition",
      titleEn: "Air conditioning",
      titleDe: "Klimaanlage",
      textDa: "Køl/varme efter behov i opholdsrum",
      textEn: "Cooling/heating as needed in the living area",
      textDe: "Kühlen/Heizen nach Bedarf im Wohnbereich",
    },
    {
      key: "ev",
      icon: "Ev",
      titleDa: "EL-lader",
      titleEn: "EV charger",
      titleDe: "E-Auto-Ladestation",
      textDa: "Mulighed for opladning af elbil ved huset",
      textEn: "EV charging available at the house",
      textDe: "Lademöglichkeit für Elektroautos am Haus",
    },
    {
      key: "travel-cot",
      icon: "Baby",
      titleDa: "Rejseseng (gratis)",
      titleEn: "Travel cot (free)",
      titleDe: "Reisebett (kostenlos)",
      textDa: "Gratis rejseseng til børn – bestilles på forhånd",
      textEn: "Free travel cot for children – request in advance",
      textDe: "Kostenloses Reisebett für Kinder – bitte vorab anfragen",
    },
    {
      key: "iron-dryer",
      icon: "Iron",
      titleDa: "Strygejern & hårtørrer",
      titleEn: "Iron & hair dryer",
      titleDe: "Bügeleisen & Föhn",
      textDa: "Til rådighed for dit ophold",
      textEn: "Available during your stay",
      textDe: "Während Ihres Aufenthalts verfügbar",
    },
    {
      key: "gas-grill",
      icon: "Grill",
      titleDa: "Gasgrill",
      titleEn: "Gas grill",
      titleDe: "Gasgrill",
      textDa: "Terrasse med gasgrill til nem madlavning",
      textEn: "Terrace with gas grill for easy cooking",
      textDe: "Terrasse mit Gasgrill für unkompliziertes Kochen",
    },
  ];
}

export default function PracticalInfo({
  lang,
  title,
  subtitle,
  items,
  variant = "teaser",
  maxItems = 4,
  ctaTo,
  ctaHref,
  ctaLabelDa,
  ctaLabelEn,
  ctaLabelDe,
}: PracticalInfoProps) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const data = items ?? defaultItems();
  const list =
    variant === "teaser" ? data.slice(0, Math.max(1, maxItems)) : data;

  const renderCardInner = (it: PracticalInfoItem) => {
    const Ico = Icon[it.icon];
    return (
      <>
        <div className={styles.ico}>
          <Ico />
        </div>
        <div className={styles.texts}>
          <div className={styles.itemTitle}>
            {t(it.titleDa, it.titleEn, it.titleDe ?? it.titleEn)}
          </div>
          <div className={styles.itemSub}>
            {t(it.textDa, it.textEn, it.textDe ?? it.textEn)}
          </div>
        </div>
      </>
    );
  };

  return (
    <section
      className={styles.wrap}
      aria-label={t("Praktisk info", "Practical info", "Praktische Infos")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {title ?? t("Praktisk info", "Practical info", "Praktische Infos")}
        </h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>

      <div className={styles.grid}>
        {list.map((it) => {
          if (it.to) {
            return (
              <Link key={it.key} to={it.to} className={styles.card}>
                {renderCardInner(it)}
              </Link>
            );
          }
          if (it.href) {
            return (
              <a
                key={it.key}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
              >
                {renderCardInner(it)}
              </a>
            );
          }
          return (
            <div
              key={it.key}
              className={styles.card}
              role="group"
              aria-label={t(it.titleDa, it.titleEn, it.titleDe ?? it.titleEn)}
            >
              {renderCardInner(it)}
            </div>
          );
        })}
      </div>

      {(ctaTo || ctaHref) && (
        <div className={styles.cta}>
          {ctaTo ? (
            <Link to={ctaTo} className={styles.ctaBtn}>
              {t(ctaLabelDa ?? "Læs mere", ctaLabelEn ?? "Learn more", ctaLabelDe ?? "Mehr erfahren")}
            </Link>
          ) : (
            <a
              href={ctaHref}
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              {t(ctaLabelDa ?? "Læs mere", ctaLabelEn ?? "Learn more", ctaLabelDe ?? "Mehr erfahren")}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
