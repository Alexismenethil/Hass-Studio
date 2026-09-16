import Link from "next/link";
import Image from "next/image";
import { Arrow } from "./icon";
import { Lines } from "./text";
import { text, copy, type Settings, type Locale } from "@/lib/content";
export function Footer({
  settings,
  locale,
}: {
  settings: Settings;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <footer className="site-footer" data-header="dark">
      <div className="footer-curve" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-head">
          {settings.portrait && (
            <span className="footer-avatar">
              <Image src={settings.portrait} fill sizes="72px" alt="" />
            </span>
          )}
          <h2>
            <Lines text={text(settings.contactTitle, locale)} italicLast />
          </h2>
        </div>
        <div className="footer-rule">
          <Link
            className="footer-orb"
            href={"/" + locale + "/contact"}
            data-magnetic="0.35"
          >
            <span>{t.hello}</span>
          </Link>
        </div>
        <div className="footer-pills">
          {settings.email && (
            <a className="pill pill-ghost" href={"mailto:" + settings.email}>
              {settings.email}
            </a>
          )}
          {settings.whatsapp && (
            <a
              className="pill pill-ghost"
              href={"https://wa.me/" + settings.whatsapp.replace(/\D/g, "")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp · {settings.whatsapp}
            </a>
          )}
        </div>
        <div className="footer-bottom">
          <div>
            <small>{settings.brand}</small>
            <span>
              © {new Date().getFullYear()} · {t.made}
            </span>
          </div>
          <div className="footer-socials">
            <small>Socials</small>
            <span>
              {settings.socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
              <Link href={"/" + locale + "/links"}>
                Links <Arrow diagonal />
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
