import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged, type User } from "firebase/auth";
import styles from "./Header.module.css";

import { type Lang, saveLang } from "../../lib/lang";
import { pathOf, switchLangPath, GUEST_PAGES } from "../../lib/routes";
import Buttons from "../Buttons";
import type { ResolvedAppearance } from "../../app/App";
import { UI_ICONS } from "../../lib/icons";
import { isPoolSeason } from "../../data/pricing";
import { getFirebaseAuth, isFirebaseClientConfigured } from "../../lib/firebase";

type Props = {
  lang: Lang;
  guest?: boolean;
  resolvedAppearance: ResolvedAppearance;
  onAppearanceChange: (preference: ResolvedAppearance) => void;
};

const LANGUAGE_OPTIONS: Array<{ code: Lang; flag: string; label: string }> = [
  { code: "da", flag: "🇩🇰", label: "Dansk" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

const LIGHT_LOGO_SRC = "/logo_trans.png";
const DARK_LOGO_SRC =
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/10/logo_trans_white-scaled.png";
const DRAG_START_DISTANCE = 18;
const DRAG_CLOSE_DISTANCE = 124;
const DRAG_CLOSE_VELOCITY = 0.85;
const MOUSE_DRAG_ID = -2;

export default function Header({
  lang,
  guest = false,
  resolvedAppearance,
  onAppearanceChange,
}: Props) {
  const { i18n } = useTranslation();
  const { t } = useTranslation("navigation");
  const location = useLocation();
  const navigate = useNavigate();

  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const idleTimer = useRef<number | null>(null);
  const menuOpenAnimationTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTrackingMenuDrag, setIsTrackingMenuDrag] = useState(false);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [isMenuAnimationSettled, setIsMenuAnimationSettled] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuDrag = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    offset: 0,
    moved: false,
  });

  useEffect(() => {
    if (!isFirebaseClientConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;

    return onAuthStateChanged(auth, (nextUser) => {
      setAdminUser(nextUser);
    });
  }, []);

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
    if (!open) {
      if (menuOpenAnimationTimer.current) {
        window.clearTimeout(menuOpenAnimationTimer.current);
        menuOpenAnimationTimer.current = null;
      }
      setIsMenuAnimationSettled(false);
      setDragOffset(0);
      setIsTrackingMenuDrag(false);
      setIsDraggingMenu(false);
      menuDrag.current.active = false;
      menuDrag.current.offset = 0;
      menuDrag.current.moved = false;
    }
  }, [open]);

  useEffect(() => {
    const resetTransientMenuState = () => {
      setOpen(false);
      setLangOpen(false);
      setDragOffset(0);
      setIsTrackingMenuDrag(false);
      setIsDraggingMenu(false);
      setIsMenuAnimationSettled(false);
      menuDrag.current.active = false;
      menuDrag.current.offset = 0;
      menuDrag.current.moved = false;

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        (activeElement === menuButtonRef.current ||
          activeElement === panelRef.current)
      ) {
        activeElement.blur();
      }
    };

    const onPageShow = () => {
      resetTransientMenuState();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    if (!open) return;

    setIsMenuAnimationSettled(false);
    menuOpenAnimationTimer.current = window.setTimeout(() => {
      setIsMenuAnimationSettled(true);
      menuOpenAnimationTimer.current = null;
    }, 460);

    return () => {
      if (menuOpenAnimationTimer.current) {
        window.clearTimeout(menuOpenAnimationTimer.current);
        menuOpenAnimationTimer.current = null;
      }
    };
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
      const items = [
        {
          to: `/guest/${lang}/${GUEST_PAGES.welcome[lang]}`,
          label: t("guest.welcome"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.manual[lang]}`,
          label: t("guest.manual"),
        },
        {
          to: `/guest/${lang}/${GUEST_PAGES.activityRoom[lang]}`,
          label: t("guest.activityRoom"),
        },
        ...(isPoolSeason(new Date())
          ? [
              {
                to: `/guest/${lang}/${GUEST_PAGES.pool[lang]}`,
                label: t("guest.pool"),
              },
            ]
          : []),
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
      return items;
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
  const isDark = resolvedAppearance === "dark";
  const ThemeActionIcon = isDark ? UI_ICONS.LightMode : UI_ICONS.DarkMode;
  const logoSrc = isDark ? DARK_LOGO_SRC : LIGHT_LOGO_SRC;
  const adminLabel = adminUser?.email || "Admin logged in";

  const changeAppearance = (next: ResolvedAppearance) => {
    onAppearanceChange(next);
  };

  const toggleAppearance = () => {
    changeAppearance(isDark ? "light" : "dark");
  };

  const updateMenuDrag = (clientY: number) => {
    const drag = menuDrag.current;
    if (!drag.active) return false;

    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    const deltaFromLast = clientY - drag.lastY;
    drag.velocity = deltaFromLast / elapsed;
    drag.lastY = clientY;
    drag.lastTime = now;

    const rawOffset = Math.max(0, clientY - drag.startY);
    const nextOffset =
      rawOffset <= DRAG_START_DISTANCE ? 0 : rawOffset - DRAG_START_DISTANCE;
    drag.offset = nextOffset;
    drag.moved = drag.moved || nextOffset > 0;
    if (nextOffset > 0) setIsDraggingMenu(true);
    setDragOffset(nextOffset);
    return nextOffset > 0 || drag.moved;
  };

  const endMenuDrag = () => {
    const drag = menuDrag.current;
    if (!drag.active) return;

    const shouldClose =
      drag.offset >= DRAG_CLOSE_DISTANCE ||
      (drag.velocity >= DRAG_CLOSE_VELOCITY && drag.offset > 56);

    drag.active = false;
    setIsTrackingMenuDrag(false);
    setIsDraggingMenu(false);

    if (shouldClose) {
      setOpen(false);
      return;
    }

    setDragOffset(0);
  };

  const cancelMenuDrag = () => {
    const drag = menuDrag.current;
    if (!drag.active) return;

    drag.active = false;
    setIsTrackingMenuDrag(false);
    setIsDraggingMenu(false);
    setDragOffset(0);
  };

  const beginMenuDrag = (
    pointerId: number,
    clientY: number,
    button: number,
    pointerType: string
  ) => {
    if (button !== 0 && pointerType === "mouse") return;
    if (menuDrag.current.active) return;
    const now = performance.now();
    menuDrag.current = {
      active: true,
      pointerId,
      startY: clientY,
      lastY: clientY,
      lastTime: now,
      velocity: 0,
      offset: 0,
      moved: false,
    };
    setIsTrackingMenuDrag(true);
    setIsDraggingMenu(false);
    setDragOffset(0);
  };

  const beginMenuDragFromReact = (event: ReactPointerEvent<HTMLElement>) => {
    beginMenuDrag(
      event.pointerId,
      event.clientY,
      event.button,
      event.pointerType
    );
  };

  const beginMenuMouseDragFromReact = (event: ReactMouseEvent<HTMLElement>) => {
    beginMenuDrag(MOUSE_DRAG_ID, event.clientY, event.button, "mouse");
  };

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const onPointerDown = (event: PointerEvent) => {
      beginMenuDrag(
        event.pointerId,
        event.clientY,
        event.button,
        event.pointerType
      );
    };
    const onMouseDown = (event: MouseEvent) => {
      beginMenuDrag(MOUSE_DRAG_ID, event.clientY, event.button, "mouse");
    };

    panel.addEventListener("pointerdown", onPointerDown, { capture: true });
    panel.addEventListener("mousedown", onMouseDown, { capture: true });
    return () => {
      panel.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      panel.removeEventListener("mousedown", onMouseDown, {
        capture: true,
      });
    };
  }, [open]);

  useEffect(() => {
    if (!isTrackingMenuDrag) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== menuDrag.current.pointerId) return;
      if (updateMenuDrag(event.clientY)) event.preventDefault();
    };
    const onMouseMove = (event: MouseEvent) => {
      if (menuDrag.current.pointerId !== MOUSE_DRAG_ID) return;
      if (updateMenuDrag(event.clientY)) event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== menuDrag.current.pointerId) return;
      endMenuDrag();
    };
    const onMouseUp = () => {
      if (menuDrag.current.pointerId !== MOUSE_DRAG_ID) return;
      endMenuDrag();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== menuDrag.current.pointerId) return;
      cancelMenuDrag();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isTrackingMenuDrag]);

  const closeFromMenuGrabber = () => {
    if (menuDrag.current.moved) {
      menuDrag.current.moved = false;
      return;
    }

    setOpen(false);
  };

  const preventMenuClickAfterDrag = (
    event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>
  ) => {
    if (!menuDrag.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    menuDrag.current.moved = false;
  };

  const dragProgress = Math.min(dragOffset, 140) / 140;
  const overlayOpacity = Math.max(0, 0.18 - dragProgress * 0.18);
  const overlayBlur = Math.max(0, 12 - dragProgress * 12);
  const menuDragStyle = {
    "--panel-drag-y": `${dragOffset}px`,
    "--menu-overlay-opacity": overlayOpacity,
    "--menu-overlay-blur": `${overlayBlur}px`,
  } as CSSProperties;

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
            src={logoSrc}
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

          {adminUser ? (
            <Link
              to="/admin"
              className={styles.adminShortcut}
              aria-label="Admin logged in. Go to admin page."
              title={adminLabel}
            >
              <UI_ICONS.Settings aria-hidden="true" />
              <span>Admin logged in</span>
            </Link>
          ) : null}

          <button
            type="button"
            className={styles.themeButton}
            aria-label={t("actions.toggleAppearance")}
            data-state={resolvedAppearance}
            onClick={toggleAppearance}
          >
            <ThemeActionIcon aria-hidden="true" />
          </button>

          <DropdownMenu.Root open={langOpen} onOpenChange={setLangOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={styles.langTrigger}
                aria-label={t("actions.changeLanguage")}
                data-state={langOpen ? "open" : "closed"}
              >
                <span className={styles.flag}>{flag}</span>
                <UI_ICONS.ChevronDown aria-hidden="true" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              sideOffset={6}
              align="end"
              className={styles.ddContent}
              data-theme={resolvedAppearance}
            >
              {LANGUAGE_OPTIONS.map((option) => {
                const isCurrent = option.code === lang;
                return (
                  <DropdownMenu.Item
                    key={option.code}
                    onSelect={() => switchLang(option.code)}
                    className={styles.ddItem}
                    aria-current={isCurrent ? "true" : undefined}
                    data-active={isCurrent ? "true" : undefined}
                    aria-label={
                      isCurrent
                        ? `${option.label}, ${t("actions.currentLanguage")}`
                        : option.label
                    }
                  >
                    <span className={styles.langOptionText}>
                      <span className={styles.langOptionFlag}>
                        {option.flag}
                      </span>
                      {option.label}
                    </span>
                  </DropdownMenu.Item>
                );
              })}
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
            ref={menuButtonRef}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.burger} aria-hidden="true" />
          </button>

          <Dialog.Portal>
            <Dialog.Overlay
              className={styles.overlay}
              style={menuDragStyle}
            />
            <Dialog.Content
              id="mobile-menu-panel"
              className={styles.panel}
              aria-label={t("menu.mobile")}
              data-dragging={isDraggingMenu ? "true" : undefined}
              data-settled={isMenuAnimationSettled ? "true" : undefined}
              style={menuDragStyle}
              ref={panelRef}
              onPointerDownCapture={beginMenuDragFromReact}
              onClickCapture={preventMenuClickAfterDrag}
            >
              <button
                type="button"
                className={styles.panelGrabber}
                aria-label={t("actions.closeMenu")}
                onClick={closeFromMenuGrabber}
              >
                <span aria-hidden="true" />
              </button>
              <Dialog.Title className={styles.srOnly}>
                {t("menu.title")}
              </Dialog.Title>
              <Dialog.Description className={styles.srOnly}>
                {t("menu.description")}
              </Dialog.Description>

              <nav
                className={styles.panelNav}
                onPointerDownCapture={beginMenuDragFromReact}
                onMouseDownCapture={beginMenuMouseDragFromReact}
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    draggable={false}
                    className={({ isActive }) =>
                      [styles.panelLink, isActive && styles.panelLinkActive]
                        .filter(Boolean)
                        .join(" ")
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.label}</span>
                    <UI_ICONS.ChevronForward aria-hidden="true" />
                  </NavLink>
                ))}
              </nav>

              <div
                className={styles.panelFooter}
                onPointerDownCapture={beginMenuDragFromReact}
                onMouseDownCapture={beginMenuMouseDragFromReact}
              >
                {adminUser ? (
                  <Link
                    to="/admin"
                    draggable={false}
                    className={styles.panelAdminShortcut}
                    aria-label="Admin logged in. Go to admin page."
                    onClick={() => setOpen(false)}
                  >
                    <UI_ICONS.Settings aria-hidden="true" />
                    <span>Admin logged in</span>
                    <UI_ICONS.ChevronForward aria-hidden="true" />
                  </Link>
                ) : null}

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
                <div className={styles.panelControls}>
                  <button
                    type="button"
                    className={styles.themeChip}
                    onClick={toggleAppearance}
                    aria-label={t("actions.toggleAppearance")}
                  >
                    <ThemeActionIcon aria-hidden="true" />
                    <span>{t(`appearance.${isDark ? "light" : "dark"}`)}</span>
                  </button>
                  <div className={styles.langGroup}>
                    {LANGUAGE_OPTIONS.map((option) => {
                      const isCurrent = option.code === lang;
                      return (
                        <button
                          type="button"
                          key={option.code}
                          className={styles.langChip}
                          onClick={() => switchLang(option.code)}
                          aria-current={isCurrent}
                          data-active={isCurrent ? "true" : undefined}
                          aria-label={
                            isCurrent
                              ? `${option.label}, ${t("actions.currentLanguage")}`
                              : option.label
                          }
                        >
                          <span aria-hidden="true">{option.flag}</span>
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
