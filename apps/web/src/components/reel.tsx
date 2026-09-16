"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Media } from "./media";
import { Arrow } from "./icon";
import { Chars } from "./text";
import { copy, pad, type Locale } from "@/lib/content";
import { clamp, useScene } from "@/lib/scene";

export type ReelItem = {
  slug: string;
  title: string;
  service: string;
  year: number;
  cover: string;
};

const shapes = ["is-arch", "is-tall", "is-wide"];

/** Selected work travels sideways like a strip of film while the page scrolls down. */
export function Reel({
  items,
  title,
  total,
  locale,
}: {
  items: ReelItem[];
  title: string;
  total: number;
  locale: Locale;
}) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const motion = useRef({
    x: 0,
    skew: 0,
    distance: 0,
    cards: [] as { node: HTMLElement; center: number }[],
  });

  useEffect(() => {
    const el = root.current;
    const row = track.current;
    if (!el || !row) return;
    const measure = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.style.height = "";
        return;
      }
      const distance = Math.max(0, row.scrollWidth - window.innerWidth);
      motion.current.distance = distance;
      // Card centres along the strip, so scrolling never has to measure layout.
      motion.current.cards = Array.from(row.querySelectorAll<HTMLElement>(".reel-card")).map((node) => ({
        node,
        center: node.offsetLeft + node.offsetWidth / 2,
      }));
      el.style.height = window.innerHeight + distance + "px";
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useScene(root, ({ p, vw, dt, reduced }) => {
    const row = track.current;
    const el = root.current;
    if (!row || !el || reduced) return;
    const m = motion.current;
    const x = -p * m.distance;
    const velocity = dt > 0 ? (x - m.x) / dt : 0;
    m.x = x;
    m.skew += (clamp(velocity / 900, -1, 1) * 5 - m.skew) * (1 - Math.exp(-dt * 8));
    row.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    el.style.setProperty("--skew", m.skew.toFixed(3) + "deg");
    el.style.setProperty("--p", p.toFixed(4));
    m.cards.forEach(({ node, center }) => {
      node.style.setProperty("--o", ((center + x - vw / 2) / vw).toFixed(4));
    });
  });

  if (!items.length) return null;
  return (
    <section ref={root} className="reel" data-header="light" aria-label={t.selectedWork}>
      <div className="reel-sticky">
        <div ref={track} className="reel-track">
          <header className="reel-intro">
            <span className="eyebrow">
              {t.selectedWork} <sup>{pad(total)}</sup>
            </span>
            <h2 data-chars>
              <Chars text={title} italicLast />
            </h2>
          </header>
          {items.map((item, i) => (
            <Link
              key={item.slug}
              href={"/" + locale + "/work/" + item.slug}
              className={"reel-card " + shapes[i % shapes.length]}
              data-cursor={t.view}
              data-label={item.title}
              style={{ "--i": i } as CSSProperties}
            >
              <span className="reel-frame">
                <span className="reel-drift">
                  <Media src={item.cover} alt={item.title} sizes="(max-width: 767px) 75vw, 34vw" />
                </span>
              </span>
              <span className="reel-meta">
                <b>{pad(i + 1)}</b>
                <strong>{item.title}</strong>
                <small>
                  {item.service} · {item.year}
                </small>
              </span>
            </Link>
          ))}
          <Link href={"/" + locale + "/work"} className="reel-end" data-magnetic="0.3" data-label={t.allWork}>
            <span>
              {t.allWork} <Arrow diagonal />
            </span>
          </Link>
        </div>
        <div className="reel-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
