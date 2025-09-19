import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Box, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import styles from "./Hero.module.css";
import Buttons from "../Buttons";
import { useTranslation } from "react-i18next";
import { pathOf } from "../../lib/routes";
import { AIRBNB_URL } from "../../lib/links";
export default function Hero({ title, subtitle, badges = [], primaryCta, secondaryCta, layout = "media-right", mediaAspect = "4 / 3", media, dense = false, align = "left", lang, }) {
    const { i18n } = useTranslation();
    const currentLang = lang ?? (i18n.language?.toLowerCase().startsWith("da") ? "da" : "en");
    const rowClass = [
        styles.row,
        layout === "media-left" ? styles.mediaLeft : styles.mediaRight,
        align === "center" ? styles.center : "",
    ].join(" ");
    const frameStyle = { ["--aspect"]: mediaAspect };
    /** Renders en CTA ud fra HeroCTA (når du overstyrer via props) */
    const CustomCTA = ({ cta, variant, }) => {
        if (!cta)
            return null;
        if (cta.to) {
            return (_jsx(Buttons, { variant: variant, label: cta.label, to: cta.to, onClick: cta.onClick, disabled: cta.disabled }));
        }
        if (cta.href) {
            return (_jsx(Buttons, { variant: variant, label: cta.label, href: cta.href, external: cta.external, onClick: cta.onClick, disabled: cta.disabled }));
        }
        // Fald tilbage til ren knap uden navigation
        return (_jsx(Buttons, { variant: variant, label: cta.label, onClick: cta.onClick, disabled: cta.disabled }));
    };
    return (_jsx(Box, { asChild: true, children: _jsx("section", { className: [styles.wrapper, dense ? styles.dense : ""].join(" "), children: _jsx(Container, { size: "3", children: _jsxs("div", { className: rowClass, children: [_jsxs("div", { className: styles.copy, children: [badges.length > 0 && (_jsx(Flex, { wrap: "wrap", gap: "2", className: styles.badges, children: badges.map((b, i) => (_jsx(Badge, { variant: "soft", color: "gray", children: b }, i))) })), _jsx(Heading, { as: "h1", size: "8", trim: "both", children: title }), subtitle && (_jsx(Text, { size: "5", color: "gray", className: styles.subtitle, children: subtitle })), _jsx(Flex, { gap: "3", wrap: "wrap", className: styles.ctas, children: primaryCta || secondaryCta ? (_jsxs(_Fragment, { children: [_jsx(CustomCTA, { cta: primaryCta, variant: "primary" }), _jsx(CustomCTA, { cta: secondaryCta, variant: "secondary" })] })) : (_jsxs(_Fragment, { children: [_jsx(Buttons, { labelDa: "Book via Airbnb", labelEn: "Book on Airbnb", href: AIRBNB_URL, external: true }), _jsx(Buttons, { variant: "secondary", labelDa: "Se huset", labelEn: "See the house", to: pathOf(currentLang, "house") })] })) })] }), media?.src && (_jsx("figure", { className: styles.mediaBox, children: _jsx("div", { className: styles.mediaFrame, style: frameStyle, children: media.type === "video" ? (_jsx("video", { className: styles.mediaEl, src: media.src, poster: media.poster, autoPlay: media.autoPlay ?? false, muted: media.muted ?? true, loop: media.loop ?? false, playsInline: true, controls: !media.autoPlay, "aria-label": media.alt })) : (_jsx("img", { className: styles.mediaEl, src: media.src, alt: media.alt ?? "", title: media.title ?? "", loading: "eager" })) }) }))] }) }) }) }));
}
