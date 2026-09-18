import Link from "next/link";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, pad, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Media } from "@/components/media";
import { Chars, Words } from "@/components/text";
export default async function Studio({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, categories, works } = await getContent();
  const t = copy[lang];
  return (
    <main id="main">
      <section className="page-hero" data-header="light">
        <div className="page-hero-top" data-reveal>
          <span className="eyebrow">
            {t.studio} / {s.brand}
          </span>
          <span className="eyebrow">{text(s.availability, lang)}</span>
        </div>
        <h1 className="display" data-chars>
          <Chars text={text(s.studioTitle, lang)} italicLast />
        </h1>
      </section>
      <section className="portrait-section" data-header="light">
        <div className="portrait-frame" data-arch>
          <div className="portrait-drift" data-parallax>
            <Media
              src={s.portrait || s.detailImage}
              sizes="(max-width:768px) 90vw, 40vw"
              alt={s.portrait ? s.name : ""}
              priority
            />
          </div>
        </div>
        <div className="portrait-copy">
          <h2 data-reveal>{s.name}</h2>
          <p data-words>
            <Words text={text(s.studioText, lang)} />
          </p>
        </div>
      </section>
      <section className="service-list" data-header="light">
        <span className="eyebrow" data-reveal>
          {t.services}
        </span>
        {categories.map((c, i) => (
          <Link
            href={"/" + lang + "/services/" + c.id}
            className="service-row"
            key={c.id}
            data-reveal
            data-cursor={t.view}
          >
            <span className="eyebrow">{pad(i + 1)}</span>
            <h3>{text(c.title, lang)}</h3>
            <p>{text(c.services, lang)}</p>
            <span className="service-row-count">
              {pad(works.filter((w) => w.category_id === c.id).length)}
              <Arrow diagonal />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "/studio");
}
