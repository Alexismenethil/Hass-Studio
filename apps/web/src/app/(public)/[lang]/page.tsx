import Link from "next/link";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { shapesOf } from "@/lib/server/shape";
import { text, copy, isVideo, pad, workCover, workMedia, type Locale, type Work } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Media } from "@/components/media";
import { Words } from "@/components/text";
import { HeroFlight, type FlightCard } from "@/components/hero-flight";
import { WorkChapters, type Chapter } from "@/components/work-chapters";

const stillsOf = (w: Work) =>
  Array.from(new Set([w.cover, ...w.gallery].filter((m) => m && !isVideo(m))));

/** The journey: a flight through the work, the work itself, the studio behind it. */
export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, works, categories } = await getContent();
  const t = copy[lang];
  const featured = works.filter((w) => w.featured);
  const shown = (featured.length ? featured : works).slice(0, 6);
  const shapes = await shapesOf(shown.flatMap(stillsOf));
  const service = (w: Work) => {
    const c = categories.find((x) => x.id === w.category_id);
    return c ? text(c.title, lang) : "";
  };

  // Every picture of the work, project after project, a phone every third card.
  const queues = shown.map((w) => {
    const stills = stillsOf(w);
    return {
      w,
      wide: stills.filter((m) => shapes.get(m) !== "tall"),
      tall: stills.filter((m) => shapes.get(m) === "tall"),
    };
  });
  const cards: FlightCard[] = [];
  for (let round = 0; cards.length < 18 && queues.some((q) => q.wide.length || q.tall.length); round++)
    for (const q of queues) {
      if (cards.length >= 18) break;
      const wantTall = (cards.length + 1) % 3 === 0;
      const from = (wantTall ? q.tall : q.wide).length ? (wantTall ? q.tall : q.wide) : wantTall ? q.wide : q.tall;
      const src = from.shift();
      if (!src) continue;
      cards.push({
        src,
        tall: shapes.get(src) === "tall",
        title: q.w.title,
        label: service(q.w),
        href: "/" + lang + "/work/" + q.w.slug,
      });
    }

  const chapters: Chapter[] = shown.map((w) => {
    const stills = stillsOf(w);
    return {
      slug: w.slug,
      title: w.title,
      label: service(w),
      year: w.year,
      description: text(w.description, lang),
      screen: workMedia(w)[0] || workCover(w),
      phone: stills.find((m) => shapes.get(m) === "tall") || "",
      aura: workCover(w),
    };
  });

  return (
    <main id="main">
      <HeroFlight
        cards={cards}
        title={text(s.heroTitle, lang)}
        locale={lang}
      />

      {chapters.length > 0 && (
        <WorkChapters items={chapters} heading={text(s.workTitle, lang)} locale={lang} />
      )}

      <section className="note" data-header="light">
        <div className="note-grid">
          <div className="note-copy">
            <p className="note-text" data-words>
              <Words text={text(s.introText, lang)} />
            </p>
            <Link href={"/" + lang + "/studio"} className="text-link" data-reveal>
              {t.about} <Arrow />
            </Link>
          </div>
          <figure className="note-figure" data-arch>
            <div className="note-drift" data-parallax>
              <Media src={s.detailImage || s.studioImage} sizes="(max-width: 859px) 80vw, 34vw" alt="" />
            </div>
          </figure>
        </div>

        {categories.length > 0 && (
          <div className="rows">
            <p className="eyebrow rows-head" data-reveal>
              {t.services}
            </p>
            {categories.map((c, i) => {
              const own = works.filter((w) => w.category_id === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={"/" + lang + "/services/" + c.id}
                  className="row"
                  data-reveal
                  data-cursor={t.view}
                >
                  <span className="row-index">{pad(i + 1)}</span>
                  <span className="row-title">{text(c.title, lang)}</span>
                  <span className="row-includes">{text(c.services, lang)}</span>
                  <span className="row-count">
                    {own > 0 ? pad(own) : ""}
                    <Arrow diagonal />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "");
}
