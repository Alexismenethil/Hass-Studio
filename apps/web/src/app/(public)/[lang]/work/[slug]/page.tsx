import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/server/content";
import { text, copy, stillOf, workCover, workMedia, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Media } from "@/components/media";
import { MirrorStage } from "@/components/mirror-stage";
import { Chars } from "@/components/text";

type Params = Promise<{ lang: Locale; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { lang, slug } = await params;
  const { works } = await getContent();
  const w = works.find((x) => x.slug === slug);
  return w
    ? {
        alternates: {
          canonical: "/" + lang + "/work/" + slug,
          languages: { en: "/en/work/" + slug, es: "/es/work/" + slug },
        },
        title: w.title,
        description: text(w.description, lang),
        openGraph: { images: [stillOf(workCover(w))].filter(Boolean) },
      }
    : {};
}

export default async function CasePage({ params }: { params: Params }) {
  const { lang, slug } = await params;
  const { works, categories } = await getContent();
  const w = works.find((x) => x.slug === slug);
  if (!w) notFound();
  const t = copy[lang];
  const service = categories.find((c) => c.id === w.category_id);
  const siblings = works.filter((x) => x.category_id === w.category_id);
  const pool = siblings.length > 1 ? siblings : works;
  const next = pool.length > 1 ? pool[(pool.indexOf(w) + 1) % pool.length] : null;
  const media = workMedia(w);
  const challenge = text(w.challenge, lang);
  const approach = text(w.approach, lang);
  const scope = w.services.filter(Boolean);
  return (
    <main id="main">
      {/* The laptop opens first; the story follows below it. */}
      {media.length > 0 && (
        <MirrorStage
          media={media}
          title={w.title}
          eyebrow={[service ? text(service.title, lang) : "", w.year].filter(Boolean).join(" · ")}
          locale={lang}
          url={w.url}
        />
      )}

      <section className={"page-hero case-hero" + (media.length ? " is-after-stage" : "")} data-header="light">
        <div className="page-hero-top" data-reveal>
          {service ? (
            <Link href={"/" + lang + "/services/" + service.id} className="back-link">
              <Arrow className="arrow-left" /> {text(service.title, lang)}
            </Link>
          ) : (
            <Link href={"/" + lang + "/work"} className="back-link">
              <Arrow className="arrow-left" /> {t.allWork}
            </Link>
          )}
          {w.concept && <span className="eyebrow">{t.concept}</span>}
        </div>
        <h1 className="display" data-chars>
          <Chars text={w.title} single />
        </h1>
        <div className="page-hero-meta">
          <p className="lead" data-reveal>
            {text(w.description, lang)}
          </p>
          <div className="case-side" data-reveal="0.08">
            <dl className="facts">
              <div>
                <dt>{t.year}</dt>
                <dd>{w.year}</dd>
              </div>
              {service && (
                <div>
                  <dt>{t.service}</dt>
                  <dd>{text(service.title, lang)}</dd>
                </div>
              )}
              {scope.length > 0 && (
                <div>
                  <dt>{t.scope}</dt>
                  <dd>{scope.join(" · ")}</dd>
                </div>
              )}
            </dl>
            {w.url && (
              <a
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="orb orb-dark"
                data-magnetic="0.3"
              >
                <span>
                  {t.live} <Arrow diagonal />
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {(challenge || approach) && (
        <section className="case-notes" data-header="light">
          {challenge && (
            <div data-reveal>
              <span className="eyebrow">{t.challenge}</span>
              <p>{challenge}</p>
            </div>
          )}
          {approach && (
            <div data-reveal="0.08">
              <span className="eyebrow">{t.approach}</span>
              <p>{approach}</p>
            </div>
          )}
        </section>
      )}

      {next && (
        <Link
          href={"/" + lang + "/work/" + next.slug}
          className="next-link"
          data-header="light"
          data-cursor={t.view}
          data-label={next.title}
        >
          <span className="eyebrow">{t.next}</span>
          <span className="next-link-title">{next.title}</span>
          <span className="next-link-media" aria-hidden="true">
            <Media src={workCover(next)} sizes="30vw" />
          </span>
          <Arrow diagonal />
        </Link>
      )}
    </main>
  );
}
