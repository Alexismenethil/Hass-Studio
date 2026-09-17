"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Arrow } from "./icon";
import { Chars } from "./text";
import { Laptop, OpeningLaptop, screenSource, useFits } from "./laptop";
import { copy, isVideo, pad, stillOf, type Locale } from "@/lib/content";
import { videoProps } from "@/lib/media";
import { clamp, easeInOut, easeOut, span, useScene } from "@/lib/scene";

export type ShowcaseWork = {
  id: string;
  slug: string;
  title: string;
  description: string;
  year: number;
  scope: string[];
  concept: boolean;
  url: string;
  cover: string;
  media: string[];
};

/** Every project gets its own dark room: the laptop opens as it arrives and invites a closer look. */
export function WorkShowcase({ works, locale }: { works: ShowcaseWork[]; locale: Locale }) {
  return (
    <div className="showcase-list">
      {works.map((work, i) => (
        <ShowcaseItem key={work.id} work={work} index={i} total={works.length} locale={locale} />
      ))}
    </div>
  );
}

function ShowcaseItem({
  work,
  index,
  total,
  locale,
}: {
  work: ShowcaseWork;
  index: number;
  total: number;
  locale: Locale;
}) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const room = useRef<HTMLAnchorElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const screens = useMemo(
    () => (work.media.length ? work.media : work.cover ? [work.cover] : []),
    [work.media, work.cover],
  );
  const [fits, detect] = useFits(screens.length);
  const sources = useMemo(() => screens.map(screenSource), [screens]);
  const backdrop = [work.cover, ...screens].map(stillOf).find(Boolean) ?? "";
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const href = "/" + locale + "/work/" + work.slug;

  // Screens take turns; a full-page capture gets time to travel while the pointer rests on it.
  useEffect(() => {
    if (screens.length < 2 || !(hover || inView)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wait = hover ? (fits[active] === "scroll" ? 6800 : 2200) : 3600;
    const timer = window.setTimeout(() => setActive((n) => (n + 1) % screens.length), wait);
    return () => window.clearTimeout(timer);
  }, [active, hover, inView, fits, screens.length]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i === active && inView) void video.play().catch(() => {});
      else video.pause();
    });
  }, [active, inView]);

  useScene(root, ({ rect, vh, reduced }) => {
    const el = root.current;
    if (!el) return;
    const arrive = reduced ? 1 : easeOut(clamp((vh * 0.95 - rect.top) / (vh * 0.62)));
    const power = reduced ? 1 : span(arrive, 0.66, 0.96);
    el.style.setProperty("--e", arrive.toFixed(4));
    el.style.setProperty("--lid", (reduced ? 1 : easeInOut(span(arrive, 0.2, 0.82))).toFixed(4));
    el.style.setProperty("--power", power.toFixed(4));
    el.style.setProperty("--flash", (power * (1 - power) * 4).toFixed(4));
    el.style.setProperty("--drift", clamp((vh - rect.top) / (vh + rect.height)).toFixed(4));
  });

  const tilt = (x: number, y: number) => {
    const el = room.current;
    if (!el) return;
    el.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
    el.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    el.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
    el.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
  };

  return (
    <article ref={root} className={"showcase" + (index % 2 ? " is-flipped" : "")} data-dive-scene>
      <Link
        ref={room}
        href={href}
        className="showcase-room"
        data-dive-source
        data-transition="dive"
        data-cursor={t.explore}
        data-label={work.title}
        aria-label={t.exploreProject + ": " + work.title}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHover(true);
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const box = e.currentTarget.getBoundingClientRect();
          tilt((e.clientX - box.left) / box.width - 0.5, (e.clientY - box.top) / box.height - 0.5);
        }}
        onPointerLeave={() => {
          setHover(false);
          tilt(0, 0);
        }}
      >
        {backdrop && (
          <div className="showcase-backdrop" aria-hidden="true">
            <img src={screenSource(backdrop)} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        <div className="showcase-beam" aria-hidden="true" />
        <div className="showcase-glow" aria-hidden="true" />
        {(["is-left", "is-right"] as const).map((side) => (
          <div key={side} className={"showcase-mirror " + side} aria-hidden="true">
            <Laptop className="showcase-reflection">
              {screens.map((src, i) =>
                isVideo(src) ? null : (
                  <div
                    key={src + i}
                    className={"shot" + (i === active ? " is-active" : "")}
                    data-fit={fits[i]}
                  >
                    <img src={sources[i]} alt="" loading="lazy" decoding="async" draggable={false} />
                  </div>
                ),
              )}
            </Laptop>
            <span className="showcase-mirror-sheen" />
          </div>
        ))}
        <div className="showcase-device" data-dive-device>
          <div className="showcase-tilt">
            <OpeningLaptop>
              {screens.map((src, i) => (
                <div
                  key={src + i}
                  className={"shot" + (i === active ? " is-active" : "")}
                  data-fit={fits[i]}
                  aria-hidden={i !== active}
                >
                  {isVideo(src) ? (
                    <video
                      ref={(node) => {
                        videos.current[i] = node;
                      }}
                      {...videoProps(src)}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) =>
                        detect(i, e.currentTarget.videoWidth, e.currentTarget.videoHeight, true)
                      }
                    />
                  ) : (
                    <>
                      {fits[i] === "contain" && <img className="shot-backdrop" src={sources[i]} alt="" />}
                      <img
                        src={sources[i]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        ref={(node) => {
                          if (node?.complete) detect(i, node.naturalWidth, node.naturalHeight, false);
                        }}
                        onLoad={(e) =>
                          detect(i, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, false)
                        }
                      />
                    </>
                  )}
                </div>
              ))}
            </OpeningLaptop>
          </div>
        </div>
        <div className="showcase-top">
          {work.concept && <em>{t.concept}</em>}
          {work.url && (
            <em className="is-live">
              <i /> {t.liveSite}
            </em>
          )}
        </div>
        {screens.length > 1 && (
          <div className="showcase-ticks" aria-hidden="true">
            {screens.map((_, i) => (
              <i key={i} className={i === active ? "is-on" : ""} />
            ))}
          </div>
        )}
        <span className="showcase-hint" aria-hidden="true">
          {t.exploreProject} <Arrow diagonal />
        </span>
      </Link>

      <div className="showcase-copy">
        <span className="showcase-index">
          <em>{pad(index + 1)}</em>
          <i />
          {pad(total)}
        </span>
        <h3 data-chars>
          <Chars text={work.title} single />
        </h3>
        {work.description && <p className="showcase-text">{work.description}</p>}
        <dl className="facts">
          <div>
            <dt>{t.year}</dt>
            <dd>{work.year}</dd>
          </div>
          {work.scope.length > 0 && (
            <div>
              <dt>{t.scope}</dt>
              <dd>{work.scope.join(" · ")}</dd>
            </div>
          )}
          <div>
            <dt>{t.screen}</dt>
            <dd>
              {pad(screens.length)} {t.screens}
            </dd>
          </div>
        </dl>
        <Link
          href={href}
          className="showcase-cta"
          data-transition="dive"
          data-magnetic="0.25"
          data-label={work.title}
        >
          <span>{t.exploreProject}</span>
          <Arrow diagonal />
        </Link>
      </div>
    </article>
  );
}
