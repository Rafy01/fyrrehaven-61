// src/components/CookieButton/CookieCategoryList.tsx

import { cookieData } from "../../data/cookies";
import { type Lang } from "../../lib/lang";

type Props = {
  lang: Lang;
  category: "necessary" | "analytics" | "marketing";
};

export default function CookieCategoryList({ lang, category }: Props) {
  const list = cookieData[lang][category];

  if (!list || list.length === 0) return null;

  return (
    <ul style={{ paddingLeft: "1rem", marginTop: "0.5rem" }}>
      {list.map((cookie) => (
        <li key={cookie.name} style={{ marginBottom: "0.5rem" }}>
          <strong>{cookie.name}</strong> – {cookie.purpose}
          <br />
          <small>
            {cookie.provider} · {cookie.duration} · {cookie.type}
          </small>
        </li>
      ))}
    </ul>
  );
}
