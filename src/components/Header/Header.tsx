import { useEffect, useMemo, useRef, useState } from "react";
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
  const { t } = useTranslation("navigation");
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

    // Kun skjul/show header, hvis menu IKKE er åben
    if (!open) {
      if (delta > 5 && y > 120) setHidden(true);
      if (delta < -5) setHidden(false);
    }

    lastY.current = y;

    // Nulstil idle-timer
    if (idleTimer.current) window.clearTimeout(idleTimer.current);

    // Start kun idle-timer, hvis menuen er lukket
    if (!open) {
      idleTimer.current = window.setTimeout(() => {
        // Efter 5 sek. inaktivitet: vis header igen
        setHidden(false);
        // 👇 VIGTIGT: vi rører IKKE ved `setOpen` her
        // før var her: if (!open && window.innerWidth <= 1024) setOpen(true);
      }, 5000);
    }
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

  const navItems = useMemo(() => {
    if (guest) {
      return [
        {
          to: `/guest/${lang}/${GUEST_PAGES.welcome[lang]}`,
          label: t("guest.welcome"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.manual[lang]}`,
          label: t("guest.manual"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.pool[lang]}`,
          label: t("guest.pool"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.sauna[lang]}`,
          label: t("guest.sauna"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.spa[lang]}`,
          label: t("guest.spa"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.practicalInfo[lang]}`,
          label: t("guest.practicalInfo"),
        },
      ];
    }
    return [
      { to: pathOf(lang, "house"), label: t("public.house") },
      { to: pathOf(lang, "area"), label: t("public.area") },
      { to: pathOf(lang, "gallery"), label: t("public.gallery") },
      // { to: pathOf(lang, "faq"), label: "FAQ" },
      { to: pathOf(lang, "contact"), label: t("public.contact") },
    ];
  }, [lang, guest, t]);

  const flag = lang === "da" ? "🇩🇰" : lang === "de" ? "🇩🇪" : "🇬🇧";

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

        <nav
          className={`${styles.nav} ${styles.navPrimary}`}
          aria-label={t("menu.main")}
        >
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
              label={t("actions.bookNow")}
              to={pathOf(lang, "book")}
              buttonType="button"
            />
          )}

          <DropdownMenu.Root open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={styles.langTrigger}
                aria-label={t("actions.changeLanguage")}
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
                onSelect={() => switchLang("de")}
                className={styles.ddItem}
              >
                <span style={{ marginRight: 8 }}>🇩🇪</span> Deutsch
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
            aria-label={open ? t("actions.closeMenu") : t("actions.openMenu")}
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
            aria-label={t("menu.mobile")}
          >
            <Dialog.Title className={styles.srOnly}>
              {t("menu.title")}
            </Dialog.Title>
            <Dialog.Description className={styles.srOnly}>
              {t("menu.description")}
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
                  label={t("actions.book")}
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
                <button
                  type="button"
                  className={styles.langChip}
                  onClick={() => switchLang("de")}
                  aria-current={lang === "de"}
                >
                  🇩🇪 Deutsch
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
}
