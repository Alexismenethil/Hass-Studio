import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, pad, workCover, type Locale } from "@/lib/content";
import { Chars } from "@/components/text";
import { WorkList, type WorkGroup } from "@/components/work-list";

export default async function WorkPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings, categories, works } = await getContent();
  const t = copy[lang];
  const groups: WorkGroup[] = categories
    .map((c) => ({
      id: c.id,
      title: text(c.title, lang),
      rows: works
        .filter((w) => w.category_id === c.id)
        .map((w) => ({
          slug: w.slug,
          title: w.title,
          year: w.year,
          cover: workCover(w),
          scope: w.services.filter(Boolean).slice(0, 2).join(" · "),
        })),
    }))
    .filter((g) => g.rows.length);
  return (
    <main id="main">
      <section className="page-hero" data-header="light">
        <div className="page-hero-top" data-reveal>
          <span className="eyebrow">
            {t.work} / {settings.brand}
          </span>
          <span className="eyebrow">{pad(works.length)}</span>
        </div>
        <h1 className="display" data-chars>
          <Chars text={text(settings.workTitle, lang)} italicLast />
        </h1>
      </section>
      <section className="works-section" data-header="light">
        {groups.length ? (
          <WorkList groups={groups} locale={lang} />
        ) : (
          <p className="empty-state">{t.empty}</p>
        )}
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "/work");
}
