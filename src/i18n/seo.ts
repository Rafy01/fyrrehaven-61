import type { Lang } from "../lib/lang";
import type { PageKey } from "../lib/routes";
import { da } from "./da";
import { de } from "./de";
import { en } from "./en";

export type SeoPageKey = PageKey | "extraServices";

export type SeoPack = {
  title: string;
  description: string;
  keywords?: string[];
  image: string;
  imageAlt: string;
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    noimageindex?: boolean;
    notranslate?: boolean;
    maxSnippet?: number;
    maxImagePreview?: "large" | "standard" | "none";
    maxVideoPreview?: number;
  };
};

type LocaleSeoPack = Omit<SeoPack, "keywords"> & {
  keywords?: readonly string[];
};

const seoByLang = {
  da: da.seo,
  en: en.seo,
  de: de.seo,
} as const;

export function getSeoMeta(lang: Lang, key: SeoPageKey): SeoPack {
  const pack = (seoByLang[lang]?.[key] ??
    seoByLang.en[key] ??
    seoByLang.da.home) as LocaleSeoPack;
  return {
    ...pack,
    keywords: pack.keywords ? [...pack.keywords] : undefined,
  };
}
