import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import styles from "./MessengerButton.module.css";
import { UI_ICONS } from "../../lib/icons";

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
        <UI_ICONS.Messenger aria-hidden="true" focusable="false" />
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
