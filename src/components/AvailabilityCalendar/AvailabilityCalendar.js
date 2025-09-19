import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/AvailabilityCalendar/AvailabilityCalendar.tsx
import React from "react";
import styles from "./AvailabilityCalendar.module.css";
import { getPriceForDate, getMinNightsForStart } from "../../data/pricing";
/* ─── Date utils ─── */
function rangeIsFree(start, endExclusive, bookedDays) {
    if (endExclusive <= start)
        return false;
    for (let d = startOfDay(start); d < endExclusive; d = addDays(d, 1)) {
        const ymd = d.toISOString().slice(0, 10);
        if (bookedDays.has(ymd))
            return false;
    }
    return true;
}
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function daysBetween(a, b) {
    const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
    return Math.round(ms / 86400000);
}
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function clampDate(x, lo, hi) {
    if (x < lo)
        return lo;
    if (x > hi)
        return hi;
    return x;
}
function startOfWeek(d, weekStartsOn) {
    const sd = startOfDay(d);
    const w = sd.getDay();
    const diff = (w - weekStartsOn + 7) % 7;
    return addDays(sd, -diff);
}
function formatMonthTitle(d, lang) {
    return d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
        month: "long",
        year: "numeric",
    });
}
/** ISO-uge (mandag som uge-start) */
function getISOWeek(d) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const diffDays = Math.floor((dt.getTime() - yearStart.getTime()) / 86400000) + 1;
    return Math.ceil(diffDays / 7);
}
/** Iterér dag-for-dag [start, endExclusive) */
function eachDay(start, endExclusive) {
    const out = [];
    let d = startOfDay(start);
    const end = startOfDay(endExclusive);
    while (d < end) {
        out.push(d);
        d = addDays(d, 1);
    }
    return out;
}
/* ─── API → bookings ─── */
function looksLikeBooking(ev) {
    const t = ev.title.toLowerCase();
    const positive = t.includes("airbnb") ||
        t.includes("dancenter") ||
        t.includes("campaya") ||
        t.includes("sol og strand") ||
        t.includes("udlejning") ||
        t.includes("privat") ||
        t.includes("reserved") ||
        t.includes("not available");
    if (!positive)
        return false;
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    const durMs = end.getTime() - start.getTime();
    if (!ev.allDay && durMs < 20 * 3600 * 1000)
        return false;
    const neg = t.includes("rengøring") ||
        t.includes("rengoring") ||
        t.includes("møde") ||
        t.includes("meeting") ||
        t.includes("fotograf") ||
        t.includes("levering");
    return !neg;
}
function toBooking(ev) {
    const s = startOfDay(new Date(ev.start));
    const e = startOfDay(new Date(ev.end)); // exclusive
    return { id: ev.id, startDay: s, endDay: e };
}
function normalizeBookingsFromApi(payload) {
    if (!("ok" in payload) || !payload.ok)
        return [];
    const bs = [];
    for (const ev of payload.events ?? []) {
        if (!looksLikeBooking(ev))
            continue;
        const b = toBooking(ev);
        if (b.endDay > b.startDay)
            bs.push(b);
    }
    bs.sort((a, b) => a.startDay.getTime() - b.startDay.getTime());
    return bs;
}
const ICAL_PROMISE = new Map();
async function loadIcal(apiPath) {
    let p = ICAL_PROMISE.get(apiPath);
    if (!p) {
        p = (async () => {
            try {
                const res = await fetch(apiPath, { method: "GET" });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                // Prøv JSON først – hvis det fejler, læs tekst og kast en pæn fejl
                let json = null;
                try {
                    json = (await res.json());
                }
                catch {
                    const txt = await res.text();
                    throw new Error(`Ugyldigt JSON-svar fra ${apiPath}. Første bytes: ${txt.slice(0, 80)}`);
                }
                const norm = normalizeBookingsFromApi(json);
                if (norm.length === 0) {
                    return { data: [], error: "Ingen kalenderdata fundet." };
                }
                return { data: norm, error: null };
            }
            catch (err) {
                return {
                    data: [],
                    error: err instanceof Error
                        ? err.message
                        : "Kunne ikke hente kalenderdata.",
                };
            }
        })();
        ICAL_PROMISE.set(apiPath, p);
    }
    return p;
}
export default function AvailabilityCalendar({ lang, apiPath = "/api/ical", weekStartsOn = 1, selectionMode = "range", disablePastSelection = true, onSelectionChange, onSelectionPrice, weekNumberColWidth = 15, }) {
    const t = (da, en) => (lang === "da" ? da : en);
    // Stabil "today"
    const todayRef = React.useRef(startOfDay(new Date()));
    const today = todayRef.current;
    const minMonth = startOfMonth(today);
    const WEEKS = 5;
    const WEEKNUM_COL = weekNumberColWidth;
    const weekColTemplate = `minmax(${WEEKNUM_COL}px, ${WEEKNUM_COL}px) repeat(7, 1fr)`;
    const [monthBase, setMonthBase] = React.useState(minMonth);
    const gridStart = React.useMemo(() => startOfWeek(startOfMonth(monthBase), weekStartsOn), [monthBase, weekStartsOn]);
    const [bookings, setBookings] = React.useState(null);
    const [error, setError] = React.useState(null);
    // --- Selection state ---
    const [sel, setSel] = React.useState(null);
    // --- NY: lokal valideringsfejl for min. nætter ---
    const [validationError, setValidationError] = React.useState(null);
    const emitSelection = React.useCallback((next) => {
        setSel(next);
        onSelectionChange?.(next);
    }, [onSelectionChange]);
    // Hold altid seneste onSelectionPrice i en ref (for at undgå render-loop)
    const onPriceRef = React.useRef(undefined);
    React.useEffect(() => {
        onPriceRef.current = onSelectionPrice;
    }, [onSelectionPrice]);
    // Hent iCal KUN én gang pr. apiPath (også i StrictMode)
    React.useEffect(() => {
        let mounted = true;
        setError(null);
        setBookings(null);
        loadIcal(apiPath).then(({ data, error }) => {
            if (!mounted)
                return;
            const filtered = data.filter((b) => b.endDay >= today);
            setBookings(filtered);
            if (error)
                setError(error);
        });
        return () => {
            mounted = false;
        };
    }, [apiPath, today]);
    const canPrev = React.useMemo(() => {
        return startOfMonth(monthBase).getTime() > startOfMonth(minMonth).getTime();
    }, [monthBase, minMonth]);
    function prevMonth() {
        if (!canPrev)
            return;
        setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
    function nextMonth() {
        setMonthBase((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
    // cells (5 uger)
    const weekStarts = React.useMemo(() => Array.from({ length: WEEKS }, (_, r) => addDays(gridStart, r * 7)), [gridStart]);
    const cells = React.useMemo(() => weekStarts.map((ws) => Array.from({ length: 7 }, (_, i) => addDays(ws, i))), [weekStarts]);
    // booking segments
    const segments = React.useMemo(() => {
        if (!bookings)
            return [];
        const segs = [];
        for (const b of bookings)
            segs.push(...splitIntoSegments(b, gridStart, WEEKS));
        return segs;
    }, [bookings, gridStart]);
    /* Bookede dage i viewporten (YYYY-MM-DD) */
    const bookedDays = React.useMemo(() => {
        const set = new Set();
        if (!bookings)
            return set;
        const gridEnd = addDays(gridStart, WEEKS * 7); // eksklusiv
        for (const b of bookings) {
            const s = clampDate(b.startDay, gridStart, gridEnd);
            const e = clampDate(b.endDay, gridStart, gridEnd); // eksklusiv
            for (let d = new Date(s); d < e; d = addDays(d, 1)) {
                set.add(d.toISOString().slice(0, 10));
            }
        }
        return set;
    }, [bookings, gridStart]);
    // selection overlay segments
    const selSegments = React.useMemo(() => {
        if (selectionMode !== "range")
            return [];
        if (!sel || sel.kind !== "range" || !sel.end)
            return [];
        const b = {
            id: "__selection__",
            startDay: startOfDay(sel.start),
            endDay: startOfDay(sel.end),
        };
        return splitIntoSegments(b, gridStart, WEEKS);
    }, [sel, gridStart, selectionMode]);
    const monthTitle = formatMonthTitle(monthBase, lang);
    const reservedLabel = t("Reserveret", "Reserved");
    // ugedage
    const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const WD_DA = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
    const wd = (lang === "da" ? WD_DA : WD_EN)
        .slice(weekStartsOn)
        .concat((lang === "da" ? WD_DA : WD_EN).slice(0, weekStartsOn));
    // Kun tal (ingen symbol)
    const fmtNumber = React.useMemo(() => new Intl.NumberFormat(lang === "da" ? "da-DK" : "en-GB", {
        maximumFractionDigits: 0,
    }), [lang]);
    // Emit pris + min.-nætter validering
    React.useEffect(() => {
        const send = (payload) => {
            onPriceRef.current?.(payload);
        };
        if (!sel) {
            setValidationError(null);
            send({ kind: "none" });
            return;
        }
        if (sel.kind === "single") {
            setValidationError(null);
            const day = startOfDay(sel.date);
            const price = getPriceForDate(day);
            send({
                kind: "single",
                start: day,
                endExclusive: addDays(day, 1),
                nights: 1,
                total: price ?? null,
                breakdown: [{ date: day, price }],
                hasMissing: price == null,
                minNightsRequired: 1,
                isMinNightsSatisfied: true,
            });
            return;
        }
        const start = startOfDay(sel.start);
        const endEx = sel.end ? startOfDay(sel.end) : undefined;
        if (!endEx || endEx <= start) {
            setValidationError(null);
            send({
                kind: "range",
                start,
                endExclusive: endEx,
                nights: endEx ? daysBetween(start, endEx) : undefined,
                total: null,
                breakdown: [],
                hasMissing: true,
            });
            return;
        }
        const days = eachDay(start, endEx);
        const breakdown = days.map((d) => ({ date: d, price: getPriceForDate(d) }));
        const total = breakdown.reduce((sum, it) => sum + (it.price ?? 0), 0);
        const hasMissing = breakdown.some((it) => it.price == null);
        // NY: min. nætter for ankomstdagen
        const required = getMinNightsForStart(start) ?? 1;
        const nights = days.length;
        const isOk = nights >= required;
        const dateStr = start.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        const errMsg = !isOk
            ? lang === "da"
                ? `Minimum ${required} ${required === 1 ? "nat" : "nætter"} ved ankomst ${dateStr}.`
                : `Minimum ${required} night${required === 1 ? "" : "s"} required for arrival ${dateStr}.`
            : null;
        setValidationError(errMsg);
        send({
            kind: "range",
            start,
            endExclusive: endEx,
            nights,
            total: hasMissing && total === 0 ? null : total,
            breakdown,
            hasMissing,
            minNightsRequired: required,
            isMinNightsSatisfied: isOk,
            validationError: errMsg ?? undefined,
        });
    }, [sel, lang]);
    // Klik-håndtering med bookingvalidering
    function handleDayClick(d) {
        if (selectionMode === "none")
            return;
        const day = startOfDay(d);
        // — Hvis der er et færdigt range, og man klikker inden for det ⇒ deselect
        if (selectionMode === "range" &&
            sel?.kind === "range" &&
            sel.end &&
            day >= startOfDay(sel.start) &&
            day <= startOfDay(sel.end)) {
            emitSelection(null);
            return;
        }
        // Forbyd både fortid og i dag (gælder kun for NYT valg; ikke for deselect ovenfor)
        if (disablePastSelection && day <= today)
            return;
        const ymd = day.toISOString().slice(0, 10);
        const isBooked = bookedDays.has(ymd);
        if (selectionMode === "single") {
            if (isBooked)
                return;
            const current = sel && sel.kind === "single" && sel.date.getTime() === day.getTime()
                ? null
                : { kind: "single", date: day };
            emitSelection(current);
            return;
        }
        // range
        if (!sel || sel.kind !== "range" || sel.end) {
            if (isBooked)
                return;
            emitSelection({ kind: "range", start: day });
            return;
        }
        const start = startOfDay(sel.start);
        if (day.getTime() === start.getTime()) {
            emitSelection(null);
            return;
        }
        if (!rangeIsFree(start, day, bookedDays))
            return;
        if (day < start) {
            emitSelection({ kind: "range", start: day, end: start });
        }
        else {
            emitSelection({ kind: "range", start, end: day });
        }
    }
    // helpers til selected styling
    function isSingleSelected(d) {
        return sel?.kind === "single" && sel.date.getTime() === d.getTime();
    }
    function isRangeEdge(d) {
        if (sel?.kind !== "range")
            return "";
        const t = d.getTime();
        if (sel.start && t === startOfDay(sel.start).getTime())
            return "start";
        if (sel.end && t === startOfDay(sel.end).getTime())
            return "end";
        return "";
    }
    return (_jsxs("div", { className: styles.wrap, "data-mode": selectionMode, "aria-live": "polite", "aria-label": t("Tilgængelighedskalender", "Availability calendar"), children: [_jsxs("div", { className: styles.head, children: [_jsx("button", { type: "button", className: styles.navBtn, onClick: prevMonth, disabled: !canPrev, "aria-label": t("Forrige måned", "Previous month"), children: "\u2039" }), _jsx("div", { className: styles.month, children: monthTitle }), _jsx("button", { type: "button", className: styles.navBtn, onClick: nextMonth, "aria-label": t("Næste måned", "Next month"), children: "\u203A" })] }), _jsxs("div", { className: styles.grid, style: {
                    ["--weeks"]: 5,
                    gridTemplateColumns: weekColTemplate,
                }, children: [_jsx("div", { "aria-hidden": "true" }), wd.map((label) => (_jsx("div", { className: styles.weekday, children: label }, label))), weekStarts.map((ws, r) => {
                        const iso = getISOWeek(ws);
                        return (_jsxs(React.Fragment, { children: [_jsx("div", { className: styles.weeknumCell, "aria-label": `Uge ${iso}`, children: iso }), cells[r].map((d) => {
                                    const isToday = d.getTime() === today.getTime();
                                    const inMonth = d.getMonth() === monthBase.getMonth();
                                    const ymd = d.toISOString().slice(0, 10);
                                    const isBooked = bookedDays.has(ymd);
                                    const awaitingEnd = selectionMode === "range" &&
                                        sel?.kind === "range" &&
                                        sel.start &&
                                        !sel.end;
                                    const inCurrentRange = selectionMode === "range" &&
                                        sel?.kind === "range" &&
                                        sel.end &&
                                        d >= startOfDay(sel.start) &&
                                        d <= startOfDay(sel.end);
                                    // Klikbarhed
                                    let canClick = selectionMode !== "none";
                                    if (disablePastSelection && d <= today)
                                        canClick = false;
                                    if (selectionMode === "single") {
                                        if (isBooked)
                                            canClick = false;
                                    }
                                    else if (selectionMode === "range") {
                                        if (!awaitingEnd) {
                                            if (isBooked)
                                                canClick = false;
                                        }
                                        else {
                                            const start = startOfDay(sel.start);
                                            const endEx = startOfDay(d);
                                            if (!(endEx > start && rangeIsFree(start, endEx, bookedDays))) {
                                                canClick = false;
                                            }
                                            // (Bevidst: Vi begrænser ikke klik baseret på min. nætter her,
                                            //  men viser i stedet en klar fejlbesked under kalenderen.)
                                        }
                                    }
                                    if (inCurrentRange)
                                        canClick = true;
                                    const disabled = !canClick;
                                    const cursorStyle = {
                                        cursor: disabled ? "default" : "pointer",
                                    };
                                    const selectedSingle = isSingleSelected(d);
                                    const edge = isRangeEdge(d);
                                    // Vis ikke pris for fortid eller i dag
                                    const shouldShowPrice = inMonth && !isBooked && d > today;
                                    const value = shouldShowPrice ? getPriceForDate(d) : null;
                                    const priceMain = value != null ? `${fmtNumber.format(value)} ` : null;
                                    return (_jsxs("div", { className: styles.cell, "data-dim": !inMonth ? "1" : undefined, "data-today": isToday ? "1" : undefined, "data-selected": selectedSingle ? "1" : undefined, "data-edge": edge || undefined, children: [_jsx("div", { className: styles.dayNum, role: "button", tabIndex: disabled ? -1 : 0, "aria-disabled": disabled || undefined, style: cursorStyle, onClick: (e) => {
                                                    if (disabled)
                                                        return;
                                                    e.preventDefault();
                                                    handleDayClick(d);
                                                }, onKeyDown: (e) => {
                                                    if (disabled)
                                                        return;
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleDayClick(d);
                                                    }
                                                }, children: d.getDate() }), priceMain && (_jsxs("div", { className: styles.price, "aria-hidden": "true", children: [_jsx("span", { className: styles.priceMain, children: priceMain }), _jsx("span", { className: styles.priceCur, children: "DKK" })] })), _jsx("button", { type: "button", className: styles.cellBtn, "aria-label": d.toLocaleDateString(lang === "da" ? "da-DK" : "en-GB"), "aria-pressed": selectionMode === "single" ? selectedSingle : undefined, disabled: disabled, style: cursorStyle, onClick: () => handleDayClick(d) })] }, d.toISOString()));
                                })] }, `row-${r}-${iso}`));
                    }), _jsx("div", { className: styles.bars, style: {
                            gridTemplateColumns: weekColTemplate,
                            pointerEvents: "none",
                        }, "aria-hidden": "true", children: segments.map((s) => (_jsx("div", { className: styles.bar, style: {
                                gridRow: s.row + 1,
                                gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
                            }, children: s.labelHere && (_jsx("span", { className: styles.barLabel, children: reservedLabel })) }, s.id))) }), selectionMode === "range" && selSegments.length > 0 && (_jsx("div", { className: styles.selBars, style: {
                            gridTemplateColumns: weekColTemplate,
                            pointerEvents: "none",
                        }, "aria-hidden": "true", children: selSegments.map((s) => (_jsx("div", { className: `${styles.selBar} ${s.isLast ? styles.nibbleRight : ""}`, style: {
                                gridRow: s.row + 1,
                                gridColumn: `${s.colStart + 1} / ${s.colEnd + 1}`,
                            } }, `sel-${s.id}`))) }))] }), validationError && (_jsx("div", { className: styles.error, role: "alert", "aria-live": "polite", children: validationError })), !bookings && (_jsx("div", { className: styles.loading, children: t("Henter…", "Loading…") })), error && _jsx("div", { className: styles.error, children: error })] }));
}
/* ─── Segment helper ─── */
function splitIntoSegments(b, gridStart, weeks) {
    const gridEnd = addDays(gridStart, weeks * 7); // exclusive
    const visStart = clampDate(b.startDay, gridStart, gridEnd);
    const visEnd = clampDate(b.endDay, gridStart, gridEnd);
    if (visStart >= visEnd)
        return [];
    const firstIx = daysBetween(gridStart, visStart);
    const lastIxEx = daysBetween(gridStart, visEnd);
    const segs = [];
    let cursor = firstIx;
    const endColLine = (ixEx) => {
        const mod = ixEx % 7;
        return mod === 0 ? 8 : mod + 1;
    };
    while (cursor < lastIxEx) {
        const row = Math.floor(cursor / 7);
        const rowEndEx = (row + 1) * 7;
        const segStartIx = cursor;
        const segEndIx = Math.min(lastIxEx, rowEndEx);
        segs.push({
            id: `${b.id}:${row}:${segStartIx}-${segEndIx}`,
            row,
            colStart: (segStartIx % 7) + 1,
            colEnd: endColLine(segEndIx),
            isFirst: segStartIx === firstIx,
            isLast: segEndIx === lastIxEx,
            labelHere: segStartIx === firstIx,
        });
        cursor = segEndIx;
    }
    return segs;
}
