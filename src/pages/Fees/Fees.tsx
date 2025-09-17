import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import styles from "./Fees.module.css";
import { fees } from "../../data/fees";

export default function Fees({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  const path = pathOf(lang, "fees");
  const seoTitle = t(
    "Gebyrer & praktiske vilkår – Fyrrehaven 61",
    "Fees & house rules – Fyrrehaven 61"
  );
  const seoDescription = t(
    "Se vores opdaterede gebyroversigt for Fyrrehaven 61: regler for booking, rengøring, sen check-out og særlige situationer. El (4 kr./kWh) og vand (80 kr./m³) afregnes efter forbrug. Ingen fester/kæledyr. Pool åben 1/5–1/10.",
    "View the updated fee list for Fyrrehaven 61: booking rules, cleaning, late check-out and special cases. Electricity (4 DKK/kWh) and water (80 DKK/m³) are billed by usage. No parties or pets. Outdoor pool open May 1–Oct 1."
  );
  const seoKeywords =
    lang === "da"
      ? [
          "gebyrer sommerhus",
          "gebyroversigt",
          "rengøringsgebyr",
          "elforbrug pris",
          "vandforbrug pris",
          "sen check-out gebyr",
          "skader og erstatning",
          "Fyrrehaven 61 priser",
        ]
      : [
          "holiday home fees",
          "fee list",
          "cleaning fee",
          "electricity usage price",
          "water usage price",
          "late check-out fee",
          "damage and charges",
          "Fyrrehaven 61 prices",
        ];

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="/og-fees.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seoTitle,
          description: seoDescription,
          url: `https://fyrrehaven-61.dk${path}`,
        }}
        robots={{ index: true, follow: true, noarchive: true }}
        keywords={seoKeywords}
      />

      <Container size="3">
        <Box py="6" className={styles.page}>
          <Heading as="h1" size="8" mb="3">
            {t("Gebyrer", "Fees")}
          </Heading>
          <Text className={styles.lead} as="p">
            {t(
              "For at sikre den bedste oplevelse for alle gæster har vi samlet en oversigt over gebyrer, der kan blive relevante i særlige situationer.",
              "To ensure the best experience for all guests, we’ve listed fees that may apply in specific situations."
            )}
          </Text>

          <Separator my="5" size="4" />

          {/* Vigtig information for booking */}
          <section className={styles.section} aria-labelledby="info-h">
            <Heading id="info-h" as="h2" size="5" mb="2">
              {t(
                "Vigtig information for booking af sommerhuset",
                "Important information for booking the holiday home"
              )}
            </Heading>

            <div className={styles.badges} style={{ marginBottom: ".5rem" }}>
              <span className={styles.badge}>
                {t(
                  "Ingen udlejning til fester eller grupper under 25 år.",
                  "No rentals for parties or groups under 25 years."
                )}
              </span>
              <span className={styles.badge}>
                {t(
                  "Ingen kæledyr tilladt indendørs.",
                  "No pets allowed indoors."
                )}
              </span>
              <span className={styles.badge}>
                {t(
                  "Udendørspoolen åben 1. maj – 1. oktober.",
                  "Outdoor pool open May 1 – October 1."
                )}
              </span>
            </div>

            <div className={styles.hr} />

            <Text as="p" mb="1">
              <strong>
                {t(
                  "Forbrug afregnes efter opholdet",
                  "Consumption is settled after your stay"
                )}
              </strong>
            </Text>
            <ul>
              <li>
                {t(
                  "El- og vandforbrug ift. lejekontrakten.",
                  "Electricity and water consumption according to the rental agreement."
                )}
              </li>
              <li>
                {t(
                  "Er der bestilt ekstra service efter booking, vil dette bliver opkrævet.",
                  "If extra services are ordered after booking, these will be charged."
                )}
              </li>
            </ul>
          </section>

          <Separator my="5" size="4" />

          {/* Gebyrliste */}
          <section className={styles.section} aria-labelledby="fees-h">
            <Heading id="fees-h" as="h2" size="5" mb="2">
              {t("Gebyrliste", "Fee list")}
            </Heading>

            <div className={styles.grid} role="list">
              {fees.map((f) => {
                const title = t(f.titleDa, f.titleEn);
                const unit =
                  f.unitDa || f.unitEn ? t(f.unitDa ?? "", f.unitEn ?? "") : "";
                const note =
                  f.noteDa || f.noteEn ? t(f.noteDa ?? "", f.noteEn ?? "") : "";
                return (
                  <div className={styles.row} key={f.id} role="listitem">
                    <div className={styles.item}>
                      <div className={styles.title}>{title}</div>
                      {(unit || note) && (
                        <div className={styles.unit}>
                          {unit}
                          {unit && note ? " · " : ""}
                          {note && <span className={styles.note}>{note}</span>}
                        </div>
                      )}
                      <div className={styles.price}>
                        {f.amountDKK.toLocaleString(
                          lang === "da" ? "da-DK" : "en-GB"
                        )}{" "}
                        DKK
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator my="6" size="4" />

          <Text as="p" color="gray">
            {t(
              "Bemærk: Gebyrer kan opkræves, hvis vilkår ikke overholdes. Kontakt os ved spørgsmål.",
              "Note: Fees may be charged if terms are not met. Contact us if you have questions."
            )}
          </Text>
        </Box>
      </Container>
    </>
  );
}
