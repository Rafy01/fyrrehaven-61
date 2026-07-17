import React from "react";
import { Box, Container, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Buttons from "../../components/Buttons";
import Head from "../../lib/Head";
import type { Lang } from "../../lib/lang";
import { guestPathOf, pathOf } from "../../lib/routes";
import { getSeoMeta } from "../../i18n/seo";
import { extraServices } from "../../data/extraServices";
import formStyles from "../../components/ContactForm/ContactForm.module.css";
import styles from "./ExtraServices.module.css";

type QtyState = Record<string, string>;
type SelectedExtra = {
  id: string;
  qty: number;
  unitPriceDKK: number;
  label: Record<Lang, string>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_SERVICE_IDS = ["bedding", "sheets", "towels"] as const;
const BUNDLE_SERVICE_ID = "bundle";
const MAX_GUEST_SERVICE_PEOPLE = 10;

function normalizeEmail(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function toQty(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function localYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function earliestArrivalYmd() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return localYmd(date);
}

function parseYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

type BookingValidationResponse =
  | { ok: true }
  | { ok: false; error?: string; detail?: string | null };

export default function ExtraServices({
  lang,
  adminManual = false,
  getRequestHeaders,
}: {
  lang: Lang;
  adminManual?: boolean;
  getRequestHeaders?: () => Promise<Record<string, string>>;
}) {
  const { i18n } = useTranslation("extraServices");
  const t = i18n.getFixedT(lang, "extraServices");
  const path = guestPathOf(lang, "extraServices");
  const seo = getSeoMeta(lang, "extraServices");
  const locale =
    lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [stayDate, setStayDate] = React.useState(earliestArrivalYmd);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState(() =>
    parseYmd(earliestArrivalYmd())
  );
  const [wantsExtras, setWantsExtras] = React.useState<"no" | "yes">("no");
  const [quantities, setQuantities] = React.useState<QtyState>({});
  const [hotTubFill, setHotTubFill] = React.useState<"no" | "yes">("no");
  const [message, setMessage] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  const formStartedAtRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      maximumFractionDigits: 0,
    }).format(amount);

  const visibleServices = extraServices.filter(
    (service) => service.id !== "hot-tub-fill"
  );
  const hotTubService = extraServices.find(
    (service) => service.id === "hot-tub-fill"
  );

  function priceLabel(service: (typeof extraServices)[number]) {
    if (service.priceDKK != null) return formatPrice(service.priceDKK);
    return service.priceLabel?.[lang] ?? "";
  }

  function updateQtySelect(id: string, value: string) {
    setQuantities((current) => ({ ...current, [id]: value }));
  }

  const bundleQty = toQty(quantities[BUNDLE_SERVICE_ID] ?? "");
  const individualPersonQty = Math.max(
    ...PERSON_SERVICE_IDS.map((id) => toQty(quantities[id] ?? ""))
  );
  const totalPersonServices = bundleQty + individualPersonQty;

  function maxPersonOptionsFor(id: string) {
    if (id === BUNDLE_SERVICE_ID) {
      return Math.max(0, MAX_GUEST_SERVICE_PEOPLE - individualPersonQty);
    }

    if (PERSON_SERVICE_IDS.includes(id as (typeof PERSON_SERVICE_IDS)[number])) {
      return Math.max(0, MAX_GUEST_SERVICE_PEOPLE - bundleQty);
    }

    return MAX_GUEST_SERVICE_PEOPLE;
  }

  function amountOptions(max: number) {
    return Array.from({ length: max }, (_, index) => index + 1);
  }

  const stayDateDisplay = new Intl.DateTimeFormat(locale).format(
    parseYmd(stayDate)
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(calendarMonth);
  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          new Date(2026, 0, 5 + index)
        )
      ),
    [locale]
  );
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [calendarMonth]);

  function selectStayDate(date: Date) {
    const next = localYmd(date);
    if (next < earliestArrivalYmd()) return;
    setStayDate(next);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setCalendarOpen(false);
  }

  const selectedItems = React.useMemo(() => {
    if (wantsExtras !== "yes") return [];

    const quantityItems: SelectedExtra[] = visibleServices
      .map((service) => {
        const qty = toQty(quantities[service.id] ?? "");
        if (qty <= 0) return null;
        return {
          id: service.id,
          qty,
          unitPriceDKK: service.priceDKK ?? 0,
          label: {
            da: service.title.da,
            en: service.title.en,
            de: service.title.de,
          },
        };
      })
      .filter((item): item is SelectedExtra => item != null);

    const hotTubItem =
      hotTubFill === "yes" && hotTubService
        ? [
            {
              id: hotTubService.id,
              qty: 1,
              unitPriceDKK: hotTubService.priceDKK ?? 0,
              label: {
                da: hotTubService.title.da,
                en: hotTubService.title.en,
                de: hotTubService.title.de,
              },
            },
          ]
        : [];

    return [...quantityItems, ...hotTubItem];
  }, [hotTubFill, hotTubService, quantities, visibleServices, wantsExtras]);

  const totalDKK = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.unitPriceDKK,
    0
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const replyEmail = normalizeEmail(email);
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !replyEmail || !stayDate) {
      setError(t("form.errors.required"));
      return;
    }
    if (stayDate < earliestArrivalYmd()) {
      setError(t("form.errors.dateTooSoon"));
      return;
    }
    if (!EMAIL_RE.test(replyEmail)) {
      setError(t("form.errors.email"));
      return;
    }
    if (wantsExtras === "yes" && selectedItems.length === 0) {
      setError(t("form.errors.noSelection"));
      return;
    }
    if (totalPersonServices > MAX_GUEST_SERVICE_PEOPLE) {
      setError(t("form.errors.tooManyPeople"));
      return;
    }
    if (!accepted) {
      setError(t("form.errors.accept"));
      return;
    }

    setSending(true);
    try {
      if (!adminManual) {
        const validationRes = await fetch("/api/extra-services/validate-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            stayDate,
          }),
        });
        const validation =
          (await validationRes.json().catch(() => null)) as
            | BookingValidationResponse
            | null;

        const validationError =
          validation && !validation.ok ? validation : null;

        if (!validationRes.ok || validationError) {
          const code = validationError?.error || "";
          const message =
            code === "EXTRA_SERVICE_DATE_NOT_BOOKED"
              ? t("form.errors.dateNotBooked")
              : code === "EXTRA_SERVICE_BOOKING_NAME_MISMATCH"
                ? t("form.errors.nameMismatch")
                : code === "BOOKING_CALENDAR_UNAVAILABLE"
                  ? t("form.errors.bookingCheckUnavailable")
                  : validationError?.detail || t("form.errors.bookingCheck");
          setError(message);
          return;
        }
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getRequestHeaders ? await getRequestHeaders() : {}),
        },
        body: JSON.stringify({
          lang,
          adminManualGuestOnly: adminManual,
          website: "",
          company: "",
          faxNumber: "",
          formStartedAt: formStartedAtRef.current,
          purpose: "extra-services",
          context: "extra-services",
          name: trimmedName,
          email: replyEmail,
          message: trimmedMessage,
          consent: accepted,
          feesAccepted: accepted,
          extras: {
            stayDate,
            items: selectedItems,
            totalDKK,
          },
        }),
      });

      if (!res.ok) throw new Error("submit failed");

      setSent(true);
      setName("");
      setEmail("");
      setStayDate(earliestArrivalYmd());
      setCalendarMonth(parseYmd(earliestArrivalYmd()));
      setWantsExtras("no");
      setQuantities({});
      setHotTubFill("no");
      setMessage("");
      setAccepted(false);
    } catch {
      setError(t("form.errors.submit"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Head
        lang={lang}
        path={path}
        title={seo.title}
        description={seo.description}
        ogImage={seo.image}
        ogImageAlt={seo.imageAlt}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seo.title,
          description: seo.description,
          url: `https://fyrrehaven-61.dk${path}`,
        }}
        robots={{ index: false, follow: false, noarchive: true }}
        keywords={seo.keywords}
      />

      <Container size="3">
        <Box py="6" className={styles.page}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>{t("page.eyebrow")}</p>
            <Heading as="h1" size="8" mb="3">
              {t("page.title")}
            </Heading>
            <Text className={styles.lead} as="p">
              {t("page.lead")}
            </Text>
          </div>

          <div className={styles.layout}>
            <section className={styles.priceList} aria-label={t("page.listAria")}>
              {extraServices.map((service) => (
                <article className={styles.priceRow} key={service.id}>
                  <div className={styles.priceHeading}>
                    <h2>{service.title[lang]}</h2>
                    <span aria-hidden="true" />
                    <strong>{priceLabel(service)}</strong>
                  </div>
                  <p>{service.unit?.[lang] ?? service.description[lang]}</p>
                </article>
              ))}

              <article className={styles.priceRow}>
                <div className={styles.priceHeading}>
                  <h2>{t("page.includedTitle")}</h2>
                  <span aria-hidden="true" />
                  <strong>{t("form.free")}</strong>
                </div>
                <p>{t("page.includedText")}</p>
              </article>
            </section>

            <form
              className={`${formStyles.card} ${formStyles.form} ${styles.formCard}`}
              onSubmit={onSubmit}
              noValidate
            >
              <div className={`${formStyles.rowGroup} ${styles.identityGroup}`}>
                <div className={formStyles.row}>
                  <label className={formStyles.label} htmlFor="extra-name" data-required="true">
                    {t("form.fields.name")}
                  </label>
                  <input
                    id="extra-name"
                    className={formStyles.input}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("form.placeholders.name")}
                    required
                  />
                </div>

                <div className={formStyles.row}>
                  <label className={formStyles.label} htmlFor="extra-email" data-required="true">
                    {t("form.fields.email")}
                  </label>
                  <input
                    id="extra-email"
                    className={formStyles.input}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={(event) => setEmail(normalizeEmail(event.target.value))}
                    placeholder={t("form.placeholders.email")}
                    required
                  />
                </div>
              </div>

              <div className={formStyles.row}>
                <label className={formStyles.label} htmlFor="extra-stay-date" data-required="true">
                  {t("form.fields.stayDate")}
                </label>
                <div className={styles.datePicker} ref={datePickerRef}>
                  <button
                    id="extra-stay-date"
                    className={`${formStyles.input} ${styles.dateButton}`}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={calendarOpen}
                    aria-describedby="extra-stay-date-hint"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setCalendarOpen((open) => !open)}
                  >
                    <span>{stayDateDisplay}</span>
                    <span aria-hidden="true">▾</span>
                  </button>

                  {calendarOpen && (
                    <div
                      className={styles.calendar}
                      role="dialog"
                      aria-label={t("form.fields.stayDate")}
                    >
                      <div className={styles.calendarHeader}>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth((current) => addMonths(current, -1))
                          }
                          aria-label={t("form.calendar.previous")}
                        >
                          ‹
                        </button>
                        <strong>{monthLabel}</strong>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth((current) => addMonths(current, 1))
                          }
                          aria-label={t("form.calendar.next")}
                        >
                          ›
                        </button>
                      </div>

                      <div className={styles.weekDays} aria-hidden="true">
                        {weekDays.map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>

                      <div className={styles.days}>
                        {calendarDays.map((date) => {
                          const ymd = localYmd(date);
                          const disabled = ymd < earliestArrivalYmd();
                          const muted =
                            date.getMonth() !== calendarMonth.getMonth();
                          const selected = ymd === stayDate;

                          return (
                            <button
                              type="button"
                              key={ymd}
                              disabled={disabled}
                              className={[
                                muted ? styles.mutedDay : "",
                                selected ? styles.selectedDay : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => selectStayDate(date)}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <small id="extra-stay-date-hint" className={styles.hint}>
                  {t("form.dateHint")}
                </small>
              </div>

              <div className={formStyles.row}>
                <label className={formStyles.label} htmlFor="extra-wants" data-required="true">
                  {t("form.fields.wantsExtras")}
                </label>
                <div className={formStyles.selectWrap}>
                  <select
                    id="extra-wants"
                    className={formStyles.select}
                    value={wantsExtras}
                    onChange={(event) =>
                      setWantsExtras(event.target.value as "no" | "yes")
                    }
                  >
                    <option value="no">{t("form.no")}</option>
                    <option value="yes">{t("form.yes")}</option>
                  </select>
                  <span className={formStyles.chev} aria-hidden>
                    ▾
                  </span>
                </div>
              </div>

              {wantsExtras === "yes" && (
                <div className={styles.extraFields}>
                  <div className={`${formStyles.rowGroup} ${formStyles.cols3}`}>
                    {visibleServices.slice(0, 3).map((service) => (
                      <div className={formStyles.row} key={service.id}>
                        <label className={formStyles.label} htmlFor={`extra-${service.id}`}>
                          {service.title[lang]}
                        </label>
                        <div className={formStyles.selectWrap}>
                          <select
                            id={`extra-${service.id}`}
                            className={formStyles.select}
                            value={quantities[service.id] ?? ""}
                            onChange={(event) =>
                              updateQtySelect(service.id, event.target.value)
                            }
                          >
                            <option value="">{t("form.select")}</option>
                            {amountOptions(maxPersonOptionsFor(service.id)).map((amount) => (
                              <option key={amount} value={amount}>
                                {amount}
                              </option>
                            ))}
                          </select>
                          <span className={formStyles.chev} aria-hidden>
                            ▾
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={formStyles.row}>
                    <label className={formStyles.label} htmlFor="extra-bundle">
                      {visibleServices[3]?.title[lang]}
                    </label>
                    <div className={formStyles.selectWrap}>
                      <select
                        id="extra-bundle"
                        className={formStyles.select}
                        value={quantities.bundle ?? ""}
                        onChange={(event) =>
                          updateQtySelect("bundle", event.target.value)
                        }
                      >
                        <option value="">{t("form.select")}</option>
                        {amountOptions(maxPersonOptionsFor(BUNDLE_SERVICE_ID)).map((amount) => (
                          <option key={amount} value={amount}>
                            {amount}
                          </option>
                        ))}
                      </select>
                      <span className={formStyles.chev} aria-hidden>
                        ▾
                      </span>
                    </div>
                    <small className={styles.hint}>{t("form.bundleHint")}</small>
                  </div>

                  <div className={formStyles.rowGroup}>
                    {visibleServices.slice(4).map((service) => (
                      <div className={formStyles.row} key={service.id}>
                        <label className={formStyles.label} htmlFor={`extra-${service.id}`}>
                          {service.title[lang]}
                        </label>
                        <div className={formStyles.selectWrap}>
                          <select
                            id={`extra-${service.id}`}
                            className={formStyles.select}
                            value={quantities[service.id] ?? ""}
                            onChange={(event) =>
                              updateQtySelect(service.id, event.target.value)
                            }
                          >
                            <option value="">{t("form.select")}</option>
                            <option value="1">1</option>
                          </select>
                          <span className={formStyles.chev} aria-hidden>
                            ▾
                          </span>
                        </div>
                        <small className={styles.hint}>{t(`form.hints.${service.id}`)}</small>
                      </div>
                    ))}
                  </div>

                  {hotTubService && (
                    <div className={formStyles.row}>
                      <label className={formStyles.label} htmlFor="extra-hot-tub">
                        {hotTubService.title[lang]}
                      </label>
                      <div className={formStyles.selectWrap}>
                        <select
                          id="extra-hot-tub"
                          className={formStyles.select}
                          value={hotTubFill}
                          onChange={(event) =>
                            setHotTubFill(event.target.value as "no" | "yes")
                          }
                        >
                          <option value="no">{t("form.select")}</option>
                          <option value="yes">{t("form.yes")}</option>
                        </select>
                        <span className={formStyles.chev} aria-hidden>
                          ▾
                        </span>
                      </div>
                      <small className={styles.hint}>{hotTubService.description[lang]}</small>
                    </div>
                  )}

                  <div className={formStyles.row}>
                    <label className={formStyles.label} htmlFor="extra-message">
                      {t("form.fields.otherRequests")}
                    </label>
                    <textarea
                      id="extra-message"
                      className={formStyles.textarea}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={t("form.placeholders.otherRequests")}
                      rows={6}
                    />
                  </div>

                  <div className={styles.total}>
                    <span>{t("form.total")}</span>
                    <strong>{formatPrice(totalDKK)}</strong>
                  </div>
                </div>
              )}

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  required
                />
                <span>
                  {t("form.acceptBefore")}{" "}
                  <Link to={pathOf(lang, "house")}>{t("form.houseRules")}</Link>{" "}
                  {t("form.and")}{" "}
                  <Link to={pathOf(lang, "fees")}>{t("form.feeList")}</Link>{" "}
                  {t("form.acceptAfter")}
                </span>
              </label>

              {error && (
                <p className={formStyles.error} role="alert">
                  {error}
                </p>
              )}
              {sent && (
                <p className={styles.success} role="status">
                  {t("form.success")}
                </p>
              )}

              <div className={formStyles.actions}>
                <Buttons
                  buttonType="submit"
                  loading={sending}
                  disabled={sending}
                  variant="primary"
                  label={sending ? t("form.sending") : t("form.submit")}
                  fullWidth
                />
              </div>
            </form>
          </div>
        </Box>
      </Container>
    </>
  );
}
