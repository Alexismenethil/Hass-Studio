"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Arrow } from "./icon";
import { Media } from "./media";
import { copy, pad, type Locale } from "@/lib/content";

export type ServiceSlide = {
  id: string;
  title: string;
  tagline: string;
  includes: string;
  media: string;
  covers: string[];
  count: number;
};

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Rotates through the service's own designs while its card is in front. */
function CardCovers({ covers, active }: { covers: string[]; active: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!active || covers.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setShown((n) => (n + 1) % covers.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, [active, covers.length]);
  return (
    <>
      {covers.map((src, i) => (
        <span
          key={src + i}
          className={"svc-cover" + (i === shown ? " is-shown" : "")}
        >
          <Media src={src} sizes="(max-width: 767px) 55vw, 22vw" />
        </span>
      ))}
    </>
  );
}

export function ServicesCarousel({
  slides,
  locale,
}: {
  slides: ServiceSlide[];
  locale: Locale;
}) {
  const t = copy[locale];
  const n = slides.length;
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);

  const go = useCallback(
    (index: number) => {
      const el = root.current;
      if (!el || n < 2) return;
      const next = clamp(index, 0, n - 1);
      const total = el.offsetHeight - window.innerHeight;
      const top = window.scrollY + el.getBoundingClientRect().top;
      window.scrollTo({
        top: top + (total * next) / (n - 1) + 1,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    },
    [n],
  );

  useEffect(() => {
    const el = root.current;
    const row = track.current;
    if (!el || !row || !n) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const titles = Array.from(row.querySelectorAll<HTMLElement>(".svc-title"));
    const backgrounds = Array.from(el.querySelectorAll<HTMLElement>(".svc-bg-item"));
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".svc-card-item"));
    const bar = el.querySelector<HTMLElement>(".svc-progress i");
    let centers: number[] = [];
    let smooth = -1;
    let drawn = -1;
    let current = -1;
    let frame = 0;
    let running = false;
    const measure = () => {
      centers = titles.map((title) => title.offsetLeft + title.offsetWidth / 2);
      drawn = -1;
    };
    // Scroll position → slide position, lingering gently on each service.
    const target = () => {
      if (n < 2) return 0;
      const total = el.offsetHeight - window.innerHeight;
      const raw = total > 0 ? clamp(-el.getBoundingClientRect().top / total) : 0;
      const p = raw * (n - 1);
      if (reduced.matches) return Math.round(p);
      const i = Math.min(Math.floor(p), n - 2);
      const f = p - i;
      return i + f - (0.5 * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);
    };
    const render = (p: number) => {
      const i = Math.min(Math.floor(p), n - 1);
      const f = p - i;
      const from = centers[i] ?? 0;
      const to = centers[Math.min(i + 1, n - 1)] ?? from;
      row.style.transform = `translate3d(${-(from + (to - from) * f)}px,0,0)`;
      titles.forEach((title, k) => {
        title.style.opacity = String(1 - Math.min(1, Math.abs(k - p)) * 0.74);
      });
      backgrounds.forEach((bg, k) => {
        // Hold each photograph fully, then cross quickly around the midpoint.
        const v = clamp((1 - Math.abs(k - p) - 0.18) / 0.64);
        bg.style.opacity = String(v);
        bg.style.setProperty("--v", v.toFixed(4));
      });
      cards.forEach((card, k) => {
        card.style.setProperty("--r", (k === 0 ? 1 : clamp(p - (k - 1))).toFixed(4));
      });
      if (bar) bar.style.transform = `scaleX(${n > 1 ? (p / (n - 1)).toFixed(4) : 1})`;
      const index = Math.round(p);
      if (index !== current) {
        current = index;
        setActive(index);
      }
    };
    const loop = () => {
      const goal = target();
      smooth = smooth < 0 || reduced.matches ? goal : smooth + (goal - smooth) * 0.22;
      if (Math.abs(goal - smooth) < 0.0004) smooth = goal;
      if (smooth !== drawn) {
        render(smooth);
        drawn = smooth;
      }
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "25% 0px" },
    );
    const resize = new ResizeObserver(measure);
    measure();
    render(target());
    observer.observe(el);
    resize.observe(row);
    document.fonts?.ready.then(measure);
    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
    };
  }, [n]);

  if (!n) return null;
  const slide = slides[active] ?? slides[0];
  return (
    <section
      ref={root}
      id="services"
      className="svc"
      data-header="dark"
      aria-roledescription="carousel"
      aria-label={t.services}
      style={{ "--n": n } as CSSProperties}
    >
      <div
        className="svc-sticky"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button === 0)
            drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 8)
            drag.current.moved = true;
        }}
        onPointerUp={(e) => {
          const start = drag.current;
          if (start && Math.abs(e.clientX - start.x) > 60)
            go(active + (e.clientX < start.x ? 1 : -1));
          // The click (if any) is dispatched right after; forget the drag once it has passed.
          window.setTimeout(() => {
            drag.current = null;
          }, 0);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (drag.current?.moved) e.preventDefault();
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(active + (e.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <div className="svc-bg" aria-hidden="true">
          {slides.map((s) => (
            <div className="svc-bg-item" key={s.id}>
              <Media src={s.media} sizes="100vw" />
            </div>
          ))}
          <div className="svc-shade" />
        </div>

        <div className="svc-top">
          <span className="eyebrow">{t.services}</span>
          <span className="svc-count" aria-live="polite">
            <b>{pad(active + 1)}</b>
            <i />
            {pad(n)}
          </span>
        </div>

        <p className="svc-tagline" key={"tag-" + active}>
          {slide.tagline}
        </p>

        <div className="svc-track-wrap">
          <div ref={track} className="svc-track">
            {slides.map((s, i) => (
              <Link
                key={s.id}
                href={"/" + locale + "/services/" + s.id}
                className="svc-title"
                data-cursor={t.view}
                aria-current={i === active ? "true" : undefined}
                tabIndex={i === active ? 0 : -1}
                draggable={false}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="svc-card">
          {slides.map((s, i) => (
            <Link
              key={s.id}
              href={"/" + locale + "/services/" + s.id}
              className="svc-card-item"
              data-cursor={t.view}
              aria-hidden={i !== active}
              tabIndex={-1}
              draggable={false}
            >
              <CardCovers covers={s.covers} active={i === active} />
              <span className="svc-card-label">
                {pad(s.count)} {t.projects}
              </span>
            </Link>
          ))}
        </div>

        <div className="svc-bottom">
          <p className="svc-includes" key={"inc-" + active}>
            <span className="eyebrow">{t.includes}</span>
            {slide.includes}
          </p>
          {n > 1 && (
            <div className="svc-controls">
              <button
                type="button"
                onClick={() => go(active - 1)}
                disabled={active === 0}
                aria-label={t.previous}
                data-magnetic
              >
                <Arrow className="arrow-left" />
              </button>
              <div className="svc-progress" aria-hidden="true">
                <i />
              </div>
              <button
                type="button"
                onClick={() => go(active + 1)}
                disabled={active === n - 1}
                aria-label={t.following}
                data-magnetic
              >
                <Arrow />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
