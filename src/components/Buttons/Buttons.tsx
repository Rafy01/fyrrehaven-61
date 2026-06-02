import React from "react";
import { Link } from "react-router-dom";
import styles from "./Buttons.module.css";
import { useTranslation } from "react-i18next";
import type { Lang } from "../../lib/lang";

export type ButtonSize = "sm" | "md" | "lg";

/** Navigation: enten intern `to`, ekstern `href`, eller ingen (kun onClick) */
type LinkLike =
  | { to: string; href?: never; external?: never }
  | { href: string; to?: never; external?: boolean }
  | { to?: never; href?: never; external?: never };

/** Label: vælg én strategi */
type LabelByString = {
  label: string;
  labelDa?: never;
  labelEn?: never;
  i18nKey?: never;
};
type LabelByPair = {
  labelDa: string;
  labelEn: string;
  labelDe?: string;
  label?: never;
  i18nKey?: never;
  lang?: Lang;
};
type LabelByKey = {
  i18nKey: string;
  label?: never;
  labelDa?: never;
  labelEn?: never;
};

type LabelInput = LabelByString | LabelByPair | LabelByKey;

export type ButtonProps = LinkLike &
  LabelInput & {
    variant?: "primary" | "secondary";
    size?: ButtonSize;
    fullWidth?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    ariaLabel?: string;
    className?: string;
    /** Sæt til "submit" når knappen skal indsende en form */
    buttonType?: "button" | "submit" | "reset";
  };

function cx(...xs: Array<string | false | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

function sizeClass(size: ButtonSize): string {
  return size === "sm"
    ? styles["s-sm"]
    : size === "lg"
    ? styles["s-lg"]
    : styles["s-md"];
}

/** Vælg label ud fra props (+ i18n/lang fallback) */
function useLabelText(props: LabelInput & { lang?: Lang }) {
  const { t, i18n } = useTranslation();
  if ("label" in props) return props.label;

  if ("labelDa" in props && "labelEn" in props) {
    const pair = props as LabelByPair;
    const current: Lang =
      props.lang ??
      (i18n.language?.toLowerCase().startsWith("da")
        ? "da"
        : props.lang === "de" || i18n.language?.toLowerCase().startsWith("de")
        ? "de"
        : "en");
    if (current === "da") return pair.labelDa;
    if (current === "de") return pair.labelDe ?? pair.labelEn;
    return pair.labelEn;
  }

  if ("i18nKey" in props) return t(props.i18nKey);
  return "";
}

function Element({
  to,
  href,
  external,
  disabled,
  loading,
  ariaLabel,
  onClick,
  children,
  className,
  buttonType,
}: {
  to?: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className: string;
  buttonType?: "button" | "submit" | "reset";
}) {
  const isDisabled = !!(disabled || loading);

  if (to) {
    return (
      <Link
        to={to}
        onClick={isDisabled ? (e) => e.preventDefault() : onClick}
        aria-label={ariaLabel}
        aria-disabled={isDisabled ? true : undefined}
        tabIndex={isDisabled ? -1 : undefined}
        className={className}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    const target = external ? "_blank" : undefined;
    const rel = external ? "noopener noreferrer" : undefined;
    return (
      <a
        href={isDisabled ? "#" : href}
        target={target}
        rel={rel}
        onClick={isDisabled ? (e) => e.preventDefault() : onClick}
        aria-label={ariaLabel}
        aria-disabled={isDisabled ? true : undefined}
        tabIndex={isDisabled ? -1 : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={buttonType ?? "button"}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={isDisabled}
      className={className}
    >
      {children}
    </button>
  );
}

export default function Buttons(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    iconLeft,
    iconRight,
    loading,
    className,
    ariaLabel,
    buttonType,
    ...rest
  } = props;

  const labelText = useLabelText(rest as LabelInput & { lang?: Lang });

  const classes = cx(
    styles.btn,
    variant === "primary" ? styles.primary : styles.secondary,
    sizeClass(size),
    fullWidth && styles.fullWidth,
    className
  );

  const computedAria = ariaLabel ?? labelText;

  return (
    <Element
      {...rest}
      className={classes}
      ariaLabel={computedAria}
      loading={loading}
      buttonType={buttonType}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : iconLeft ? (
        <span className={styles.icon} aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}

      <span>{labelText}</span>

      {iconRight ? (
        <span className={styles.icon} aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </Element>
  );
}

/* ===== Named helpers ===== */
export type PrimaryProps = Omit<ButtonProps, "variant">;
export function Primary(p: PrimaryProps) {
  return <Buttons {...(p as ButtonProps)} variant="primary" />;
}

export type SecondaryProps = Omit<ButtonProps, "variant">;
export function Secondary(p: SecondaryProps) {
  return <Buttons {...(p as ButtonProps)} variant="secondary" />;
}
