import { Container, Box, Heading, Text, Separator } from "@radix-ui/themes";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";
import styles from "./Privacy.module.css";

export default function Privacy({ lang }: { lang: Lang }) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);

  // — Udfyld/tilpas disse ved behov —
  const CONTROLLER_NAME = "Fyrrehaven 61";
  const CONTROLLER_ADDR = t(
    "Fyrrehaven 61, 8585 Glesborg, Danmark",
    "Fyrrehaven 61, 8585 Glesborg, Denmark"
  );
  const CONTROLLER_EMAIL = "kontakt@fyrrehaven-61.dk";
  const CONTROLLER_PHONE = "-";

  // Navngiv jeres mailudbyder (Simply)
  const EMAIL_PROCESSOR_NAME = "Simply (e-mailudbyder)";
  const LAST_UPDATED_DA = "16. september 2025";
  const LAST_UPDATED_EN = "16 September 2025";

  const path = pathOf(lang, "privacy");
  const seoTitle = t(
    "Privatlivspolitik – Fyrrehaven 61 | GDPR & persondata",
    "Privacy Policy – Fyrrehaven 61 | GDPR & personal data"
  );
  const seoDescription = t(
    "Læs hvordan vi behandler personoplysninger ved kontakt og booking af Fyrrehaven 61. Vi lagrer henvendelser som e-mail hos Simply, sætter kun nødvendige cookies som udgangspunkt og respekterer dine GDPR-rettigheder.",
    "Learn how we process personal data when you contact us or book Fyrrehaven 61. We store enquiries as email with Simply, set only necessary cookies by default, and respect your GDPR rights."
  );
  const seoKeywords =
    lang === "da"
      ? [
          "privatlivspolitik",
          "GDPR",
          "persondata",
          "databehandling",
          "dataansvarlig",
          "databehandler",
          "GDPR rettigheder",
          "cookiepolitik",
          "booking personoplysninger",
          "Fyrrehaven 61 privatliv",
          "e-mail opbevaring",
          "Simply e-mailudbyder",
        ]
      : [
          "privacy policy",
          "GDPR",
          "personal data",
          "data processing",
          "data controller",
          "data processor",
          "GDPR rights",
          "cookie policy",
          "booking personal data",
          "Fyrrehaven 61 privacy",
          "email storage",
          "Simply email provider",
        ];

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seoTitle}
        description={seoDescription}
        ogImage="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seoTitle,
          description: seoDescription,
          url: `https://fyrrehaven-61.dk${path}`,
        }}
        robots={{ index: false, follow: true, noarchive: true }}
        keywords={seoKeywords}
      />

      <Container size="3">
        <Box py="6" className={styles.page}>
          <Heading as="h1" size="8" mb="3">
            {t("Privatlivspolitik", "Privacy Policy")}
          </Heading>
          <Text className={styles.lead} color="gray">
            {t(
              "Denne politik beskriver, hvordan vi som dataansvarlig behandler personoplysninger efter GDPR og dansk ret.",
              "This notice explains how, as the data controller, we process personal data under the GDPR and applicable Danish law."
            )}
          </Text>

          <Separator my="5" size="4" />

          {/* Data controller */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Dataansvarlig", "Data Controller")}
            </Heading>
            <Text as="p">
              <strong>{CONTROLLER_NAME}</strong>
              <br />
              {CONTROLLER_ADDR}
              <br />
              {t("E-mail", "Email")}: {CONTROLLER_EMAIL}
              <br />
              {t("Telefon", "Phone")}: {CONTROLLER_PHONE}
            </Text>
            <Text as="p" mt="2">
              {t(
                "Vi har ikke udpeget en databeskyttelsesrådgiver (DPO). Kontakt os på e-mailadressen ovenfor ved spørgsmål.",
                "We have not appointed a Data Protection Officer (DPO). Please contact us via the email above with any questions."
              )}
            </Text>
          </section>

          {/* Scope & sources */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Anvendelsesområde og datakilder",
                "Scope and sources of data"
              )}
            </Heading>
            <Text as="p">
              {t(
                "Politikken dækker vores hjemmeside, kontakt/booking via formularer og bestilling af ekstra services. Oplysninger stammer primært fra dig (formularer/kommunikation), fra din enhed (tekniske logs) og i nogle tilfælde fra tredjepartsplatforme (fx Airbnb).",
                "This notice covers our website, contacting/booking via forms and ordering extras. Data originate primarily from you (forms/communications), from your device (technical logs) and in some cases from third-party platforms (e.g. Airbnb)."
              )}
            </Text>
          </section>

          {/* Categories */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Kategorier af personoplysninger",
                "Categories of personal data"
              )}
            </Heading>
            <ul className={styles.list}>
              <li>
                <strong>{t("Kontaktoplysninger", "Contact details")}:</strong>{" "}
                {t(
                  "Navn, e-mail, telefon, land.",
                  "Name, email, phone, country."
                )}
              </li>
              <li>
                <strong>{t("Bookingdata", "Booking data")}:</strong>{" "}
                {t(
                  "Ankomst/afrejse, nætter, antal gæster (voksne/børn/babyer), formål med opholdet, accepterede gebyrer/priser.",
                  "Check-in/check-out, nights, number of guests (adults/children/babies), purpose of stay, accepted fees/prices."
                )}
              </li>
              <li>
                <strong>{t("Ekstra services", "Extra services")}:</strong>{" "}
                {t(
                  "Valgte ydelser og mængder (sengetøj, sengelinned, håndklæder, pakker, brænde m.v.).",
                  "Selected services and quantities (bedding, bed linen, towels, bundles, firewood, etc.)."
                )}
              </li>
              <li>
                <strong>{t("Kommunikation", "Communications")}:</strong>{" "}
                {t(
                  "Korrespondance med dig (fx e-mails).",
                  "Correspondence with you (e.g. emails)."
                )}
              </li>
              <li>
                <strong>{t("Tekniske data", "Technical data")}:</strong>{" "}
                {t(
                  "IP-adresse, tidsstempler, URL’er, enheds-/browseroplysninger og lignende basale logdata af sikkerhedsmæssige grunde.",
                  "IP address, timestamps, URLs, device/browser information and similar basic logs for security purposes."
                )}
              </li>
              <li>
                <strong>
                  {t("Særlige kategorier", "Special categories")}:
                </strong>{" "}
                {t(
                  "Vi behandler ikke følsomme oplysninger (art. 9).",
                  "We do not process special-category data (art. 9)."
                )}
              </li>
            </ul>
          </section>

          {/* Purposes & legal bases */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Formål og retsgrundlag", "Purposes and legal bases")}
            </Heading>
            <ul className={styles.list}>
              <li>
                <strong>
                  {t("Forespørgsler og booking", "Enquiries and booking")}:
                </strong>{" "}
                {t(
                  "Besvare henvendelser, forberede/indgå lejeaftale og levere ydelser (art. 6(1)(b)).",
                  "Respond to enquiries, take steps to enter into/perform a rental agreement and deliver services (art. 6(1)(b))."
                )}
              </li>
              <li>
                <strong>
                  {t("Regnskab og pligter", "Accounting and legal duties")}:
                </strong>{" "}
                {t(
                  "Overholdelse af lovkrav (art. 6(1)(c)).",
                  "Compliance with legal obligations (art. 6(1)(c))."
                )}
              </li>
              <li>
                <strong>
                  {t("Sikkerhed og drift", "Security and operations")}:
                </strong>{" "}
                {t(
                  "IT-sikkerhed, misbrugsforebyggelse, fejlsøgning (legitim interesse; art. 6(1)(f)).",
                  "IT security, abuse prevention, troubleshooting (legitimate interests; art. 6(1)(f))."
                )}
              </li>
              <li>
                <strong>{t("Markedsføring", "Marketing")}:</strong>{" "}
                {t(
                  "Kun med samtykke (art. 6(1)(a)).",
                  "Only with consent (art. 6(1)(a))."
                )}
              </li>
            </ul>
          </section>

          {/* Necessity */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Er oplysningerne nødvendige?",
                "Is provision of data required?"
              )}
            </Heading>
            <Text as="p">
              {t(
                "Når vi beder om oplysninger, er det for at kunne besvare din henvendelse eller indgå/administrere en booking. Uden oplysningerne kan vi muligvis ikke levere den ønskede service.",
                "Where we request information, it is to respond to your enquiry or to enter into/administer a booking. Without the information we may be unable to deliver the requested service."
              )}
            </Text>
          </section>

          {/* Recipients & transfers */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Modtagere og internationale overførsler",
                "Recipients and international transfers"
              )}
            </Heading>
            <Text as="p">
              {t(
                "Vi anvender betroede databehandlere til drift og kommunikation (fx hosting, e-mail og sikkerhed). De behandler kun data efter instruks og under passende databehandleraftaler. Ved eventuelle overførsler uden for EU/EØS anvendes gyldige overførselsgrundlag (typisk EU’s standardkontraktbestemmelser, SCC).",
                "We use trusted processors for operations and communications (e.g. hosting, email and security). They process data only on our instructions under appropriate data-processing agreements. Where data are transferred outside the EU/EEA we rely on valid transfer mechanisms (typically the EU Standard Contractual Clauses, SCCs)."
              )}
            </Text>
            <ul className={styles.list} style={{ marginTop: ".5rem" }}>
              <li>
                <strong>{t("E-mail", "Email")}:</strong>{" "}
                {t(
                  "Formularindsendelser leveres som e-mails til vores postkasse hos",
                  "Form submissions are delivered as emails to our mailbox with"
                )}{" "}
                {EMAIL_PROCESSOR_NAME}.
              </li>
              <li>
                <strong>
                  {t("Tredjepartsplatforme", "Third-party platforms")}:
                </strong>{" "}
                {t(
                  "Når du bruger links til fx Airbnb eller sociale medier, er disse selvstændigt dataansvarlige for deres behandling.",
                  "When you use links to e.g. Airbnb or social media, they act as independent controllers for their processing."
                )}
              </li>
            </ul>
          </section>

          {/* Storage LOCATION & ACCESS — NEW explicit email-only storage */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Opbevaring og adgang til oplysninger",
                "Storage and access to data"
              )}
            </Heading>
            <Text as="p">
              {t(
                "Vi opbevarer ikke dine oplysninger i en separat database. Alle oplysninger, du indsender via vores formularer, sendes og lagres som e-mail i vores postkasse hos Simply. Vi tilgår kun personoplysninger via vores e-mailklient/webmail hos Simply.",
                "We do not store your data in a separate database. All information you submit through our forms is sent and stored as email in our mailbox with Simply. We only access personal data via Simply’s email client/webmail."
              )}
            </Text>
            <Text as="p" mt="2">
              {t(
                "Transporten af e-mails sker som udgangspunkt via TLS, når modtagende server understøtter det.",
                "Email transmission generally uses TLS where supported by the receiving server."
              )}
            </Text>
          </section>

          {/* Retention */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Opbevaringsperioder", "Retention periods")}
            </Heading>
            <ul className={styles.list}>
              <li>
                {t(
                  "Henvendelser (i indbakken): normalt op til 12 måneder, medmindre korrespondancen indgår i en booking eller et retskrav.",
                  "Enquiries (in the inbox): normally up to 12 months, unless the correspondence forms part of a booking or legal claim."
                )}
              </li>
              <li>
                {t(
                  "Booking- og regnskabsdata i e-mail/vedhæftninger: som udgangspunkt 5 år af hensyn til bogføringsregler.",
                  "Booking and accounting data in email/attachments: generally 5 years for accounting rules."
                )}
              </li>
              <li>
                {t(
                  "Sikkerheds-/adgangslogs: typisk 6 måneder.",
                  "Security/access logs: typically 6 months."
                )}
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t(
                "Cookies og lignende teknologier",
                "Cookies and similar technologies"
              )}
            </Heading>
            <Text as="p">
              {t(
                "Vi bruger primært teknisk nødvendige cookies/lagring for at levere siden sikkert. Vi anvender ikke marketing- eller trackingteknologier uden dit samtykke. Hvis ikke-nødvendige cookies aktiveres, vises et samtykkebanner.",
                "We primarily use technically necessary cookies/storage to deliver the site securely. We do not use marketing or tracking technologies without your consent. If non-essential cookies are enabled, a consent banner will be shown."
              )}
            </Text>
          </section>

          {/* Rights */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Dine rettigheder", "Your rights")}
            </Heading>
            <ul className={styles.list}>
              <li>{t("Indsigt (art. 15)", "Access (art. 15)")}</li>
              <li>{t("Berigtigelse (art. 16)", "Rectification (art. 16)")}</li>
              <li>{t("Sletning (art. 17)", "Erasure (art. 17)")}</li>
              <li>{t("Begrænsning (art. 18)", "Restriction (art. 18)")}</li>
              <li>
                {t("Dataportabilitet (art. 20)", "Data portability (art. 20)")}
              </li>
              <li>
                {t("Indsigelse (art. 21)", "Object to processing (art. 21)")}
              </li>
              <li>
                {t(
                  "Tilbagekald samtykke (art. 7(3)) — påvirker ikke lovligheden før tilbagekaldelsen.",
                  "Withdraw consent (art. 7(3)) — without affecting lawfulness prior to withdrawal."
                )}
              </li>
            </ul>
            <Text as="p" mt="2">
              {t(
                "Skriv til os på ovenstående e-mail for at udøve dine rettigheder. Vi svarer som udgangspunkt inden 1 måned og kan bede om identifikation.",
                "Email us at the address above to exercise your rights. We normally respond within 1 month and may request identification."
              )}
            </Text>
            <Text as="p" mt="2">
              {t(
                "Du kan klage til Datatilsynet: www.datatilsynet.dk.",
                "You may lodge a complaint with the Danish Data Protection Agency: www.datatilsynet.dk."
              )}
            </Text>
          </section>

          {/* Automated decisions */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Automatiske afgørelser", "Automated decision-making")}
            </Heading>
            <Text as="p">
              {t(
                "Vi foretager ikke automatiske afgørelser eller profilering med retsvirkning eller tilsvarende betydelig påvirkning (art. 22).",
                "We do not carry out automated decision-making or profiling producing legal effects or similarly significant impacts (art. 22)."
              )}
            </Text>
          </section>

          {/* Changes */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Ændringer af denne politik", "Changes to this notice")}
            </Heading>
            <Text as="p">
              {t(
                "Vi opdaterer denne politik ved ændringer i behandlingen eller når lovgivningen kræver det. Væsentlige ændringer offentliggøres her.",
                "We update this notice when our processing changes or when required by law. Material changes will be announced here."
              )}
            </Text>
            <Text as="p" mt="1" color="gray">
              {t("Senest opdateret", "Last updated")}:{" "}
              {t(LAST_UPDATED_DA, LAST_UPDATED_EN)}
            </Text>
          </section>

          <Separator my="6" size="4" />

          {/* Contact */}
          <section className={styles.section}>
            <Heading as="h2" size="5" mb="2">
              {t("Kontakt", "Contact")}
            </Heading>
            <Text as="p">
              {t(
                "Har du spørgsmål til denne privatlivspolitik, er du velkommen til at kontakte os.",
                "If you have any questions about this privacy policy, please contact us."
              )}
            </Text>
            <Text as="p" mt="1">
              {CONTROLLER_EMAIL}
            </Text>
          </section>
        </Box>
      </Container>
    </>
  );
}
