import type { MetadataRoute } from "next";
import { getContent } from "@/lib/server/content";
import { siteUrl } from "@/lib/server/site-url";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl;
  const { works, categories } = await getContent();
  return ["en", "es"].flatMap((lang) =>
    [
      "",
      "/work",
      "/studio",
      "/contact",
      "/links",
      ...categories.map((c) => "/services/" + c.id),
      ...works.map((w) => "/work/" + w.slug),
    ].map((path) => ({
      url: base + "/" + lang + path,
      alternates: {
        languages: { en: base + "/en" + path, es: base + "/es" + path },
      },
    })),
  );
}
