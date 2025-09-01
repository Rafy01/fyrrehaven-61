import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import styles from "./Header.module.css";

import { type Lang, saveLang } from "../../lib/lang";
import { pathOf, switchLangPath } from "../../lib/routes";
import Buttons from "../Buttons";

export default function Header({ lang }: { lang: Lang }) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll hide/show
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef<number>(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const idleTimer = useRef<number | null>(null);

  // Mobile menu
  const [open, setOpen] = useState(false);

  // Language dropdown (for trigger-anim)
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      setScrolled(y > 8);

      if (!open) {
        if (delta > 5 && y > 120) setHidden(true); // down => hide
        if (delta < -5) setHidden(false); // up   => show
      }
      lastY.current = y;

      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(
        () => setHidden(false),
        5000
      ) as unknown as number;
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

  // Nav links (ALTID unikke sprog-slugs via pathOf)
  const navItems = useMemo(() => {
    const t = (da: string, en: string) => (lang === "da" ? da : en);
    return [
      { to: pathOf(lang, "house"), label: t("Huset", "The House") },
      { to: pathOf(lang, "area"), label: t("Området", "Area") },
      { to: pathOf(lang, "gallery"), label: t("Galleri", "Gallery") },
      { to: pathOf(lang, "faq"), label: "FAQ" },
      { to: pathOf(lang, "contact"), label: t("Kontakt", "Contact") },
    ];
  }, [lang]);

  // Language switch (behold samme side, map slug korrekt)
  const switchLang = (next: Lang) => {
    if (next === lang) return;
    saveLang(next);
    const nextPath = switchLangPath(location.pathname, next);
    i18n.changeLanguage(next);
    navigate(nextPath);
    setOpen(false);
  };

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
        {/* Brand */}
        <Link
          to={pathOf(lang, "home")}
          className={styles.brand}
          aria-label="Fyrrehaven 61"
        >
          <img
            src="/logo_trans.png"
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Link>

        {/* Desktop nav */}
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

          <Buttons
            labelDa="Book nu"
            labelEn="Book now"
            href="https://www.airbnb.dk/h/fyrrehaven-61"
            external
          />

          {/* Language dropdown */}
          <DropdownMenu.Root open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className={styles.langTrigger}
                aria-label="Change language"
                data-state={
                  langOpen ? "open" : "closed"
                } /* ← til CSS animation */
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

        {/* Mobile/Tablet burger + panel */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              className={styles.menuBtn}
              aria-label={
                open
                  ? lang === "da"
                    ? "Luk menu"
                    : "Close menu"
                  : lang === "da"
                  ? "Åbn menu"
                  : "Open menu"
              }
              data-open={open}
            >
              <span className={styles.burger} aria-hidden="true" />
            </button>
          </Dialog.Trigger>

          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.panel} aria-label="Mobile menu">
            <div className={styles.panelHeader}>
              <Text weight="bold">{lang === "da" ? "Menu" : "Menu"}</Text>
              <button
                className={styles.closeBtn}
                aria-label={lang === "da" ? "Luk menu" : "Close menu"}
                onClick={() => setOpen(false)}
              >
                <Cross2Icon />
              </button>
            </div>

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
              <a
                href="https://www.airbnb.dk/h/fyrrehaven-61"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                <button className={styles.cta}>
                  {lang === "da" ? "Book" : "Book"}
                </button>
              </a>
              <div className={styles.langGroup}>
                <button
                  className={styles.langChip}
                  onClick={() => switchLang("da")}
                  aria-label="Switch to Danish"
                >
                  <span className={styles.flag}>🇩🇰</span> DA
                </button>
                <button
                  className={styles.langChip}
                  onClick={() => switchLang("en")}
                  aria-label="Switch to English"
                >
                  <span className={styles.flag}>🇬🇧</span> EN
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
}
