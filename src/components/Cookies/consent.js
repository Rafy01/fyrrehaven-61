const COOKIE_NAME = "fh61_consent";
const COOKIE_DAYS = 180;
const VERSION = 2; // ↑ bumpet pga. ændringer i format/semantik
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie =
        `${name}=${encodeURIComponent(value)}; ` +
            `expires=${d.toUTCString()}; path=/; SameSite=Lax` +
            (secure ? "; Secure" : "");
}
function getCookie(name) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
}
export function defaultConsent(lang) {
    return {
        v: VERSION,
        ts: new Date().toISOString(),
        lang,
        categories: { necessary: true, analytics: false, marketing: false },
    };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function readConsent(_lang) {
    try {
        const raw = getCookie(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (parsed.v !== VERSION)
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function writeConsent(next) {
    const str = JSON.stringify(next);
    setCookie(COOKIE_NAME, str, COOKIE_DAYS);
    try {
        localStorage.setItem(COOKIE_NAME, str);
    }
    catch {
        /* ignore */
    }
    // globalt snapshot til andre scripts (fx GA init)
    try {
        window.fh61Consent = () => next.categories;
    }
    catch {
        // intentionally ignored
    }
    // emit event så andre kan reagere (fx GA Consent Mode)
    window.dispatchEvent(new CustomEvent("fh61:consentchange", { detail: next }));
}
export function updateConsent(partial, lang) {
    const current = readConsent(lang) ?? defaultConsent(lang);
    const next = {
        ...current,
        ts: new Date().toISOString(),
        lang,
        categories: { ...current.categories, ...partial, necessary: true },
    };
    writeConsent(next);
    return next;
}
export function allowed(cat, lang) {
    const c = readConsent(lang);
    if (!c)
        return cat === "necessary"; // før valg: kun nødvendige
    return !!c.categories[cat];
}
/** Aktiver alle <script type="text/plain" data-category="..."> ift. samtykke. */
export function enableScriptsForConsent(lang) {
    const c = readConsent(lang) ?? defaultConsent(lang);
    const nodes = Array.from(document.querySelectorAll('script[type="text/plain"][data-category]:not([data-activated])'));
    for (const node of nodes) {
        const cat = String(node.dataset.category || "").toLowerCase();
        // nødvendige kører altid; analytics/marketing afhænger af valg
        const ok = cat === "necessary" ||
            (cat === "analytics" && c.categories.analytics) ||
            (cat === "marketing" && c.categories.marketing);
        if (!ok)
            continue;
        // erstat "falsk" script-tag med et rigtigt <script>
        const real = document.createElement("script");
        real.setAttribute("data-activated", "true");
        // kopier attributter (undtagen type/data-src/data-category)
        for (const { name, value } of Array.from(node.attributes)) {
            if (name === "type" || name === "data-src" || name === "data-category")
                continue;
            real.setAttribute(name, value);
        }
        const dataSrc = node.getAttribute("data-src");
        if (dataSrc) {
            real.src = dataSrc;
            real.async = true;
        }
        else if (node.textContent && node.textContent.trim()) {
            real.text = node.textContent;
        }
        node.insertAdjacentElement("afterend", real);
        node.setAttribute("data-activated", "true");
    }
}
