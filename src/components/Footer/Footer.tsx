import { Link } from "react-router-dom";
import { Container, Box, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import styles from "./Footer.module.css";
import { useTranslation } from "react-i18next";
import * as CookieConsent from "vanilla-cookieconsent";
import { type Lang } from "../../lib/lang";
import { GUEST_PAGES, guestPathOf, pathOf } from "../../lib/routes";
import type { ResolvedAppearance } from "../../app/App";
import { FOOTER_ACCORDION_ICONS, SOCIAL_ICONS } from "../../lib/icons";

const LIGHT_LOGO_SRC = "/logo_trans.png";
const DARK_LOGO_SRC =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/logo_trans_white-scaled.png";
const LIGHT_SUPERHOST_SRC =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/superhost-1.webp";
const DARK_SUPERHOST_SRC =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2026/06/white-airbnb-superhost.png";

type MobileFooterSection = "explore" | "contact" | "practical";

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
  /** Om footeren vises i gæste-universet */
  guest?: boolean;
  resolvedAppearance?: ResolvedAppearance;
};

export default function Footer({
  lang,
  socials,
  showSuperhost = true,
  guest = false,
  resolvedAppearance = "light",
}: FooterProps) {
  const { t, i18n } = useTranslation("footer");
  const [openMobileSection, setOpenMobileSection] =
    useState<MobileFooterSection | null>(null);
  const toggleMobileSection = (section: MobileFooterSection) => {
    setOpenMobileSection((current) => (current === section ? null : section));
  };
  const currentLang: Lang = lang ??
    (i18n.language?.toLowerCase().startsWith("da")
      ? "da"
      : i18n.language?.toLowerCase().startsWith("de")
      ? "de"
      : "en");
  const year = new Date().getFullYear();
  const logoSrc = resolvedAppearance === "dark" ? DARK_LOGO_SRC : LIGHT_LOGO_SRC;
  const superhostSrc =
    resolvedAppearance === "dark" ? DARK_SUPERHOST_SRC : LIGHT_SUPERHOST_SRC;
  const superhostBadgeClass =
    resolvedAppearance === "dark"
      ? `${styles.superhostBadge} ${styles.superhostBadgeDark}`
      : styles.superhostBadge;

  const s = {
    instagram: socials?.instagram || "https://www.instagram.com/fyrrehaven61/",
    facebook: socials?.facebook || "https://www.facebook.com/fyrrehaven61",
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
                src={logoSrc}
                alt=""
                className={styles.logo}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className={styles.brandCopy}>
                <Text size="5" weight="bold">
                  Fjellerup Strand
                </Text>
                <div className={styles.tagline}>
                  <Text size="2" color="gray">
                    {t("tagline")}
                  </Text>
                </div>
                <div
                  className={styles.mobileSocials}
                  aria-label={t("socialAria")}
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
                      <SOCIAL_ICONS.Instagram aria-hidden="true" />
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
                      <SOCIAL_ICONS.Facebook aria-hidden="true" />
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
                      <SOCIAL_ICONS.TikTok aria-hidden="true" />
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
                      <SOCIAL_ICONS.YouTube aria-hidden="true" />
                    </a>
                  )}
                  {showSuperhost && (
                    <a
                      href="https://www.airbnb.dk/h/fyrrehaven-61"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.superhost} ${styles.mobileSuperhost}`}
                      aria-label={t("superhostAria")}
                    >
                      <img
                        className={superhostBadgeClass}
                        src={superhostSrc}
                        alt="Airbnb Superhost"
                      />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.topRight}>
              {showSuperhost && (
                <a
                  href="https://www.airbnb.dk/h/fyrrehaven-61"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.superhost} ${styles.desktopSuperhost}`}
                  aria-label={t("superhostAria")}
                >
                  <img
                    className={superhostBadgeClass}
                    src={superhostSrc}
                    alt="Airbnb Superhost"
                  />
                </a>
              )}
            </div>
          </div>

          {/* Link-sektioner */}
          <div className={styles.linksRow}>
            <nav className={styles.col} aria-label={t("sections.explore")}>
              <h3 className={styles.colTitle}>{t("sections.explore")}</h3>
              <ul className={styles.list}>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "house")}
                  >
                    {t("links.house")}
                  </Link>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "area")}
                  >
                    {t("links.area")}
                  </Link>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "gallery")}
                  >
                    {t("links.gallery")}
                  </Link>
                </li>
              </ul>
            </nav>

            <nav
              className={styles.col}
              aria-label={t("sections.contactBooking")}
            >
              <h3 className={styles.colTitle}>
                {t("sections.contactBooking")}
              </h3>
              <ul className={styles.list}>
                <li>
                  <a
                    className={styles.link}
                    href="https://www.airbnb.dk/h/fyrrehaven-61"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("links.bookAirbnb")}
                  </a>
                </li>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "contact")}
                  >
                    {t("links.contact")}
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className={styles.col} aria-label={t("sections.practical")}>
              <h3 className={styles.colTitle}>{t("sections.practical")}</h3>
              <ul className={styles.list}>
                <li>
                  <Link
                    className={styles.link}
                    to={pathOf(currentLang, "house")}
                  >
                    {t("links.houseRules")}
                  </Link>
                </li>
                {guest && (
                  <li>
                    <Link
                      className={styles.link}
                      to={guestPathOf(currentLang, "extraServices")}
                    >
                      {t("links.extraServices")}
                    </Link>
                  </li>
                )}
              </ul>
              <div
                className={styles.socials}
                aria-label={t("socialAria")}
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
                    <SOCIAL_ICONS.Instagram aria-hidden="true" />
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
                    <SOCIAL_ICONS.Facebook aria-hidden="true" />
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
                    <SOCIAL_ICONS.TikTok aria-hidden="true" />
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
                    <SOCIAL_ICONS.YouTube aria-hidden="true" />
                  </a>
                )}
              </div>
            </nav>
          </div>

          <div className={styles.mobileAccordion}>
            <section
              className={styles.mobileSection}
              data-open={openMobileSection === "explore" ? "true" : undefined}
            >
              <button
                type="button"
                className={styles.mobileSummary}
                aria-expanded={openMobileSection === "explore"}
                onClick={() => toggleMobileSection("explore")}
              >
                <span>{t("sections.explore")}</span>
                <FOOTER_ACCORDION_ICONS.Explore aria-hidden="true" />
              </button>
              <div
                className={styles.mobilePanel}
                aria-hidden={openMobileSection !== "explore"}
              >
                <div className={styles.mobilePanelInner}>
                  <ul className={styles.mobileList}>
                    <li>
                      <Link
                        className={styles.mobileLink}
                        to={pathOf(currentLang, "house")}
                      >
                        {t("links.house")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={styles.mobileLink}
                        to={pathOf(currentLang, "area")}
                      >
                        {t("links.area")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={styles.mobileLink}
                        to={pathOf(currentLang, "gallery")}
                      >
                        {t("links.gallery")}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section
              className={styles.mobileSection}
              data-open={openMobileSection === "contact" ? "true" : undefined}
            >
              <button
                type="button"
                className={styles.mobileSummary}
                aria-expanded={openMobileSection === "contact"}
                onClick={() => toggleMobileSection("contact")}
              >
                <span>{t("sections.contactBooking")}</span>
                <FOOTER_ACCORDION_ICONS.Contact aria-hidden="true" />
              </button>
              <div
                className={styles.mobilePanel}
                aria-hidden={openMobileSection !== "contact"}
              >
                <div className={styles.mobilePanelInner}>
                  <ul className={styles.mobileList}>
                    <li>
                      <a
                        className={styles.mobileLink}
                        href="https://www.airbnb.dk/h/fyrrehaven-61"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("links.bookAirbnb")}
                      </a>
                    </li>
                    <li>
                      <Link
                        className={styles.mobileLink}
                        to={pathOf(currentLang, "contact")}
                      >
                        {t("links.contact")}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section
              className={styles.mobileSection}
              data-open={
                openMobileSection === "practical" ? "true" : undefined
              }
            >
              <button
                type="button"
                className={styles.mobileSummary}
                aria-expanded={openMobileSection === "practical"}
                onClick={() => toggleMobileSection("practical")}
              >
                <span>{t("sections.practical")}</span>
                <FOOTER_ACCORDION_ICONS.Practical aria-hidden="true" />
              </button>
              <div
                className={styles.mobilePanel}
                aria-hidden={openMobileSection !== "practical"}
              >
                <div className={styles.mobilePanelInner}>
                  <ul className={styles.mobileList}>
                    <li>
                      <Link
                        className={styles.mobileLink}
                        to={pathOf(currentLang, "house")}
                      >
                        {t("links.houseRules")}
                      </Link>
                    </li>
                    {guest && (
                      <li>
                        <Link
                          className={styles.mobileLink}
                          to={guestPathOf(currentLang, "extraServices")}
                        >
                          {t("links.extraServices")}
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Bundlinje */}
          <div className={styles.bottomRow}>
            <Flex gap="2" wrap="wrap" align="center">
              <Text size="2" color="gray">
                © {year}{" "}
                <Link
                  to={`/guest/${currentLang}/${GUEST_PAGES.welcome[currentLang]}`}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                  }}
                  aria-label={t("guestPageAria")}
                >
                  Fyrrehaven 61
                </Link>
                .
              </Text>
              <Text size="2" color="gray">
                {t("rights")}
              </Text>
            </Flex>

            <ul className={styles.bottomLinks}>
              {/* Erstat # med rigtige ruter når klar */}
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "privacy")}
                >
                  {t("links.privacy")}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.bottomLinkButton}
                  onClick={() => CookieConsent.showPreferences()}
                >
                  {t("links.cookies")}
                </button>
              </li>
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "sitemap")}
                >
                  {t("links.sitemap")}
                </Link>
              </li>
              <li>
                <Link
                  className={styles.bottomLink}
                  to={pathOf(currentLang, "fees")}
                >
                  {t("links.fees")}
                </Link>
              </li>
            </ul>
          </div>
        </Container>
      </footer>
    </Box>
  );
}
