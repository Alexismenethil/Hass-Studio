import Link from "next/link";
import type { CSSProperties } from "react";
import { Arrow, SocialIcon } from "./icon";
import { Chars } from "./text";
import { Media } from "./media";
import { text, copy, type Settings, type Locale } from "@/lib/content";

/**
 * The closing scene: an invitation, a caramel button, and the studio's name
 * standing up out of the floor, letter by letter, as the page runs out.
 */
export function Footer({ settings, locale }: { settings: Settings; locale: Locale }) {
  const t = copy[locale];
  const mark = settings.brand.split(" ")[0].toUpperCase() || "HASS";
  const links = [
    ["work", "/" + locale + "/work"],
    ["services", "/" + locale + "/services"],
    ["studio", "/" + locale + "/studio"],
    ["contact", "/" + locale + "/contact"],
  ] as const;
  return (
    <footer className="foot" data-header="dark">
      <div className="foot-glow" aria-hidden="true" />
      <div className="foot-cta">
        <div className="foot-say">
          {settings.portrait && (
            <span className="foot-avatar">
              <Media src={settings.portrait} sizes="92px" />
            </span>
          )}
          <h2 data-chars>
            <Chars text={text(settings.contactTitle, locale)} italicLast />
          </h2>
        </div>
        <Link className="foot-orb" href={"/" + locale + "/contact"} data-magnetic="0.35" data-label={t.contact}>
          <span>
            {t.talk} <Arrow diagonal />
          </span>
        </Link>
      </div>

      <div className="foot-row">
        <nav className="foot-nav" aria-label={t.menu}>
          {links.map(([k, href]) => (
            <Link key={k} href={href}>
              {t[k]}
            </Link>
          ))}
        </nav>
        <div className="foot-socials">
          {settings.socials.map((s) => (
            <a
              key={s.url || s.label}
              className="foot-social"
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
          <Link className="foot-links" href={"/" + locale + "/links"}>
            Links <Arrow diagonal />
          </Link>
        </div>
        <p className="foot-legal">
          © {new Date().getFullYear()} {settings.brand} · {t.made}
        </p>
      </div>

      <div className="foot-mark" aria-hidden="true">
        {Array.from(mark).map((char, i) => (
          <span key={i} style={{ "--mi": i, "--mc": mark.length } as CSSProperties}>
            {char}
          </span>
        ))}
      </div>
    </footer>
  );
}
