import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import styles from "./Buttons.module.css";
import { useTranslation } from "react-i18next";
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
function sizeClass(size) {
    return size === "sm"
        ? styles["s-sm"]
        : size === "lg"
            ? styles["s-lg"]
            : styles["s-md"];
}
/** Vælg label ud fra props (+ i18n/lang fallback) */
function useLabelText(props) {
    const { t, i18n } = useTranslation();
    if ("label" in props)
        return props.label;
    if ("labelDa" in props && "labelEn" in props) {
        const current = props.lang ??
            (i18n.language?.toLowerCase().startsWith("da") ? "da" : "en");
        return current === "da" ? props.labelDa : props.labelEn;
    }
    if ("i18nKey" in props)
        return t(props.i18nKey);
    return "";
}
function Element({ to, href, external, disabled, loading, ariaLabel, onClick, children, className, buttonType, }) {
    const isDisabled = !!(disabled || loading);
    if (to) {
        return (_jsx(Link, { to: to, onClick: isDisabled ? (e) => e.preventDefault() : onClick, "aria-label": ariaLabel, "aria-disabled": isDisabled ? true : undefined, tabIndex: isDisabled ? -1 : undefined, className: className, children: children }));
    }
    if (href) {
        const target = external ? "_blank" : undefined;
        const rel = external ? "noopener noreferrer" : undefined;
        return (_jsx("a", { href: isDisabled ? "#" : href, target: target, rel: rel, onClick: isDisabled ? (e) => e.preventDefault() : onClick, "aria-label": ariaLabel, "aria-disabled": isDisabled ? true : undefined, tabIndex: isDisabled ? -1 : undefined, className: className, children: children }));
    }
    return (_jsx("button", { type: buttonType ?? "button", onClick: onClick, "aria-label": ariaLabel, disabled: isDisabled, className: className, children: children }));
}
export default function Buttons(props) {
    const { variant = "primary", size = "md", fullWidth, iconLeft, iconRight, loading, className, ariaLabel, buttonType, ...rest } = props;
    const labelText = useLabelText(rest);
    const classes = cx(styles.btn, variant === "primary" ? styles.primary : styles.secondary, sizeClass(size), fullWidth && styles.fullWidth, className);
    const computedAria = ariaLabel ?? labelText;
    return (_jsxs(Element, { ...rest, className: classes, ariaLabel: computedAria, loading: loading, buttonType: buttonType, children: [loading ? (_jsx("span", { className: styles.spinner, "aria-hidden": "true" })) : iconLeft ? (_jsx("span", { className: styles.icon, "aria-hidden": "true", children: iconLeft })) : null, _jsx("span", { children: labelText }), iconRight ? (_jsx("span", { className: styles.icon, "aria-hidden": "true", children: iconRight })) : null] }));
}
export function Primary(p) {
    return _jsx(Buttons, { ...p, variant: "primary" });
}
export function Secondary(p) {
    return _jsx(Buttons, { ...p, variant: "secondary" });
}
