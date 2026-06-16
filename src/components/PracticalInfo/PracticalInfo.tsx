import { Link } from "react-router-dom";
import styles from "./PracticalInfo.module.css";
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
          <Ico className={styles.icon} aria-hidden="true" />
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
