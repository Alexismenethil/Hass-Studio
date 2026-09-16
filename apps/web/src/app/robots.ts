import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server/site-url";
export default function robots(): MetadataRoute.Robots {
  const url = siteUrl;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ...(url ? { sitemap: url + "/sitemap.xml" } : {}),
  };
}
