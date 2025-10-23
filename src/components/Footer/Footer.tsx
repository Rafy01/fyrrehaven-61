import { Link } from "react-router-dom";
import { Container, Box, Flex, Text } from "@radix-ui/themes";
import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";
import { pathOf } from "../../lib/routes";

export type FooterProps = {
  /** Valgfrit: giv sproget eksplicit. Ellers læses det fra i18n.language. */
  lang?: Lang;
  /** Eksterne social-links (skjules automatisk, hvis tomme). */
  socials?: Partial<{
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  }>;
  /** Vis Superhost-badge + link til Airbnb */
  showSuperhost?: boolean;
};

export default function Footer({
  lang,
  socials,
  showSuperhost = true,
}: FooterProps) {
  const { i18n } = useTranslation();
  const currentLang: Lang =
    lang ?? (i18n.language?.toLowerCase().startsWith("da") ? "da" : "en");
  const t = (da: string, en: string) => (currentLang === "da" ? da : en);
  const year = new Date().getFullYear();

  const s = {
    instagram: socials?.instagram || "https://www.instagram.com/fyrrehaven61/",
    facebook: socials?.facebook || "http://facebook.com/fyrrehaven61",
    tiktok: socials?.tiktok || "https://www.tiktok.com/@fyrrehaven61",
    youtube: socials?.youtube || "",
  };

  return (
    <Box asChild>
      <footer className={styles.wrapper}>
        <Container size="3">
          {/* Top: brand + superhost + social */}
          <div className={styles.topRow}>
            <div className={styles.brand}>
              <img
                src="/logo_trans.png"
                alt=""
                className={styles.logo}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <Text size="5" weight="bold">
                  Fjellerup Strand
                </Text>
                <div className={styles.tagline}>
                  <Text size="2" color="gray">
                    {t(
                      "Sommerhus ved skov og strand",
                      "Holiday home by forest & beach"
                    )}
                  </Text>
                </div>
              </div>
            </div>

            <div className={styles.topRight}>
              {showSuperhost && (
                <a
                  href="https://www.airbnb.dk/h/fyrrehaven-61"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.superhost}
                  aria-label={t(
                    "Se vores Airbnb-profil (Superhost)",
                    "See our Airbnb profile (Superhost)"
                  )}
                >
                  <img
                    className={styles.superhostBadge}
                    src="https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/superhost-1.webp"
                    alt="Airbnb Superhost"
                  />
                </a>
              )}
            </div>
          </div>

          {/* Link-sektioner */}
          <div className={styles.linksRow}>
            <nav className={styles.col} aria-label={t("Udforsk", "Explore")}>
              <h3 className={styles.colTitle}>{t("Udforsk", "Explore")}</h3>
              <ul className={styles.list}>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "house")}
                  >
                    {t("Sommerhuset", "The House")}
                  </Link>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "area")}
                  >
                    {t("Området", "Area")}
                  </Link>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "gallery")}
                  >
                    {t("Galleri", "Gallery")}
                  </Link>
                </li>
                <li>
                  <Link className={styles.link} to={pathOf(currentLang, "faq")}>
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>

            <nav
              className={styles.col}
              aria-label={t("Kontakt & booking", "Contact & booking")}
            >
              <h3 className={styles.colTitle}>
                {t("Kontakt & booking", "Contact & booking")}
              </h3>
              <ul className={styles.list}>
                <li>
                  <a
                    className={styles.link}
                    href="https://www.airbnb.dk/h/fyrrehaven-61"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Book via Airbnb", "Book on Airbnb")}
                  </a>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "contact")}
                  >
                    {t("Kontakt os", "Contact us")}
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className={styles.col} aria-label={t("Praktisk", "Practical")}>
              <h3 className={styles.colTitle}>{t("Praktisk", "Practical")}</h3>
              <ul className={styles.list}>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "house")}
                  >
                    {t("Husregler", "House rules")}
                  </Link>
                </li>
                <li>
                  <Link className={styles.link} to={pathOf(currentLang, "faq")}>
                    {t("Ofte stillede spørgsmål", "Frequently asked questions")}
                  </Link>
                </li>
              </ul>
              <div
                className={styles.socials}
                aria-label={t("Sociale medier", "Social media")}
              >
                {s.instagram && (
                  <a
                    href={s.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialBtn}
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    <InstaIcon />
                  </a>
                )}
                {s.facebook && (
                  <a
                    href={s.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialBtn}
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <FbIcon />
                  </a>
                )}
                {s.tiktok && (
                  <a
                    href={s.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialBtn}
                    aria-label="TikTok"
                    title="TikTok"
                  >
                    <TiktokIcon />
                  </a>
                )}
                {s.youtube && (
                  <a
                    href={s.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialBtn}
                    aria-label="YouTube"
                    title="YouTube"
                  >
                    <YoutubeIcon />
                  </a>
                )}
              </div>
            </nav>
          </div>

          {/* Bundlinje */}
          <div className={styles.bottomRow}>
            <Flex gap="2" wrap="wrap" align="center">
              <Text size="2" color="gray">
                © {year}{" "}
                <Link
                  to={`/guest/${currentLang}/${
                    currentLang === "da" ? "velkomst" : "welcome"
                  }`}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                  }}
                  aria-label="Gæsteside"
                >
                  Fyrrehaven 61
                </Link>
                .
              </Text>
              <Text size="2" color="gray">
                {t("Alle rettigheder forbeholdes.", "All rights reserved.")}
              </Text>
            </Flex>

            <ul className={styles.bottomLinks}>
              {/* Erstat # med rigtige ruter når klar */}
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "privacy")}
                >
                  {t("Privatliv", "Privacy")}
                </Link>
              </li>
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "cookies")}
                >
                  {t("Cookies", "Cookies")}
                </Link>
              </li>
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "sitemap")}
                >
                  {t("Sitemap", "Sitemap")}
                </Link>
              </li>
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "fees")}
                >
                  {t("Gebyr", "Fees")}
                </Link>
              </li>
            </ul>
          </div>
        </Container>
      </footer>
    </Box>
  );
}

/* ====== Ikoner (små, inline SVG’er) ====== */

function InstaIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM18 6.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"
      />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg
      width="35"
      height="35"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M13.5 9H16V6h-2.5C11.6 6 11 7.3 11 9v2H9v3h2v6h3v-6h2.1l.4-3H14v-1.7c0-.6.2-1.3 1-1.3z"
      />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M15 3c.6 2.3 2.2 3.9 4.4 4.4V10c-1.7 0-3.3-.6-4.4-1.6V15a6 6 0 11-6-6c.4 0 .8 0 1.2.1V11a3 3 0 103 3V3h1.4z"
      />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M23 12s0-3.4-.4-5a3 3 0 00-2.1-2.1C18.9 4.4 12 4.4 12 4.4s-6.9 0-8.5.5A3 3 0 001.4 7C1 8.6 1 12 1 12s0 3.4.4 5a3 3 0 002.1 2.1c1.6.5 8.5.5 8.5.5s6.9 0 8.5-.5A3 3 0 0022.6 17c.4-1.6.4-5 .4-5zM9.8 15.5v-7l6 3.5-6 3.5z"
      />
    </svg>
  );
}
