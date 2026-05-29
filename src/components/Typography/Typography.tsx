import React, { type JSX } from "react";
import styles from "./Typography.module.css";

// Minimal clsx – uden afhængighed
const clsx = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");

type Variant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "small"
  | "caption"
  | "link"
  | "ul"
  | "li";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  bold?: boolean;
  href?: string; // bruges til links
};

/**
 * Central typografi-komponent til Fyrrehaven 61
 * Bruges til at sikre ensartet typografi på tværs af projektet.
 */
export default function Typography({
  children,
  variant = "p",
  className,
  as,
  bold = false,
  href,
}: Props) {
  const Component = (as || variantMap[variant] || "p") as React.ElementType;
  const classes = clsx(styles[variant], bold && styles.bold, className);

  // Hvis det er et link med href
  if (variant === "link" && href) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  // Hvis det er en liste (ul / li)
  if (variant === "ul") {
    return <ul className={classes}>{children}</ul>;
  }
  if (variant === "li") {
    return <li className={classes}>{children}</li>;
  }

  // Standard typografi-element
  return <Component className={classes}>{children}</Component>;
}

const variantMap: Record<Variant, keyof JSX.IntrinsicElements> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
  small: "small",
  caption: "span",
  link: "a",
  ul: "ul",
  li: "li",
};
