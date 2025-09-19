import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "./HostsSection.module.css";
/* ---------- Ikoner (små inline SVG’er) ---------- */
const Ico = {
    Star: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9L3.5 9.2l5.9-.9L12 3Z" }) })),
    Bolt: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z" }) })),
    Badge: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M12 2 3 6v6c0 5 3.7 9.4 9 10 5.3-.6 9-5 9-10V6l-9-4Zm0 16 4.2 2.2-1.1-4.7L19 12l-4.8-.4L12 7l-2.2 4.6L5 12l3.9 3.5-1.1 4.7L12 18Z" }) })),
    Globe: () => (_jsx("svg", { viewBox: "0 0 24 24", className: styles.icon, "aria-hidden": "true", children: _jsx("path", { d: "M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm6.9 6h-3.3a15 15 0 0 0-1.7-3.9A8 8 0 0 1 18.9 8ZM9.1 4.1A15 15 0 0 0 7.4 8H4.1a8 8 0 0 1 5-3.9ZM4.1 16h3.3c.4 1.4 1 2.8 1.7 3.9A8 8 0 0 1 4.1 16Zm6 0H8.4a13 13 0 0 1-1-4c0-1.4.3-2.8 1-4h1.7a20 20 0 0 0 0 8Zm1.8 3.9c.7-1.1 1.3-2.5 1.7-3.9h3.3a8 8 0 0 1-5 3.9ZM15.6 12c0 1.4-.3 2.8-1 4h-2.3a18 18 0 0 1 0-8h2.3c.7 1.2 1 2.6 1 4Zm.8-4h3.3a8 8 0 0 1-2.9-3.9c-.7 1.1-1.3 2.5-1.7 3.9Z" }) })),
};
function defaultHosts() {
    return [
        {
            id: "host-rafy",
            name: "Rafy",
            photo: "/hosts/rafy.webp",
            altDa: "Rafy – vært på Fyrrehaven 61",
            altEn: "Rafy – host at Fyrrehaven 61",
            roleDa: "Vært",
            roleEn: "Host",
            bioDa: "Jeg går op i hurtige svar og et gnidningsfrit ophold. Tip mig gerne om ønsker – alt fra barne­udstyr til sengetøj kan vi hjælpe med.",
            bioEn: "I care about fast replies and a smooth stay. Tell me your wishes — from baby gear to linens, we can help.",
            facts: [
                {
                    kind: "response",
                    textDa: "Lynhurtigt svar",
                    textEn: "Lightning-fast replies",
                },
                { kind: "years", value: "3+" },
                { kind: "lang", textDa: "Dansk & Engelsk", textEn: "Danish & English" },
            ],
        },
        {
            id: "host-rimon",
            name: "Rimon",
            photo: "/hosts/rimon.webp",
            altDa: "Rimon – vært på Fyrrehaven 61",
            altEn: "Rimon – host at Fyrrehaven 61",
            roleDa: "Vært",
            roleEn: "Host",
            bioDa: "Vi hjælper med klargøring, vedligehold og lokale tips. Mangler I noget under opholdet, så siger I bare til.",
            bioEn: "We help with preparation, maintenance and local tips. Need anything during your stay? Just ask.",
            facts: [
                {
                    kind: "response",
                    textDa: "Svar samme dag",
                    textEn: "Same-day replies",
                },
                { kind: "years", value: "3+" },
                {
                    kind: "lang",
                    textDa: "Arabisk, Dansk & Engelsk",
                    textEn: "Arabic, Danish & English",
                },
            ],
        },
    ];
}
export default function HostsSection({ lang, titleDa, titleEn, subtitleDa, subtitleEn, hosts, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    const data = hosts ?? defaultHosts();
    return (_jsxs("section", { className: styles.wrap, "aria-label": t("Værter", "Hosts"), children: [_jsxs("header", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: t(titleDa ?? "Mød værterne", titleEn ?? "Meet your hosts") }), _jsx("p", { className: styles.subtitle, children: t(subtitleDa ??
                            "Personlig hjælp før, under og efter opholdet – vi svarer hurtigt.", subtitleEn ??
                            "Personal help before, during and after your stay — we reply quickly.") })] }), _jsx("div", { className: styles.grid, children: data.map((h) => (_jsxs("article", { className: styles.card, children: [_jsxs("div", { className: styles.headerRow, children: [_jsx("div", { className: styles.avatar, "aria-hidden": !!h.photo, children: h.photo ? (_jsx("img", { src: h.photo, className: styles.avatarImg, alt: t(h.altDa ?? "", h.altEn ?? ""), onError: (e) => {
                                            e.currentTarget.style.display = "none";
                                        } })) : (_jsx("div", { className: styles.initials, children: h.name
                                            .split(" ")
                                            .map((p) => p[0]?.toUpperCase())
                                            .slice(0, 2)
                                            .join("") })) }), _jsxs("div", { className: styles.hmeta, children: [_jsx("div", { className: styles.hname, children: h.name }), (h.roleDa || h.roleEn) && (_jsx("div", { className: styles.hrole, children: t(h.roleDa ?? "", h.roleEn ?? "") }))] })] }), _jsx("p", { className: styles.bio, children: t(h.bioDa, h.bioEn) }), _jsx("ul", { className: styles.facts, "aria-label": t("Hurtige fakta", "Quick facts"), children: h.facts.map((f, i) => {
                                if (f.kind === "response") {
                                    return (_jsxs("li", { className: styles.chip, children: [_jsx(Ico.Bolt, {}), " ", _jsx("span", { children: t(f.textDa, f.textEn) })] }, `f-${i}`));
                                }
                                if (f.kind === "rating") {
                                    return (_jsxs("li", { className: styles.chip, children: [_jsx(Ico.Star, {}), " ", _jsxs("span", { children: [f.value, " \u2605"] })] }, `f-${i}`));
                                }
                                if (f.kind === "years") {
                                    return (_jsxs("li", { className: styles.chip, children: [_jsx(Ico.Badge, {}), " ", _jsxs("span", { children: [t("Værtsår", "Years hosting"), ": ", f.value] })] }, `f-${i}`));
                                }
                                // lang
                                return (_jsxs("li", { className: styles.chip, children: [_jsx(Ico.Globe, {}), " ", _jsx("span", { children: t(f.textDa, f.textEn) })] }, `f-${i}`));
                            }) })] }, h.id))) })] }));
}
