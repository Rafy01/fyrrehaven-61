import styles from "./HostsSection.module.css";
import type { Lang } from "../../lib/lang";

/* ---------- Ikoner (små inline SVG’er) ---------- */
const Ico = {
  Star: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  ),
  Bolt: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  Badge: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M12 2 3 6v6c0 5 3.7 9.4 9 10 5.3-.6 9-5 9-10V6l-9-4Zm0 16 4.2 2.2-1.1-4.7L19 12l-4.8-.4L12 7l-2.2 4.6L5 12l3.9 3.5-1.1 4.7L12 18Z" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm6.9 6h-3.3a15 15 0 0 0-1.7-3.9A8 8 0 0 1 18.9 8ZM9.1 4.1A15 15 0 0 0 7.4 8H4.1a8 8 0 0 1 5-3.9ZM4.1 16h3.3c.4 1.4 1 2.8 1.7 3.9A8 8 0 0 1 4.1 16Zm6 0H8.4a13 13 0 0 1-1-4c0-1.4.3-2.8 1-4h1.7a20 20 0 0 0 0 8Zm1.8 3.9c.7-1.1 1.3-2.5 1.7-3.9h3.3a8 8 0 0 1-5 3.9ZM15.6 12c0 1.4-.3 2.8-1 4h-2.3a18 18 0 0 1 0-8h2.3c.7 1.2 1 2.6 1 4Zm.8-4h3.3a8 8 0 0 1-2.9-3.9c-.7 1.1-1.3 2.5-1.7 3.9Z" />
    </svg>
  ),
};

export type Host = {
  id: string;
  name: string;
  photo?: string; // /hosts/rafy.webp (fallback til initialer)
  altDa?: string;
  altEn?: string;
  roleDa?: string; // fx “Vært”
  roleEn?: string; // “Host”
  bioDa: string;
  bioEn: string;
  facts: Array<
    | { kind: "response"; textDa: string; textEn: string }
    | { kind: "rating"; value: string } // fx "4.8+"
    | { kind: "years"; value: string } // fx "3+"
    | { kind: "lang"; textDa: string; textEn: string }
  >;
};

export type HostsSectionProps = {
  lang: Lang;
  titleDa?: string;
  titleEn?: string;
  subtitleDa?: string;
  subtitleEn?: string;
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
      roleDa: "Vært",
      roleEn: "Host",
      bioDa:
        "Jeg går op i hurtige svar og et gnidningsfrit ophold. Tip mig gerne om ønsker – alt fra barne­udstyr til sengetøj kan vi hjælpe med.",
      bioEn:
        "I care about fast replies and a smooth stay. Tell me your wishes — from baby gear to linens, we can help.",
      facts: [
        {
          kind: "response",
          textDa: "Lynhurtigt svar",
          textEn: "Lightning-fast replies",
        },
        { kind: "years", value: "3+" },
        { kind: "lang", textDa: "Dansk & Engelsk", textEn: "Danish & English" },
      ],
    },
    {
      id: "host-rimon",
      name: "Rimon",
      photo: "/hosts/rimon.webp",
      altDa: "Rimon – vært på Fyrrehaven 61",
      altEn: "Rimon – host at Fyrrehaven 61",
      roleDa: "Vært",
      roleEn: "Host",
      bioDa:
        "Vi hjælper med klargøring, vedligehold og lokale tips. Mangler I noget under opholdet, så siger I bare til.",
      bioEn:
        "We help with preparation, maintenance and local tips. Need anything during your stay? Just ask.",
      facts: [
        {
          kind: "response",
          textDa: "Svar samme dag",
          textEn: "Same-day replies",
        },
        { kind: "years", value: "3+" },
        {
          kind: "lang",
          textDa: "Arabisk, Dansk & Engelsk",
          textEn: "Arabic, Danish & English",
        },
      ],
    },
  ];
}

export default function HostsSection({
  lang,
  titleDa,
  titleEn,
  subtitleDa,
  subtitleEn,
  hosts,
}: HostsSectionProps) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const data = hosts ?? defaultHosts();

  return (
    <section className={styles.wrap} aria-label={t("Værter", "Hosts")}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {t(titleDa ?? "Mød værterne", titleEn ?? "Meet your hosts")}
        </h2>
        <p className={styles.subtitle}>
          {t(
            subtitleDa ??
              "Personlig hjælp før, under og efter opholdet – vi svarer hurtigt.",
            subtitleEn ??
              "Personal help before, during and after your stay — we reply quickly."
          )}
        </p>
      </header>

      <div className={styles.grid}>
        {data.map((h) => (
          <article key={h.id} className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.avatar} aria-hidden={!!h.photo}>
                {h.photo ? (
                  <img
                    src={h.photo}
                    className={styles.avatarImg}
                    alt={t(h.altDa ?? "", h.altEn ?? "")}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
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
                    {t(h.roleDa ?? "", h.roleEn ?? "")}
                  </div>
                )}
              </div>
            </div>

            <p className={styles.bio}>{t(h.bioDa, h.bioEn)}</p>

            <ul
              className={styles.facts}
              aria-label={t("Hurtige fakta", "Quick facts")}
            >
              {h.facts.map((f, i) => {
                if (f.kind === "response") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Bolt /> <span>{t(f.textDa, f.textEn)}</span>
                    </li>
                  );
                }
                if (f.kind === "rating") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Star /> <span>{f.value} ★</span>
                    </li>
                  );
                }
                if (f.kind === "years") {
                  return (
                    <li key={`f-${i}`} className={styles.chip}>
                      <Ico.Badge />{" "}
                      <span>
                        {t("Værtsår", "Years hosting")}: {f.value}
                      </span>
                    </li>
                  );
                }
                // lang
                return (
                  <li key={`f-${i}`} className={styles.chip}>
                    <Ico.Globe /> <span>{t(f.textDa, f.textEn)}</span>
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
