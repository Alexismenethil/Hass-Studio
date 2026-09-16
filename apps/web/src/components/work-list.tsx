"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Media } from "./media";
import { Arrow } from "./icon";
import { copy, pad, type Locale } from "@/lib/content";

export type WorkRow = {
  slug: string;
  title: string;
  year: number;
  cover: string;
  scope: string;
};
export type WorkGroup = { id: string; title: string; rows: WorkRow[] };

/** Rows of work; on desktop a small window of covers follows the pointer. */
export function WorkList({ groups, locale }: { groups: WorkGroup[]; locale: Locale }) {
  const t = copy[locale];
  const covers = groups.flatMap((g) => g.rows.map((r) => r.cover));
  const preview = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(-1);
  useEffect(() => {
    const el = preview.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    let x = window.innerWidth / 2,
      y = window.innerHeight / 2,
      cx = x,
      cy = y,
      frame = 0;
    const loop = () => {
      cx += (x - cx) * 0.14;
      cy += (y - cy) * 0.14;
      el.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      frame = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  let index = -1;
  return (
    <div className="work-list" onPointerLeave={() => setHovered(-1)}>
      {groups.map((group) => (
        <section key={group.id} className="work-group" aria-label={group.title}>
          <header className="work-group-head" data-reveal>
            <span className="eyebrow">{group.title}</span>
            <Link href={"/" + locale + "/services/" + group.id} className="text-link">
              {t.service} <Arrow diagonal />
            </Link>
          </header>
          {group.rows.map((row) => {
            const n = ++index;
            return (
              <Link
                key={row.slug}
                href={"/" + locale + "/work/" + row.slug}
                className={"work-row" + (hovered === n ? " is-hovered" : "")}
                onPointerEnter={() => setHovered(n)}
                data-cursor={t.view}
                data-label={row.title}
                data-reveal
              >
                <span className="work-row-thumb">
                  <Media src={row.cover} sizes="120px" />
                </span>
                <span className="work-row-index">{pad(n + 1)}</span>
                <h3>{row.title}</h3>
                <span className="work-row-scope">{row.scope}</span>
                <span className="work-row-year">{row.year}</span>
              </Link>
            );
          })}
        </section>
      ))}
      <div
        ref={preview}
        className={"work-preview" + (hovered >= 0 ? " is-on" : "")}
        aria-hidden="true"
      >
        <div
          className="work-preview-strip"
          style={{ transform: `translateY(${-Math.max(hovered, 0) * 100}%)` }}
        >
          {covers.map((src, i) => (
            <span key={i}>
              <Media src={src} sizes="420px" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
