import type { JSX, SVGProps } from "react";

/** Godkendte tags */
export type TagId =
  | "all"
  | "beach"
  | "nature"
  | "parks"
  | "indoor"
  | "food"
  | "culture"
  | "kids";

export type IconComponent = (props?: SVGProps<SVGSVGElement>) => JSX.Element;

export type TagDef = {
  id: TagId;
  labelDa: string;
  labelEn: string;
  labelDe: string;
  Icon: IconComponent;
};

/* Små, lette SVG-ikoner (currentColor) */
const Ico = {
  All: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="m12 3 2.4 4.8 5.3.8-3.9 3.8.9 5.4L12 15.8 7.3 17.8l.9-5.4-3.9-3.8 5.3-.8L12 3Z"
        fill="currentColor"
      />
    </svg>
  ),
  Beach: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M3 19c2.5-2 5.5-2 8 0 2.5-2 5.5-2 8 0v2c-2.5-2-5.5-2-8 0-2.5-2-5.5-2-8 0v-2Zm10.5-12.5a4.5 4.5 0 0 1 4.5 4.5h-2a2.5 2.5 0 0 0-4.3-1.8l-2.8 2.9-1.4-1.4 2.2-2.2A4.5 4.5 0 0 1 13.5 6.5Z"
        fill="currentColor"
      />
    </svg>
  ),
  Leaf: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M4 13c0-5.5 5-9 12-9h3v3c0 7-3.5 12-9 12A6 6 0 0 1 4 13Zm5.5 2.5 7-7 1.4 1.4-7 7-1.4-1.4Z"
        fill="currentColor"
      />
    </svg>
  ),
  Parks: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M12 3a1 1 0 0 1 .9.6l1.4 3 3.2.5a1 1 0 0 1 .6 1.7l-2.3 2.3.5 3.2a1 1 0 0 1-1.4 1l-3-1.5-3 1.5a1 1 0 0 1-1.4-1l.5-3.2L5.9 8.8a1 1 0 0 1 .6-1.7l3.2-.5 1.4-3A1 1 0 0 1 12 3Z"
        fill="currentColor"
      />
    </svg>
  ),
  Indoor: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path d="M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z" fill="currentColor" />
    </svg>
  ),
  Food: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M7 3h2v8a2 2 0 1 1-2 0V3Zm6 6h6v2h-2v8h-2v-8h-2V9Z"
        fill="currentColor"
      />
    </svg>
  ),
  Culture: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M12 4 3 8v2h18V8l-9-4Zm-7 6v8H3v2h18v-2h-2v-8H5Z"
        fill="currentColor"
      />
    </svg>
  ),
  Kids: (props?: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      {...props}
      aria-hidden="true"
    >
      <path
        d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 20v-1a5 5 0 0 1 5-5h1v2H8a3 3 0 0 0-3 3v1H3Zm10-4h-2v-2h2a5 5 0 0 1 5 5v1h-2v-1a3 3 0 0 0-3-3Z"
        fill="currentColor"
      />
    </svg>
  ),
};

export const DEFAULT_TAGS: TagDef[] = [
  { id: "all", labelDa: "Alle", labelEn: "All", labelDe: "Alle", Icon: Ico.All },
  { id: "beach", labelDa: "Strand", labelEn: "Beach", labelDe: "Strand", Icon: Ico.Beach },
  { id: "nature", labelDa: "Natur", labelEn: "Nature", labelDe: "Natur", Icon: Ico.Leaf },
  { id: "parks", labelDa: "Forlystelser", labelEn: "Parks", labelDe: "Freizeitparks", Icon: Ico.Parks },
  { id: "indoor", labelDa: "Indendørs", labelEn: "Indoor", labelDe: "Innen", Icon: Ico.Indoor },
  {
    id: "food",
    labelDa: "Mad / Is",
    labelEn: "Food / Ice cream",
    labelDe: "Essen / Eiscreme",
    Icon: Ico.Food,
  },
  { id: "culture", labelDa: "Kultur", labelEn: "Culture", labelDe: "Kultur", Icon: Ico.Culture },
  { id: "kids", labelDa: "Børn", labelEn: "Kids", labelDe: "Kinder", Icon: Ico.Kids },
];

// (valgfrit) lille hjælper
export function labelFor(tag: TagDef, lang: "da" | "en" | "de"): string {
  if (lang === "da") return tag.labelDa;
  if (lang === "de") return tag.labelDe;
  return tag.labelEn;
}
