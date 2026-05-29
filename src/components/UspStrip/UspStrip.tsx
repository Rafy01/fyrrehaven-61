import React from "react";
import styles from "./UspStrip.module.css";

export type UspItem = {
  /** Allerede oversat tekst (send t("da","en") fra siden) */
  text: string;
  /** Valgfrit ikon (Radix Icon eller eget) */
  icon?: React.ReactNode;
  /** Valgfri mere beskrivende label til screenreaders */
  ariaLabel?: string;
};

export type UspStripProps = {
  items: UspItem[];
  /** Størrelse på chips */
  size?: "sm" | "md";
  /** Centreret layout og std. spacing */
  align?: "left" | "center";
  /** Mindre vertikal padding */
  dense?: boolean;
  /** ARIA-label til hele strippen */
  ariaLabel?: string;
};

export default function UspStrip({
  items,
  size = "md",
  align = "center",
  dense = false,
  ariaLabel,
}: UspStripProps) {
  return (
    <section
      className={[
        styles.wrap,
        dense ? styles.dense : "",
        align === "center" ? styles.center : "",
      ].join(" ")}
      aria-label={ariaLabel ?? "Quick facts"}
    >
      <ul className={styles.list} role="list">
        {items.map((it, idx) => (
          <li
            key={idx}
            role="listitem"
            className={[
              styles.item,
              size === "sm" ? styles.sSm : styles.sMd,
            ].join(" ")}
          >
            {it.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {it.icon}
              </span>
            ) : null}
            <span className={styles.text} aria-label={it.ariaLabel}>
              {it.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
