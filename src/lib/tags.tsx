import { TAG_ICONS as Ico, type SiteIcon } from "./icons";

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

export type IconComponent = SiteIcon;

export type TagDef = {
  id: TagId;
  labelDa: string;
  labelEn: string;
  labelDe: string;
  Icon: IconComponent;
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
