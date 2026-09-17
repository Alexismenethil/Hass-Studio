import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, whatsappLink, type Locale } from "@/lib/content";
import { SocialIcon } from "@/components/icon";
import { Chars } from "@/components/text";
import { Media } from "@/components/media";
import { ContactForm, LocalTime } from "@/components/contact-form";

export default async function Contact({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, categories } = await getContent();
  const t = copy[lang];
  const direct = [
    s.whatsapp && { href: whatsappLink(s.whatsapp), label: t.writeWhatsapp, external: true },
    s.email && { href: "mailto:" + s.email, label: t.sendEmail, external: false },
  ].filter((x) => !!x);
  return (
    <main id="main" className="contact-main">
      <section className="contact-hero" data-header="dark">
        <div className="contact-bg" aria-hidden="true">
          <Media src={s.contactImage || s.studioImage || s.heroImage} sizes="100vw" priority />
        </div>

        <div className="contact-intro">
          <div className="contact-meta" data-reveal>
            <span className="contact-status">
              <i /> {text(s.availability, lang)}
            </span>
            <LocalTime locale={lang} label={t.local} />
          </div>
          <h1 className="display" data-chars>
            <Chars text={text(s.contactTitle, lang)} italicLast />
          </h1>
          <p className="contact-lead" data-reveal>
            {text(s.contactText, lang)}
          </p>
          <div className="contact-links" data-reveal="0.08">
            {direct.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-label={item.label}
                data-magnetic="0.2"
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <SocialIcon url={item.href} />
                {item.label}
              </a>
            ))}
            {s.socials.map((x) => (
              <a
                key={x.url || x.label}
                className="is-icon"
                href={x.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={x.label}
                title={x.label}
                data-magnetic="0.35"
              >
                <SocialIcon url={x.url} />
              </a>
            ))}
          </div>
        </div>

        <div className="contact-panel" data-reveal="0.12">
          <ContactForm
            locale={lang}
            services={categories.map((c) => text(c.title, lang)).filter(Boolean)}
            email={s.email}
            whatsapp={s.whatsapp}
          />
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return pageMetadata(lang, "/contact");
}
