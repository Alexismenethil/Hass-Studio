import Link from "next/link";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, workCover, workMedia, type Locale } from "@/lib/content";
import { Media } from "@/components/media";
import { Words } from "@/components/text";
import { Opening } from "@/components/opening";
import { Gallery, type GalleryItem } from "@/components/gallery";

/** The journey: the arch of light, the projects, the studio behind them. */
export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, works } = await getContent();
  const t = copy[lang];
  const featured = works.filter((w) => w.featured);
  const items: GalleryItem[] = (featured.length >= 3 ? featured : works).slice(0, 5).map((w) => ({
    slug: w.slug,
    title: w.title,
    cover: workCover(w),
    media: workMedia(w),
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

      <Gallery items={items} locale={lang} />

      <section className="manifesto" data-header="light">
        <div className="manifesto-window" data-arch>
          <div className="manifesto-drift" data-parallax>
            <Media src={s.detailImage || s.studioImage} sizes="(max-width: 859px) 70vw, 30vw" alt="" />
          </div>
        </div>
        <div className="manifesto-copy">
          <span className="eyebrow" data-reveal>
            {text(s.availability, lang)}
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
