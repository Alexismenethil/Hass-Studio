import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/server/content";
import { copy, pad, text, workCover, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Media } from "@/components/media";
import { Lines } from "@/components/text";
import { WorkCards } from "@/components/work-cards";

type Params = Promise<{ lang: Locale; id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { lang, id } = await params;
  const { categories } = await getContent();
  const c = categories.find((x) => x.id === id);
  return c
    ? {
        title: text(c.title, lang),
        description: text(c.description, lang).replace(/\n/g, " "),
        alternates: {
          canonical: "/" + lang + "/services/" + id,
          languages: { en: "/en/services/" + id, es: "/es/services/" + id },
        },
      }
    : {};
}

export default async function ServicePage({ params }: { params: Params }) {
  const { lang, id } = await params;
  const { settings, categories, works } = await getContent();
  const index = categories.findIndex((c) => c.id === id);
  if (index < 0) notFound();
  const service = categories[index];
  const own = works.filter((w) => w.category_id === id);
  const next = categories.length > 1 ? categories[(index + 1) % categories.length] : null;
  const nextCover = next
    ? next.image || works.filter((w) => w.category_id === next.id).map(workCover)[0] || ""
    : "";
  const cover = service.image || own.map(workCover)[0] || settings.heroImage;
  const t = copy[lang];
  return (
    <main id="main">
      <section className="page-hero" data-header="light">
        <div className="page-hero-top" data-reveal>
          <Link href={"/" + lang + "#services"} className="back-link">
            <Arrow className="arrow-left" /> {t.allServices}
          </Link>
          <span className="eyebrow">
            {t.service} {pad(index + 1)} / {pad(categories.length)}
          </span>
        </div>
        <h1 className="display" data-lines>
          <Lines text={text(service.title, lang)} />
        </h1>
        <div className="page-hero-meta">
          <p className="lead" data-reveal>
            {text(service.description, lang).replace(/\n/g, " ")}
          </p>
          <dl className="facts" data-reveal="0.08">
            {text(service.services, lang) && (
              <div>
                <dt>{t.includes}</dt>
                <dd>{text(service.services, lang)}</dd>
              </div>
            )}
            <div>
              <dt>{t.projects}</dt>
              <dd>{pad(own.length)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="wide-media" data-expand>
        <div className="wide-media-drift" data-parallax="8">
          <Media src={cover} sizes="100vw" alt="" priority />
        </div>
      </div>

      <section className="works-section" data-header="light">
        <header className="works-head" data-reveal>
          <span className="eyebrow">{t.selectedWork}</span>
          <span className="works-count">{pad(own.length)}</span>
        </header>
        {own.length ? (
          <WorkCards works={own} locale={lang} />
        ) : (
          <p className="empty-state">{t.empty}</p>
        )}
      </section>

      {next && (
        <Link
          href={"/" + lang + "/services/" + next.id}
          className="next-link"
          data-header="light"
          data-cursor={t.view}
        >
          <span className="eyebrow">{t.nextService}</span>
          <span className="next-link-title">{text(next.title, lang)}</span>
          <span className="next-link-media" aria-hidden="true">
            <Media src={nextCover} sizes="30vw" />
          </span>
          <Arrow diagonal />
        </Link>
      )}
    </main>
  );
}
