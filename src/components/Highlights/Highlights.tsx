import React from "react";
import { Link } from "react-router-dom";
import { Heading, Text } from "@radix-ui/themes";
import styles from "./Highlights.module.css";
import Buttons from "../Buttons";

/** Navigation-union pr. kort */
type LinkLike =
  | { to: string; href?: never; external?: never }
  | { href: string; to?: never; external?: boolean }
  | { to?: never; href?: never; external?: never };

/** Medie pr. kort: ikon (ReactNode) eller billede */
export type HighlightMedia =
  | { kind: "icon"; icon: React.ReactNode }
  | { kind: "image"; src: string; alt?: string; aspect?: string };

export type HighlightItem = LinkLike & {
  title: string;
  body?: string;
  media?: HighlightMedia;
  badge?: string;
  ctaLabel?: string; // hvis sat + link findes → vis knap
};

export type HighlightsProps = {
  id?: string;
  title?: string; // sektionstitel (fx “Højdepunkter”)
  subtitle?: string; // valgfri undertekst
  items: HighlightItem[]; // 3–4 kort anbefales
  align?: "left" | "center";
  dense?: boolean; // lidt mindre vertical spacing
};

function CardWrapper({
  to,
  href,
  external,
  children,
  className,
}: {
  to?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  className: string;
}) {
  if (to) {
    return (
      <Link to={to} className={className} aria-label={undefined}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
        aria-label={undefined}
      >
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

export default function Highlights({
  id,
  title,
  subtitle,
  items,
  align = "left",
  dense = false,
}: HighlightsProps) {
  const sectionAlign = align === "center" ? styles.center : "";

  return (
    <section
      id={id}
      className={[styles.wrap, dense ? styles.dense : ""].join(" ")}
    >
      {(title || subtitle) && (
        <header className={[styles.header, sectionAlign].join(" ")}>
          {title && (
            <Heading as="h2" size="7" className={styles.hTitle}>
              {title}
            </Heading>
          )}
          {subtitle && (
            <Text as="p" color="gray" className={styles.hSubtitle}>
              {subtitle}
            </Text>
          )}
        </header>
      )}

      <div className={styles.grid} role="list">
        {items.map((it, idx) => {
          const hasCta = !!(it.ctaLabel && (it.to || it.href));
          return (
            <article key={idx} role="listitem" className={styles.card}>
              <CardWrapper
                to={it.to}
                href={it.href}
                external={it.external}
                className={styles.cardBody}
              >
                {it.media && (
                  <figure
                    className={styles.media}
                    style={
                      it.media.kind === "image" && it.media.aspect
                        ? ({
                            ["--aspect"]: it.media.aspect,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {it.media.kind === "icon" ? (
                      <div className={styles.iconBox} aria-hidden="true">
                        {it.media.icon}
                      </div>
                    ) : (
                      <div className={styles.imgFrame}>
                        <img
                          src={it.media.src}
                          alt={it.media.alt ?? ""}
                          className={styles.img}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </figure>
                )}

                {it.badge && <span className={styles.badge}>{it.badge}</span>}

                <Heading as="h3" size="4" className={styles.title}>
                  {it.title}
                </Heading>

                {it.body && (
                  <Text as="p" color="gray" className={styles.body}>
                    {it.body}
                  </Text>
                )}
              </CardWrapper>

              {hasCta && (
                <div className={styles.ctaRow}>
                  <Buttons
                    variant="secondary"
                    label={it.ctaLabel!}
                    {...(it.to
                      ? { to: it.to }
                      : { href: it.href!, external: it.external })}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
