import Link from "next/link";
import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, workCover, type Locale } from "@/lib/content";
import { Chars } from "@/components/text";
import { Media } from "@/components/media";

export default async function WorkPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings, works } = await getContent();
  const t = copy[lang];
  return (
    <main id="main">
      <section className="page-hero" data-header="light">
        <h1 className="display" data-chars>
          <Chars text={text(settings.workTitle, lang)} italicLast />
        </h1>
      </section>
      <section className="wgrid" data-header="light">
        {works.length ? (
          works.map((w) => (
            <Link key={w.slug} href={"/" + lang + "/work/" + w.slug} className="wcard" data-cursor={t.view}>
              <span className="wcard-media" data-tilt>
                <Media src={workCover(w)} sizes="(max-width: 859px) 92vw, 46vw" alt={w.title} />
              </span>
              <span className="wcard-meta">
                <span className="wcard-title">{w.title}</span>
              </span>
              <span className="wcard-text">{text(w.description, lang)}</span>
            </Link>
          ))
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
