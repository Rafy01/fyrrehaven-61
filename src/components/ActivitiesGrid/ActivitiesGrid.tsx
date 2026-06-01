import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./ActivitiesGrid.module.css";
import { chooseLang, type Lang } from "../../lib/lang";
import type { TagId } from "../../lib/tags";

export type Activity = {
  id: string;
  tags: TagId[];
  image: string; // /images/area/xxx.webp
  href?: string; // ekstern side (attraktion / google maps)
  distanceKm?: number; // ca. afstand
  driveMin?: number; // ca. køretid
};

export type ActivitiesGridProps = {
  lang: Lang;
  items: Activity[];
  selected?: TagId[]; // fra QuickFilters
  emptyTextDa?: string;
  emptyTextEn?: string;
  className?: string;
};

export default function ActivitiesGrid({
  lang,
  items,
  selected = [],
  emptyTextDa = "Ingen resultater – prøv at vælge færre filtre.",
  emptyTextEn = "No results – try fewer filters.",
  className,
}: ActivitiesGridProps) {
  const { t: tx } = useTranslation("area");
  const t = (da: string, en: string, de = en) =>
    chooseLang(lang, da, en, de);

  const filtered = useMemo(() => {
    if (!selected.length) return items;
    const set = new Set(selected);
    return items.filter((it) => it.tags.some((tag) => set.has(tag)));
  }, [items, selected]);

  if (!filtered.length) {
    return (
      <div className={[styles.empty, className ?? ""].join(" ")}>
        {t(emptyTextDa, emptyTextEn)}
      </div>
    );
  }

  return (
    <div className={[styles.grid, className ?? ""].join(" ")}>
      {filtered.map((it, i) => {
        const title = tx(`attractions.${it.id}.title`);
        const desc = tx(`attractions.${it.id}.description`, {
          defaultValue: "",
        });
        const badge =
          it.driveMin != null
            ? t(`${it.driveMin} min i bil`, `${it.driveMin} min by car`)
            : it.distanceKm != null
            ? t(`${it.distanceKm} km`, `${it.distanceKm} km`)
            : undefined;

        const CardInner = (
          <>
            <figure className={styles.media} aria-hidden="true">
              <img
                src={it.image}
                alt=""
                loading="lazy"
                decoding="async"
                className={styles.img}
              />
              {badge && (
                <figcaption className={styles.badge}>{badge}</figcaption>
              )}
            </figure>
            <div className={styles.body}>
              <h3 className={styles.title}>{title}</h3>
              {desc ? <p className={styles.desc}>{desc}</p> : null}
              {it.tags?.length ? (
                <div className={styles.tags} aria-hidden="true">
                  {it.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        );

        // Klik hele kortet hvis der er href
        return it.href ? (
          <a
            key={it.id}
            className={styles.card}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {CardInner}
          </a>
        ) : (
          <div
            key={it.id}
            className={styles.card}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {CardInner}
          </div>
        );
      })}
    </div>
  );
}
