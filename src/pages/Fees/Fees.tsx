export type FeesProps = { lang: "da" | "en" };

export default function Fees({ lang }: FeesProps) {
  const t = (da: string, en: string) => (lang === "da" ? da : en);
  return <div>{t("Gebyrer", "Fees")}</div>;
}
