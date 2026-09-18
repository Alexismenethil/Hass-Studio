import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent } from "@/lib/server/content";
import { stillOf, text, type Locale } from "@/lib/content";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/footer";
import { Motion } from "@/components/motion";
import { Cursor } from "@/components/cursor";
import { PageTransition } from "@/components/cinema";
import { siteUrl } from "@/lib/server/site-url";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (lang !== "en" && lang !== "es") return {};
  const { settings } = await getContent();
  return {
    title: {
      default: text(settings.seoTitle, lang),
      template: "%s — " + settings.brand,
    },
    description: text(settings.seoDescription, lang),
    openGraph: {
      title: text(settings.seoTitle, lang),
      description: text(settings.seoDescription, lang),
      images: [stillOf(settings.heroImage)].filter(Boolean),
    },
    twitter: { card: "summary_large_image", images: [stillOf(settings.heroImage)].filter(Boolean) },
  };
}
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "es") notFound();
  const { settings } = await getContent();
  return (
    <div lang={lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: settings.brand,
            url: siteUrl,
            founder: { "@type": "Person", name: settings.name },
            sameAs: settings.socials.map((s) => s.url).filter(Boolean),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <SiteNav locale={lang as Locale} settings={settings} />
      <Motion />
      <Cursor />
      <PageTransition />
      {children}
      <Footer locale={lang as Locale} settings={settings} />
    </div>
  );
}
