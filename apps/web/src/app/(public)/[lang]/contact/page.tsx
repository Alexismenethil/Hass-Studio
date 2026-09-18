import { pageMetadata } from "@/lib/server/metadata";
import { getContent } from "@/lib/server/content";
import { text, copy, whatsappLink, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
import { Chars } from "@/components/text";
import { Media } from "@/components/media";
import { ContactForm } from "@/components/contact-form";

/** The studio on one side, a clean sheet to write on, on the other. */
export default async function Contact({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const { settings: s, categories } = await getContent();
  const t = copy[lang];
  const direct = [
    s.whatsapp && { label: t.writeWhatsapp, value: s.whatsapp, href: whatsappLink(s.whatsapp) },
    s.email && { label: t.sendEmail, value: s.email, href: "mailto:" + s.email },
  ].filter((x) => !!x);
  return (
    <main id="main" className="contact-main">
      <section className="contact" data-header="dark">
        <div className="contact-bg" aria-hidden="true">
          <Media src={s.contactImage || s.studioImage || s.heroImage} sizes="100vw" priority />
        </div>
        <div className="contact-stage">
          <div className="contact-intro">
            <span className="eyebrow" data-reveal>
              {text(s.availability, lang)}
            </span>
            <h1 className="display" data-chars>
              <Chars text={text(s.contactTitle, lang)} italicLast />
            </h1>
            <p className="contact-lead" data-reveal>
              {text(s.contactText, lang)}
            </p>
            <div className="contact-direct" data-reveal="0.08">
              {direct.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <small>{item.label}</small>
                  <b>{item.value}</b>
                  <Arrow diagonal />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="contact-panel">
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
