"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "./icon";
import { copy, type Locale, type Settings } from "@/lib/content";
export function SiteNav({
  locale,
  settings,
}: {
  locale: Locale;
  settings: Settings;
}) {
  const search = useSearchParams();
  const path = usePathname(),
    t = copy[locale],
    header = useRef<HTMLElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    [dark, setDark] = useState(false),
    [hidden, setHidden] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const other = locale === "en" ? "es" : "en";
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  // Follow the section under the bar: light text on dark scenes, hide while reading down.
  useEffect(() => {
    let frame = 0,
      last = window.scrollY;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const bar = header.current;
      if (!bar) return;
      const under = document
        .elementsFromPoint(window.innerWidth / 2, bar.offsetHeight / 2)
        .find((el) => !bar.contains(el));
      setDark(under?.closest("[data-header]")?.getAttribute("data-header") === "dark");
      setScrolled(y > 40);
      if (y > 220 && y > last + 4) setHidden(true);
      else if (y < last - 4 || y <= 220) setHidden(false);
      last = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const settle = window.setTimeout(update, 120);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [path]);
  useEffect(() => {
    dialog.current?.close();
  }, [path]);
  const links = [
    ["work", "/" + locale + "/work"],
    ["studio", "/" + locale + "/studio"],
    ["contact", "/" + locale + "/contact"],
  ] as const;
  return (
    <>
      <a className="skip-link" href="#main">
        {locale === "en" ? "Skip to content" : "Saltar al contenido"}
      </a>
      <header
        ref={header}
        className={
          "site-header" +
          (dark ? " on-dark" : " on-light") +
          (scrolled ? " is-scrolled" : "") +
          (hidden ? " is-hidden" : "")
        }
      >
        <Link
          className="wordmark"
          href={"/" + locale}
          aria-label={settings.brand + " " + t.home}
        >
          {settings.logo ? (
            <Image src={settings.logo} width={110} height={46} alt={settings.brand} />
          ) : (
            <>
              <span>HASS</span>
              <small>STUDIO</small>
            </>
          )}
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          {links.map(([k, href]) => (
            <Link
              key={k}
              className={path.startsWith(href) || (k === "work" && path.includes("/services/")) ? "active" : ""}
              href={href}
            >
              {t[k]}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <Link
            className="language-switch"
            href={
              path.replace(/^\/(en|es)/, "/" + other) +
              (search.size ? "?" + search.toString() : "")
            }
            aria-label={other === "es" ? "Cambiar a español" : "Switch to English"}
          >
            <span className={locale === "en" ? "current" : ""}>EN</span>
            <i>/</i>
            <span className={locale === "es" ? "current" : ""}>ES</span>
          </Link>
          <Link className="nav-cta" href={"/" + locale + "/contact"} data-magnetic="0.25">
            <span>{t.talk}</span>
            <Arrow diagonal />
          </Link>
          <button
            className="menu-button"
            aria-label={t.menu}
            onClick={() => dialog.current?.showModal()}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <dialog ref={dialog} className="mobile-menu">
        <div className="menu-top">
          <span>HASS STUDIO</span>
          <button onClick={() => dialog.current?.close()} aria-label={t.close}>
            ×
          </button>
        </div>
        <nav>
          {links.map(([k, href], i) => (
            <Link key={k} href={href} onClick={() => dialog.current?.close()}>
              <small>0{i + 1}</small>
              {t[k]}
              <Arrow diagonal />
            </Link>
          ))}
        </nav>
        <p>{settings.name}</p>
      </dialog>
    </>
  );
}
