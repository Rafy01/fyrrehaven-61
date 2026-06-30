import styles from "./HostsSection.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
import { HOST_ICONS as Ico } from "../../lib/icons";
import LazyImage from "../LazyImage";

export type Host = {
  id: string;
  name: string;
  photo?: string; // /hosts/rafy.webp (fallback til initialer)
  altDa?: string;
  altEn?: string;
  altDe?: string;
  roleDa?: string; // fx “Vært”
  roleEn?: string; // “Host”
  roleDe?: string;
  bioDa: string;
  bioEn: string;
  bioDe?: string;
  facts: Array<
    | { kind: "response"; textDa: string; textEn: string; textDe?: string }
    | { kind: "rating"; value: string } // fx "4.8+"
    | { kind: "years"; value: string } // fx "3+"
    | { kind: "lang"; textDa: string; textEn: string; textDe?: string }
  >;
};

export type HostsSectionProps = {
  lang: Lang;
  titleDa?: string;
  titleEn?: string;
  titleDe?: string;
  subtitleDa?: string;
  subtitleEn?: string;
  subtitleDe?: string;
  hosts?: Host[];
  ctaAnchor?: string; // fx "#contact" – knap tilbage til kontakt
};

function defaultHosts(): Host[] {
  return [
    {
      id: "host-rafy",
      name: "Rafy",
      photo: "/hosts/rafy.webp",
      altDa: "Rafy – vært på Fyrrehaven 61",
      altEn: "Rafy – host at Fyrrehaven 61",
      altDe: "Rafy – Gastgeber bei Fyrrehaven 61",
      roleDa: "Vært",
      roleEn: "Host",
      roleDe: "Gastgeber",
      bioDa:
        "Jeg går op i hurtige svar og et gnidningsfrit ophold. Tip mig gerne om ønsker – alt fra barne­udstyr til sengetøj kan vi hjælpe med.",
      bioEn:
        "I care about fast replies and a smooth stay. Tell me your wishes — from baby gear to linens, we can help.",
      bioDe:
        "Mir sind schnelle Antworten und ein reibungsloser Aufenthalt wichtig. Schreiben Sie uns gerne Ihre Wünsche – von Babyausstattung bis Bettwäsche helfen wir weiter.",
      facts: [
        {
          kind: "response",
          textDa: "Lynhurtigt svar",
          textEn: "Lightning-fast replies",
          textDe: "Sehr schnelle Antworten",
        },
        { kind: "years", value: "3+" },
        { kind: "lang", textDa: "Dansk & Engelsk", textEn: "Danish & English", textDe: "Dänisch & Englisch" },
      ],
    },
    {
      id: "host-rimon",
      name: "Rimon",
      photo: "/hosts/rimon.webp",
      altDa: "Rimon – vært på Fyrrehaven 61",
      altEn: "Rimon – host at Fyrrehaven 61",
      altDe: "Rimon – Gastgeber bei Fyrrehaven 61",
      roleDa: "Vært",
      roleEn: "Host",
      roleDe: "Gastgeber",
      bioDa:
        "Vi hjælper med klargøring, vedligehold og lokale tips. Mangler I noget under opholdet, så siger I bare til.",
      bioEn:
        "We help with preparation, maintenance and local tips. Need anything during your stay? Just ask.",
      bioDe:
        "Wir helfen bei Vorbereitung, Wartung und lokalen Tipps. Wenn während des Aufenthalts etwas fehlt, sagen Sie einfach Bescheid.",
      facts: [
        {
          kind: "response",
          textDa: "Svar samme dag",
          textEn: "Same-day replies",
          textDe: "Antwort am selben Tag",
        },
        { kind: "years", value: "3+" },
        {
          kind: "lang",
          textDa: "Arabisk, Dansk & Engelsk",
          textEn: "Arabic, Danish & English",
          textDe: "Arabisch, Dänisch & Englisch",
        },
      ],
    },
  ];
}

export default function HostsSection({
  lang,
  titleDa,
  titleEn,
  titleDe,
  subtitleDa,
  subtitleEn,
  subtitleDe,
  hosts,
}: HostsSectionProps) {
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);
  const data = hosts ?? defaultHosts();

  return (
    <section className={styles.wrap} aria-label={t("Værter", "Hosts", "Gastgeber")}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {t(titleDa ?? "Mød værterne", titleEn ?? "Meet your hosts", titleDe ?? "Lernen Sie die Gastgeber kennen")}
        </h2>
        <p className={styles.subtitle}>
          {t(
            subtitleDa ??
              "Personlig hjælp før, under og efter opholdet – vi svarer hurtigt.",
            subtitleEn ??
              "Personal help before, during and after your stay — we reply quickly.",
            subtitleDe ??
              "Persönliche Hilfe vor, während und nach Ihrem Aufenthalt – wir antworten schnell."
          )}
        </p>
      </header>

      <div className={styles.grid}>
        {data.map((h) => (
          <article key={h.id} className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.avatar} aria-hidden={!!h.photo}>
                {h.photo ? (
                  <LazyImage
                    src={h.photo}
                    className={styles.avatarImg}
                    alt={t(h.altDa ?? "", h.altEn ?? "", h.altDe ?? h.altEn ?? "")}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.initials}>
                    {h.name
                      .split(" ")
                      .map((p) => p[0]?.toUpperCase())
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>
              <div className={styles.hmeta}>
                <div className={styles.hname}>{h.name}</div>
                {(h.roleDa || h.roleEn) && (
                  <div className={styles.hrole}>
                    {t(h.roleDa ?? "", h.roleEn ?? "", h.roleDe ?? h.roleEn ?? "")}
                  </div>
                )}
              </div>
            </div>

            <p className={styles.bio}>{t(h.bioDa, h.bioEn, h.bioDe ?? h.bioEn)}</p>

            <ul
              className={styles.facts}
              aria-label={t("Hurtige fakta", "Quick facts", "Kurzinfos")}
            >
              {h.facts.map((f, i) => {
                if (f.kind === "response") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Bolt className={styles.icon} aria-hidden="true" /> <span>{t(f.textDa, f.textEn, f.textDe ?? f.textEn)}</span>
                    </li>
                  );
                }
                if (f.kind === "rating") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Star className={styles.icon} aria-hidden="true" /> <span>{f.value} ★</span>
                    </li>
                  );
                }
                if (f.kind === "years") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Badge className={styles.icon} aria-hidden="true" />{" "}
                      <span>
                        {t("Værtsår", "Years hosting", "Jahre als Gastgeber")}: {f.value}
                      </span>
                    </li>
                  );
                }
                // lang
                return (
                  <li key={`f-${i}`} className={styles.chip}>
                    <Ico.Globe className={styles.icon} aria-hidden="true" /> <span>{t(f.textDa, f.textEn, f.textDe ?? f.textEn)}</span>
                  </li>
                );
              })}
            </ul>

            
          </article>
        ))}
      </div>
    </section>
  );
}
