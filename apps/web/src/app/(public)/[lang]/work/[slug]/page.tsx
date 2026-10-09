import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/server/content";
import { text, copy, isVideo, stillOf, workCover, workMedia, type Locale } from "@/lib/content";
import { shapesOf } from "@/lib/server/shape";
import { sizedSource } from "@/lib/media";
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
  // Every project leads to the next one, round the whole portfolio.
  const next = works.length > 1 ? works[(works.indexOf(w) + 1) % works.length] : null;
  const challenge = text(w.challenge, lang);
  const approach = text(w.approach, lang);
  const scope = w.services.filter(Boolean);
  const stills = Array.from(new Set([w.cover, ...w.gallery].filter((m) => m && !isVideo(m))));
  const shapes = await shapesOf(stills);
  // The laptop plays the first few page screens (a phone screen belongs in a
  // phone); the rest are laid out below it, so the scene stays a short walk
  // however many pictures a project has.
  const all = workMedia(w);
  const screens = all.filter((m) => shapes.get(m) !== "tall");
  const media = (screens.length ? screens : all).slice(0, 4);
  const pages = stills.filter((m) => shapes.get(m) !== "tall" && !media.includes(m)).slice(0, 6);
  const phones = stills.filter((m) => shapes.get(m) === "tall").slice(0, 8);
  return (
    <main id="main">
      {/* The laptop opens first; the story follows below it. */}
      {media.length > 0 && (
        <MirrorStage
          media={media}
          title={w.title}
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
        <h1 className="display" data-chars style={{ "--len": w.title.length } as CSSProperties}>
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
        <section className="case-notes" data-header="dark">
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

      {(pages.length > 0 || phones.length > 0) && (
        <section className="case-shots" data-header="dark" aria-label={w.title}>
          {pages.map((src, i) => (
            <figure key={src} className="cshot" data-tilt>
              <span className="cshot-window">
                <span className="cshot-bar" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sizedSource(src, 1800)}
                  alt={w.title + " — " + (i + 1)}
                  loading="lazy"
                  decoding="async"
                  width={1600}
                  height={1000}
                />
              </span>
            </figure>
          ))}
          {phones.length > 0 && (
            <div className="cphones">
              {phones.map((src, i) => (
                <span key={src} className="ch-phone-body" data-tilt>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sizedSource(src, 540)} alt={w.title + (lang === "en" ? " — mobile " : " — móvil ") + (i + 1)} loading="lazy" decoding="async" />
                </span>
              ))}
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
