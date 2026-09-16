import Link from "next/link";
import { getImageProps } from "next/image";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, isVideo, workCover, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Media } from "@/components/media";
import { Lines, Words } from "@/components/text";
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
  const alt =
    lang === "en"
      ? "Warm coastal stone, olive branches and a quiet sea"
      : "Piedra cálida, ramas de olivo y un mar sereno";
  const art = (src: string, width: number, height: number) =>
    getImageProps({
      src,
      alt,
      width,
      height,
      sizes: "100vw",
      quality: 75,
      loading: "eager",
      fetchPriority: "high",
    }).props;
  const desktop = !isVideo(s.heroImage) && s.heroImage ? art(s.heroImage, 1920, 1080) : null;
  const mobile =
    s.heroMobileImage && !isVideo(s.heroMobileImage) ? art(s.heroMobileImage, 900, 1600) : null;
  return (
    <main id="main">
      <section className="hero" data-header="dark">
        <div className="hero-frame">
          <div className="hero-media">
            {desktop ? (
              <picture>
                {mobile && <source media="(max-width: 767px)" srcSet={mobile.srcSet} />}
                <img {...desktop} alt={alt} className="media" />
              </picture>
            ) : (
              <Media src={s.heroImage} alt={alt} priority />
            )}
          </div>
          <div className="hero-shade" />
          <div className="hero-content">
            <h1 className="hero-title">
              <Lines text={text(s.heroTitle, lang)} italicLast />
            </h1>
            {text(s.heroDescription, lang) && (
              <p className="hero-sub">{text(s.heroDescription, lang).replace(/\n/g, " ")}</p>
            )}
          </div>
          <a className="hero-scroll" href="#services">
            <span>{t.scroll}</span>
            <i />
          </a>
        </div>
      </section>

      <ServicesCarousel slides={slides} locale={lang} />

      <section className="statement" data-header="light">
        <span className="eyebrow statement-label" data-reveal>
          {s.brand}
        </span>
        <h2 className="statement-title" data-words>
          <Words text={text(s.introTitle, lang)} />
        </h2>
        <div className="statement-foot">
          <p data-reveal>{text(s.introText, lang)}</p>
          <Link
            href={"/" + lang + "/studio"}
            className="orb orb-dark"
            data-magnetic="0.3"
            data-reveal="0.1"
          >
            <span>{t.about}</span>
          </Link>
        </div>
        {works.length > 0 && (
          <Link href={"/" + lang + "/work"} className="statement-all text-link" data-reveal>
            {t.allWork} <sup>{works.length}</sup>
            <Arrow diagonal />
          </Link>
        )}
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "");
}
