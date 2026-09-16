import Link from "next/link";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, workCover, type Locale } from "@/lib/content";
import { Media } from "@/components/media";
import { Words } from "@/components/text";
import { Opening } from "@/components/opening";
import { Reel, type ReelItem } from "@/components/reel";
import { ServicesCarousel, type ServiceSlide } from "@/components/services-carousel";

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, categories, works } = await getContent();
  const t = copy[lang];
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
  const featured = works.filter((w) => w.featured);
  const reel: ReelItem[] = (featured.length >= 3 ? featured : works).slice(0, 8).map((w) => ({
    slug: w.slug,
    title: w.title,
    year: w.year,
    cover: workCover(w),
    service: text(categories.find((c) => c.id === w.category_id)?.title ?? { en: "", es: "" }, lang),
  }));
  return (
    <main id="main">
      <Opening
        image={s.heroImage}
        mobileImage={s.heroMobileImage}
        title={text(s.heroTitle, lang)}
        sub={text(s.heroDescription, lang)}
        eyebrow={text(s.heroEyebrow, lang)}
        statement={text(s.introTitle, lang)}
        alt={
          lang === "en"
            ? "Warm coastal stone, olive branches and a quiet sea"
            : "Piedra cálida, ramas de olivo y un mar sereno"
        }
        locale={lang}
      />

      <ServicesCarousel slides={slides} locale={lang} />

      <Reel items={reel} title={text(s.workTitle, lang)} total={works.length} locale={lang} />

      <section className="manifesto" data-header="light">
        <div className="manifesto-window" data-wipe>
          <div className="manifesto-drift" data-parallax="7">
            <Media src={s.detailImage || s.studioImage} sizes="(max-width: 767px) 70vw, 30vw" alt="" />
          </div>
        </div>
        <div className="manifesto-copy">
          <span className="eyebrow" data-reveal>
            {s.brand} · {text(s.availability, lang)}
          </span>
          <p className="manifesto-text" data-words>
            <Words text={text(s.introText, lang)} />
          </p>
          <Link
            href={"/" + lang + "/studio"}
            className="orb orb-dark"
            data-magnetic="0.3"
            data-label={t.studio}
          >
            <span>{t.about}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "");
}
