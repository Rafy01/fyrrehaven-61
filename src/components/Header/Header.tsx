import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import styles from "./Header.module.css";

import { type Lang, saveLang } from "../../lib/lang";
import { pathOf, switchLangPath, GUEST_PAGES } from "../../lib/routes";
import Buttons from "../Buttons";

type Props = {
  lang: Lang;
  guest?: boolean;
};

export default function Header({ lang, guest = false }: Props) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const idleTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      setScrolled(y > 8);
      if (!open) {
        if (delta > 5 && y > 120) setHidden(true);
        if (delta < -5) setHidden(false);
      }
      lastY.current = y;
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        setHidden(false);
        if (!open && window.innerWidth <= 1024) {
          setOpen(true); // Åbn mobilmenu efter inaktivitet
        }
      }, 5000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [open]);

  useEffect(() => {
    if (open) setHidden(false);
  }, [open]);

  const switchLang = (next: Lang) => {
    if (next === lang) return;
    saveLang(next);
    const nextPath = switchLangPath(location.pathname, next);
    i18n.changeLanguage(next);
    navigate(nextPath);
    setOpen(false);
  };

  const t = useCallback(
    (da: string, en: string) => (lang === "da" ? da : en),
    [lang]
  );

  const navItems = useMemo(() => {
    if (guest) {
      return [
        {
          to: `/guest/${lang}/${GUEST_PAGES.welcome[lang]}`,
          label: t("Velkomst", "Welcome"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.manual[lang]}`,
          label: t("Manual", "Manual"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.pool[lang]}`,
          label: t("Pool", "Pool"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.sauna[lang]}`,
          label: t("Sauna", "Sauna"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.spa[lang]}`,
          label: t("Vildmarksbad", "Hot Tub"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.practicalInfo[lang]}`,
          label: t("Praktisk info", "Practical Info"),
        },
      ];
    }
    return [
      { to: pathOf(lang, "house"), label: t("Huset", "The House") },
      { to: pathOf(lang, "area"), label: t("Området", "Area") },
      { to: pathOf(lang, "gallery"), label: t("Galleri", "Gallery") },
      // { to: pathOf(lang, "faq"), label: "FAQ" },
      { to: pathOf(lang, "contact"), label: t("Kontakt", "Contact") },
    ];
  }, [lang, guest, t]);

  const flag = lang === "da" ? "🇩🇰" : "🇬🇧";

  return (
    <div
      className={[
        styles.wrapper,
        hidden ? styles.hidden : "",
        scrolled ? styles.scrolled : "",
      ].join(" ")}
    >
      <div className={styles.inner}>
        <Link
          to={pathOf(lang, "home")}
          className={styles.brand}
          aria-label="Fyrrehaven 61"
        >
          <img
            src="/logo_trans.png"
            alt="Fyrrehaven 61 - logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Link>

        <nav className={`${styles.nav} ${styles.navPrimary}`} aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [styles.link, isActive && styles.linkActive]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}

          {!guest && (
            <Buttons
              labelDa="Book nu"
              labelEn="Book now"
              to={pathOf(lang, "book")}
              buttonType="button"
            />
          )}

          <DropdownMenu.Root open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={styles.langTrigger}
                aria-label="Change language"
                data-state={langOpen ? "open" : "closed"}
              >
                <span className={styles.flag}>{flag}</span>
                <ChevronDownIcon />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              sideOffset={6}
              align="end"
              className={styles.ddContent}
            >
              <DropdownMenu.Item
                onSelect={() => switchLang("da")}
                className={styles.ddItem}
              >
                <span style={{ marginRight: 8 }}>🇩🇰</span> Dansk
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => switchLang("en")}
                className={styles.ddItem}
              >
                <span style={{ marginRight: 8 }}>🇬🇧</span> English
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </nav>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={open ? "Luk menu" : "Åbn menu"}
            aria-expanded={open}
            aria-controls="mobile-menu-panel"
            data-open={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.burger} aria-hidden="true" />
          </button>

          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content
            id="mobile-menu-panel"
            className={styles.panel}
            aria-label="Mobilmenu"
          >
            <Dialog.Title className={styles.srOnly}>Menu</Dialog.Title>
            <Dialog.Description className={styles.srOnly}>
              Hovednavigation for siden
            </Dialog.Description>

            <nav className={styles.panelNav}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [styles.panelLink, isActive && styles.panelLinkActive]
                      .filter(Boolean)
                      .join(" ")
                  }
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">›</span>
                </NavLink>
              ))}
            </nav>

            <div className={styles.panelFooter}>
              {!guest && (
                <Buttons
                  to={pathOf(lang, "book")}
                  onClick={() => setOpen(false)}
                  className={styles.ctaLink}
                  labelDa="Book"
                  labelEn="Book"
                  buttonType="button"
                  fullWidth
                />
              )}
              <div className={styles.langGroup}>
                <button
                  type="button"
                  className={styles.langChip}
                  onClick={() => switchLang("da")}
                  aria-current={lang === "da"}
                >
                  🇩🇰 Dansk
                </button>
                <button
                  type="button"
                  className={styles.langChip}
                  onClick={() => switchLang("en")}
                  aria-current={lang === "en"}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
}
