// src/components/QuickFilters/index.tsx
import React from "react";
import styles from "./QuickFilters.module.css";
import { DEFAULT_TAGS, labelFor, type TagId } from "../../lib/tags";
import { chooseLang } from "../../lib/lang";
import type { Lang } from "../../lib/lang";

type Props = {
  lang: Lang;
  value: TagId[]; // single: [] eller [tag]
  onChange: (next: TagId[]) => void;
  dense?: boolean;
  syncToUrl?: boolean;
  mode?: "single" | "multi";
  includeAll?: boolean;
};

export default function QuickFilters({
  lang,
  value,
  onChange,
  dense,
  syncToUrl,
  mode = "single",
  includeAll = true,
}: Props) {
  const tags = React.useMemo(() => {
    return includeAll
      ? DEFAULT_TAGS
      : DEFAULT_TAGS.filter((t) => t.id !== "all");
  }, [includeAll]);

  // Skriv til URL når selection ændres
  React.useEffect(() => {
    if (!syncToUrl) return;
    const url = new URL(window.location.href);
    if (value.length === 0) url.searchParams.delete("tags");
    else url.searchParams.set("tags", value.join(","));
    window.history.replaceState({}, "", url.toString());
  }, [value, syncToUrl]);

  const isActive = (id: TagId | "all") =>
    id === "all" ? value.length === 0 : value.includes(id as TagId);

  const setSingle = (id: TagId | "all") => {
    if (id === "all") onChange([]); // ← VIGTIGT: tomt udvalg = vis alle
    else onChange([id as TagId]);
  };

  const toggleMulti = (id: TagId | "all") => {
    if (id === "all") return onChange([]); // ← nulstil i multi-mode
    const next = value.slice();
    const idx = next.indexOf(id as TagId);
    if (idx >= 0) next.splice(idx, 1);
    else next.push(id as TagId);
    onChange(next);
  };

  const onChipClick = (id: TagId | "all") => {
    if (mode === "single") setSingle(id);
    else toggleMulti(id);
  };

  return (
    <div className={`${styles.wrap} ${dense ? styles.dense : ""}`}>
      <div
        role="tablist"
        aria-label={chooseLang(lang, "Filtre", "Filters", "Filter")}
        className={styles.row}
      >
        {tags.map((tag) => (
          <button
            key={tag.id}
            role="tab"
            aria-selected={isActive(tag.id)}
            className={`${styles.chip} ${isActive(tag.id) ? styles.active : ""}`}
            onClick={() => onChipClick(tag.id as TagId | "all")}
          >
            <tag.Icon />
            <span>{labelFor(tag, lang)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
