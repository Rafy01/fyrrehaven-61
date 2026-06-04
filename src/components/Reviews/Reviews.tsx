import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Reviews.module.css";
import Buttons from "../Buttons";
import type { Lang } from "../../lib/lang";
import { reviews as allReviews, type ReviewItem } from "../../data/reviews";

export type ReviewsProps = {
  lang: Lang;
  title?: string;
  subtitle?: string;
  maxCards?: number; // fx vis 8 på forsiden
  average?: number; // manuelt gennemsnit (overstyrer beregnet)
  showSchema?: boolean; // JSON-LD
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      className={styles.star}
    >
      <path
        d="M10 1.8l2.47 4.99 5.51.8-3.99 3.89.94 5.48L10 14.98 5.07 17.96 6.01 12.48 2.02 8.59l5.51-.8L10 1.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
function Stars({ value, ariaLabel }: { value: number; ariaLabel: string }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span className={styles.stars} aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(v)} />
      ))}
    </span>
  );
}
function formatDate(iso: string, lang: "da" | "en" | "de") {
  try {
    const locale = lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-GB";
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function oneYearAgo(from = new Date()) {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function Reviews({
  lang,
  title,
  subtitle,
  maxCards,
  average,
  showSchema = true,
}: ReviewsProps) {
  const { t } = useTranslation("reviews");
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    () => new Set()
  );

  const getReviewText = (review: ReviewItem) => {
    if (lang === "da") return review.textDa;
    if (lang === "de") return review.textDe;
    return review.textEn;
  };

  const ratingLabel = (value: number) =>
    t("ratingLabel", { value: value.toFixed(1) });

  const toggleReview = (id: string) => {
    setExpandedReviews((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Only show reviews from the latest rolling year.
  const reviews: ReviewItem[] = useMemo(
    () => {
      const cutoff = oneYearAgo();
      return allReviews
        .filter((review) => new Date(`${review.date}T00:00:00`) >= cutoff)
        .sort(
          (a, b) =>
            new Date(`${b.date}T00:00:00`).getTime() -
            new Date(`${a.date}T00:00:00`).getTime()
        )
        .slice(0, maxCards ?? allReviews.length);
    },
    [maxCards]
  );

  const computedAvg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 5;
  const avgToShow = typeof average === "number" ? average : computedAvg;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const dx = el.clientWidth * 0.85 * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  // JSON-LD (valgfrí) – bruger dit manuelle gennemsnit hvis sat
  const jsonLd = showSchema
    ? {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        name: "Fyrrehaven 61",
        url: "https://fyrrehaven-61.dk",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(avgToShow.toFixed(1)),
          reviewCount: reviews.length, // tælles stadig i schema, men ikke vist i UI
        },
        review: reviews.map((r) => ({
          "@type": "Review",
          reviewBody: getReviewText(r),
          datePublished: r.date,
          reviewRating: { "@type": "Rating", ratingValue: r.rating },
          author: { "@type": "Person", name: r.author },
        })),
      }
    : null;

  return (
    <section className={styles.wrap} aria-label={t("ariaLabel")}>
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}

      <header className={styles.header}>
        <div className={styles.hLeft}>
          <h2 className={styles.hTitle}>
            {title ?? t("title")}
          </h2>
          {subtitle ? (
            <p className={styles.hSubtitle}>{subtitle}</p>
          ) : (
            // Kun stjerner + gennemsnit (INGEN antal anmeldelser i UI)
            <p className={styles.hSubtitle}>
              <Stars value={avgToShow} ariaLabel={ratingLabel(avgToShow)} />{" "}
              <strong>{avgToShow.toFixed(1)}</strong>
            </p>
          )}
        </div>

        <div className={styles.hRight}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label={t("scrollLeft")}
            onClick={() => scroll("left")}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.navBtn}
            aria-label={t("scrollRight")}
            onClick={() => scroll("right")}
          >
            ›
          </button>
        </div>
      </header>

      <div className={styles.row} ref={scrollerRef}>
        {reviews.map((r) => {
          const rawText = getReviewText(r).trim();
          const hasText = rawText.replace(/[.\s]/g, "").length > 0;
          const text = hasText ? rawText : t("emptyReview");
          const isLong = hasText && text.length > 260;
          const isExpanded = expandedReviews.has(r.id);

          return (
            <article
              key={r.id}
              className={`${styles.card} ${isExpanded ? styles.expanded : ""}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.avatar} aria-hidden="true">
                  {r.author.slice(0, 1).toUpperCase()}
                </div>
                <div className={styles.meta}>
                  <strong className={styles.name}>{r.author}</strong>
                  <span className={styles.date}>{formatDate(r.date, lang)}</span>
                </div>
                <Stars value={r.rating} ariaLabel={ratingLabel(r.rating)} />
              </div>

              <p className={`${styles.text} ${hasText ? "" : styles.emptyText}`}>
                {text}
              </p>

              {isLong && (
                <button
                  type="button"
                  className={styles.readMore}
                  aria-expanded={isExpanded}
                  onClick={() => toggleReview(r.id)}
                >
                  {isExpanded ? t("showLess") : t("readMore")}
                </button>
              )}

              <div className={styles.source}>
                {t("source")}: {r.source ?? "Airbnb"}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.cta}>
        <Buttons
          variant="secondary"
          label={t("airbnbCta")}
          href="https://www.airbnb.dk/h/fyrrehaven-61"
          external
        />
      </div>
    </section>
  );
}
