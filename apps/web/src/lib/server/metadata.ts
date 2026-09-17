import "server-only";
import type { Metadata } from "next";
import { getContent } from "./content";
import { stillOf, text, type Locale } from "../content";
export async function pageMetadata(
  locale: Locale,
  path: string,
  title?: string,
): Promise<Metadata> {
  const { settings } = await getContent();
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    ...(title ? { title } : {}),
    description: text(settings.seoDescription, locale),
    alternates: {
      canonical: "/" + locale + path,
      languages: { en: "/en" + path, es: "/es" + path },
    },
    openGraph: {
      locale: locale === "es" ? "es_PE" : "en_US",
      url: base ? base + "/" + locale + path : undefined,
      title: title || text(settings.seoTitle, locale),
      images: [stillOf(settings.heroImage)].filter(Boolean),
    },
  };
}
