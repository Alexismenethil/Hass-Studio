import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Lines } from "@/components/text";
export default async function Contact({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s } = await getContent();
  const t = copy[lang];
  return (
    <main id="main" className="contact-main">
      <section className="page-hero" data-header="light">
        <div className="page-hero-top" data-reveal>
          <span className="eyebrow">
            {t.contact} / {s.brand}
          </span>
        </div>
        <h1 className="display" data-lines>
          <Lines text={text(s.contactTitle, lang)} italicLast />
        </h1>
        <div className="page-hero-meta">
          <p className="lead" data-reveal>
            {text(s.contactText, lang)}
          </p>
        </div>
      </section>
      <div className="contact-links" data-header="light">
        {s.email && (
          <a className="contact-link" href={"mailto:" + s.email} data-reveal>
            {s.email}
            <Arrow diagonal />
          </a>
        )}
        {s.whatsapp && (
          <a
            className="contact-link"
            href={"https://wa.me/" + s.whatsapp.replace(/\D/g, "")}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
          >
            WhatsApp
            <Arrow diagonal />
          </a>
        )}
        {s.socials.map((x) => (
          <a
            key={x.label}
            className="contact-link"
            href={x.url}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
          >
            {x.label}
            <Arrow diagonal />
          </a>
        ))}
        {!s.email && !s.whatsapp && !s.socials.length && <p className="muted">{t.soon}</p>}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "/contact");
}
