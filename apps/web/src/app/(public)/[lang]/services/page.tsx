import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, workCover, type Locale } from "@/lib/content";
import { ServicesCarousel, type ServiceSlide } from "@/components/services-carousel";

/** The services, one room of light each. A subsection now: the home is for the work. */
export default async function Services({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, categories, works } = await getContent();
  const slides: ServiceSlide[] = categories.map((c) => {
    const own = works.filter((w) => w.category_id === c.id);
    const covers = own.map(workCover).filter(Boolean).slice(0, 6);
    return {
      id: c.id,
      title: text(c.title, lang),
      tagline: text(c.description, lang).replace(/\n/g, " "),
      includes: text(c.services, lang),
      media: c.image || covers[0] || s.heroImage,
      covers: covers.length ? covers : [c.image || s.heroImage],
      count: own.length,
    };
  });
  return (
    <main id="main">
      <h1 className="sr-only">{copy[lang].services}</h1>
      <ServicesCarousel slides={slides} locale={lang} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "/services", copy[lang].services);
}
