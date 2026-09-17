import Link from "next/link";
import { Arrow, SocialIcon } from "./icon";
import { Chars } from "./text";
import { Sun } from "./cinema";
import { Media } from "./media";
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
              <Media src={settings.portrait} sizes="92px" />
            </span>
          )}
          <h2 data-chars>
            <Chars text={text(settings.contactTitle, locale)} italicLast />
          </h2>
        </div>
        <div className="footer-horizon">
          <div className="footer-sky" aria-hidden="true">
            <span className="footer-glow" />
            <span className="footer-rise">
              <span className="footer-disc" />
              <Sun className="footer-sun" />
            </span>
          </div>
          <span className="footer-sea" aria-hidden="true" />
          <Link
            className="footer-orb"
            href={"/" + locale + "/contact"}
            data-magnetic="0.35"
            data-label={t.contact}
          >
            <span>{t.hello}</span>
          </Link>
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
                <a
                  key={s.url || s.label}
                  className="footer-social"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  data-magnetic="0.35"
                >
                  <SocialIcon url={s.url} />
                </a>
              ))}
              <Link className="footer-links" href={"/" + locale + "/links"}>
                Links <Arrow diagonal />
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
