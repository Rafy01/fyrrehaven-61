import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import styles from "./MessengerButton.module.css";

const MESSENGER_URL = "https://m.me/fyrrehaven61";

export type MessengerButtonProps = {
  onDismiss: () => void;
};

export default function MessengerButton({ onDismiss }: MessengerButtonProps) {
  const { t } = useTranslation("footer");

  const openMessenger = (event: MouseEvent<HTMLAnchorElement>) => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 760px)").matches ||
        /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent));

    if (!isMobile) return;

    event.preventDefault();
    window.location.assign(MESSENGER_URL);
  };

  return (
    <div className={styles.wrap}>
      <a
        className={styles.button}
        href={MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("messengerAria")}
        title={t("messengerAria")}
        onClick={openMessenger}
      >
        <MessengerIcon />
      </a>
      <button
        className={styles.close}
        type="button"
        aria-label={t("messengerDismissAria")}
        title={t("messengerDismissAria")}
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}

function MessengerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
      <path
        fill="currentColor"
        d="M16 3C8.82 3 3.25 8.26 3.25 15.36c0 3.72 1.52 6.93 4 9.12v4.08c0 .62.68 1 1.2.66l3.58-2.34c1.23.34 2.56.52 3.97.52 7.18 0 12.75-5.26 12.75-12.36S23.18 3 16 3Zm1.32 16.2-3.25-3.47a1.2 1.2 0 0 0-1.62-.12l-5.2 3.94 5.7-6.05a1.2 1.2 0 0 1 1.73-.02l3.25 3.47c.42.45 1.1.5 1.6.12l5.22-3.94-5.7 6.05a1.2 1.2 0 0 1-1.73.02Z"
      />
    </svg>
  );
}
