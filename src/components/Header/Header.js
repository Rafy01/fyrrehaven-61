import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import styles from "./Header.module.css";
import { saveLang } from "../../lib/lang";
import { pathOf, switchLangPath } from "../../lib/routes";
import Buttons from "../Buttons";
export default function Header({ lang }) {
    const { i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    // Scroll hide/show
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
    const idleTimer = useRef(null);
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
                if (delta > 5 && y > 120)
                    setHidden(true); // down => hide
                if (delta < -5)
                    setHidden(false); // up   => show
            }
            lastY.current = y;
            if (idleTimer.current)
                window.clearTimeout(idleTimer.current);
            idleTimer.current = window.setTimeout(() => setHidden(false), 5000);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (idleTimer.current)
                window.clearTimeout(idleTimer.current);
        };
    }, [open]);
    useEffect(() => {
        if (open)
            setHidden(false);
    }, [open]);
    // Nav links (ALTID unikke sprog-slugs via pathOf)
    const navItems = useMemo(() => {
        const t = (da, en) => (lang === "da" ? da : en);
        return [
            { to: pathOf(lang, "house"), label: t("Huset", "The House") },
            { to: pathOf(lang, "area"), label: t("Området", "Area") },
            { to: pathOf(lang, "gallery"), label: t("Galleri", "Gallery") },
            { to: pathOf(lang, "faq"), label: "FAQ" },
            { to: pathOf(lang, "contact"), label: t("Kontakt", "Contact") },
        ];
    }, [lang]);
    // Language switch (behold samme side, map slug korrekt)
    const switchLang = (next) => {
        if (next === lang)
            return;
        saveLang(next);
        const nextPath = switchLangPath(location.pathname, next);
        i18n.changeLanguage(next);
        navigate(nextPath);
        setOpen(false);
    };
    const flag = lang === "da" ? "🇩🇰" : "🇬🇧";
    return (_jsx("div", { className: [
            styles.wrapper,
            hidden ? styles.hidden : "",
            scrolled ? styles.scrolled : "",
        ].join(" "), children: _jsxs("div", { className: styles.inner, children: [_jsx(Link, { to: pathOf(lang, "home"), className: styles.brand, "aria-label": "Fyrrehaven 61", children: _jsx("img", { src: "/logo_trans.png", alt: "Fyrrehaven 61 - logo", onError: (e) => {
                            e.currentTarget.style.display = "none";
                        } }) }), _jsxs("nav", { className: `${styles.nav} ${styles.navPrimary}`, "aria-label": "Main", children: [navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => [styles.link, isActive && styles.linkActive]
                                .filter(Boolean)
                                .join(" "), children: item.label }, item.to))), _jsx(Buttons, { labelDa: "Book nu", labelEn: "Book now", to: pathOf(lang, "book"), buttonType: "button" }), _jsxs(DropdownMenu.Root, { open: langOpen, onOpenChange: setLangOpen, children: [_jsx(DropdownMenu.Trigger, { asChild: true, children: _jsxs("button", { type: "button", className: styles.langTrigger, "aria-label": "Change language", "data-state": langOpen ? "open" : "closed", children: [_jsx("span", { className: styles.flag, children: flag }), _jsx(ChevronDownIcon, {})] }) }), _jsxs(DropdownMenu.Content, { sideOffset: 6, align: "end", className: styles.ddContent, children: [_jsxs(DropdownMenu.Item, { onSelect: () => switchLang("da"), className: styles.ddItem, children: [_jsx("span", { style: { marginRight: 8 }, children: "\uD83C\uDDE9\uD83C\uDDF0" }), " Dansk"] }), _jsxs(DropdownMenu.Item, { onSelect: () => switchLang("en"), className: styles.ddItem, children: [_jsx("span", { style: { marginRight: 8 }, children: "\uD83C\uDDEC\uD83C\uDDE7" }), " English"] })] })] })] }), _jsxs(Dialog.Root, { open: open, onOpenChange: setOpen, children: [_jsx("button", { type: "button", className: styles.menuBtn, "aria-label": open
                                ? lang === "da"
                                    ? "Luk menu"
                                    : "Close menu"
                                : lang === "da"
                                    ? "Åbn menu"
                                    : "Open menu", "aria-expanded": open, "aria-controls": "mobile-menu-panel", "data-open": open, onClick: () => setOpen((v) => !v), children: _jsx("span", { className: styles.burger, "aria-hidden": "true" }) }), _jsx(Dialog.Overlay, { className: styles.overlay }), _jsxs(Dialog.Content, { id: "mobile-menu-panel", className: styles.panel, "aria-label": lang === "da" ? "Mobilmenu" : "Mobile menu", children: [_jsx(Dialog.Title, { className: styles.srOnly, children: lang === "da" ? "Menu" : "Menu" }), _jsx(Dialog.Description, { className: styles.srOnly, children: lang === "da"
                                        ? "Hovednavigation for siden"
                                        : "Main navigation for the site" }), _jsx("nav", { className: styles.panelNav, children: navItems.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => [styles.panelLink, isActive && styles.panelLinkActive]
                                            .filter(Boolean)
                                            .join(" "), onClick: () => setOpen(false), children: [_jsx("span", { children: item.label }), _jsx("span", { "aria-hidden": "true", children: "\u203A" })] }, item.to))) }), _jsxs("div", { className: styles.panelFooter, children: [_jsx(Buttons, { to: pathOf(lang, "book"), onClick: () => setOpen(false), className: styles.ctaLink, labelDa: "Book", labelEn: "Book", buttonType: "button", fullWidth: true }), _jsxs("div", { className: styles.langGroup, children: [_jsxs("button", { type: "button", className: styles.langChip, onClick: () => switchLang("da"), "aria-label": "Switch to Danish", children: [_jsx("span", { className: styles.flag, children: "\uD83C\uDDE9\uD83C\uDDF0" }), " DA"] }), _jsxs("button", { type: "button", className: styles.langChip, onClick: () => switchLang("en"), "aria-label": "Switch to English", children: [_jsx("span", { className: styles.flag, children: "\uD83C\uDDEC\uD83C\uDDE7" }), " EN"] })] })] })] })] })] }) }));
}
