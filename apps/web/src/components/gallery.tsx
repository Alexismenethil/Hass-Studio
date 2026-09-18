"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "./icon";
import { Chars } from "./text";
import { OpeningLaptop, screenSource, useFits } from "./laptop";
import { copy, isVideo, stillOf, type Locale } from "@/lib/content";
import { imageSource, videoProps } from "@/lib/media";

export type GalleryItem = {
  slug: string;
  title: string;
  cover: string;
  media: string[];
};

/** How long a project stays on show before the rail moves on by itself. */
const DWELL = 6200;
/** And how long it waits after someone takes the rail over. */
const REST = 9000;

/**
 * The screening room: one laptop, its light, its name. Nothing else. They stand
 * side by side on a single rail of native scroll, and it plays by itself; a
 * swipe, a drag or the arrow keys take it over and it picks up again after a
 * rest. The hall rising out of the hero's night, the arch opening on the room,
 * the lid and the display waking, the depth of the rooms either side: all of it
 * is CSS the browser ties to scroll itself, so moving never asks script for a
 * frame.
 */
export function Gallery({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const rest = useRef(0);
  const settle = useRef(0);
  const touched = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [spot, setSpot] = useState(0);
  const [seen, setSeen] = useState(false);
  const [held, setHeld] = useState(false);
  const [calm, setCalm] = useState(true);
  const n = items.length;
  // Three sets of the same rooms. The reader lives in the middle one, so there is
  // always a room to either side and the rail never reaches an end.
  const loop = n > 1;
  const reel = loop ? [...items, ...items, ...items] : items;
  const active = ((spot % n) + n) % n;

  // Nothing here plays by itself for a reader who asked for less movement.
  useEffect(() => {
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const slideAt = (index: number) =>
    rail.current?.querySelector<HTMLElement>('[data-slide="' + index + '"]') ?? null;

  /** One set's worth of rail, measured from the rooms themselves. */
  const stride = useCallback(() => {
    const first = slideAt(0);
    const next = slideAt(n);
    return first && next ? next.offsetLeft - first.offsetLeft : 0;
  }, [n]);

  /** Put whichever room is nearest the middle exactly in the middle. Phones can
   *  come to rest between two rooms after a flick or a change of size. */
  const snap = useCallback(() => {
    const el = rail.current;
    if (!el || drag.current) return;
    const middle = el.scrollLeft + el.clientWidth / 2;
    let best: HTMLElement | undefined;
    let gap = Infinity;
    for (const slide of Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"))) {
      const away = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);
      if (away < gap) {
        gap = away;
        best = slide;
      }
    }
    if (!best || gap < 2) return;
    el.scrollTo({
      left: best.offsetLeft - (el.clientWidth - best.offsetWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, []);

  /** Slip back to the middle set. Same picture, so nobody sees it happen. */
  const recentre = useCallback(() => {
    const el = rail.current;
    const width = stride();
    if (!el || !loop || !width) return;
    if (el.scrollLeft < width * 0.5) el.scrollLeft += width;
    else if (el.scrollLeft > width * 1.5) el.scrollLeft -= width;
  }, [loop, stride]);

  const go = useCallback(
    (index: number) => {
      const el = rail.current;
      if (!el) return;
      recentre();
      const slide = slideAt(loop ? index : Math.min(Math.max(index, 0), n - 1));
      if (!slide) return;
      el.scrollTo({
        left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    },
    [loop, n, recentre],
  );

  /** The nearest copy of a project, so the chapters never take the long way round. */
  const nearest = useCallback(
    (index: number) => {
      const step = (((index - spot) % n) + n) % n;
      return spot + (step > n / 2 ? step - n : step);
    },
    [spot, n],
  );

  /** Someone is steering: let them, and pick up again after a rest. */
  const hold = useCallback(() => {
    touched.current = true;
    setHeld(true);
    window.clearTimeout(rest.current);
    rest.current = window.setTimeout(() => setHeld(false), REST);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    // A narrow band down the middle of the rail: whatever covers it is on show.
    const centre = new IntersectionObserver(
      (entries) => {
        // Two rooms can touch the band at once; the one covering more of it is on show.
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries)
          if (
            entry.isIntersecting &&
            (!best || entry.intersectionRect.width > best.intersectionRect.width)
          )
            best = entry;
        if (best) setSpot(Number((best.target as HTMLElement).dataset.slide));
      },
      { root: el, rootMargin: "0px -48% 0px -48%" },
    );
    el.querySelectorAll<HTMLElement>("[data-slide]").forEach((slide) => centre.observe(slide));
    // Start on the first project in the middle set, and slip back into that set
    // whenever the rail comes to rest near an end.
    const start = () => {
      const mid = slideAt(n);
      if (!loop || !mid || touched.current) return;
      el.scrollLeft = mid.offsetLeft - (el.clientWidth - mid.offsetWidth) / 2;
      setSpot(n);
    };
    start();
    // Fonts and pictures settle after the first frames; take the measurement again.
    const frame = window.requestAnimationFrame(start);
    const late = window.setTimeout(start, 400);
    const rested = () => {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        recentre();
        snap();
      }, 180);
    };
    const resized = () => {
      start();
      snap();
    };
    el.addEventListener("scroll", rested, { passive: true });
    window.addEventListener("resize", resized);
    return () => {
      centre.disconnect();
      window.clearTimeout(settle.current);
      window.clearTimeout(late);
      window.cancelAnimationFrame(frame);
      el.removeEventListener("scroll", rested);
      window.removeEventListener("resize", resized);
    };
  }, [n, loop, stride, recentre, snap]);

  // It only plays while the room is on screen and the tab is in front.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let near = false;
    const watch = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        setSeen(near && !document.hidden);
      },
      { threshold: 0.4 },
    );
    watch.observe(el);
    const wake = () => setSeen(near && !document.hidden);
    document.addEventListener("visibilitychange", wake);
    return () => {
      watch.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.clearTimeout(rest.current);
    };
  }, []);

  const playing = seen && !held && !calm && n > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(spot + 1), DWELL);
    return () => window.clearTimeout(timer);
  }, [playing, spot, go]);

  if (!n) return null;
  return (
    <section ref={root} id="work" className="gal" data-header="dark" aria-label={t.selectedWork}>
      <div className="gal-light" aria-hidden="true" />
      <h2 className="sr-only">{t.selectedWork}</h2>

      <div
        className="gal-band"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") hold();
        }}
      >
        <span className="gal-floor" aria-hidden="true" />
        <div
          ref={rail}
          className="gal-rail"
          role="group"
          aria-roledescription="carousel"
          aria-label={t.selectedWork}
          onPointerDown={(e) => {
            hold();
            const el = rail.current;
            if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
            drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            const start = drag.current;
            const el = rail.current;
            if (!start || !el) return;
            const dx = e.clientX - start.x;
            if (!start.moved && Math.abs(dx) < 6) return;
            if (!start.moved) {
              start.moved = true;
              // Snapping would fight the hand; it takes the rail back on release.
              el.style.scrollSnapType = "none";
              // Page transitions listen before React does; tell them this is a drag.
              document.documentElement.dataset.dragging = "1";
            }
            el.scrollLeft = start.left - dx;
          }}
          onPointerUp={() => {
            const el = rail.current;
            if (el) el.style.scrollSnapType = "";
            window.setTimeout(() => {
              drag.current = null;
              delete document.documentElement.dataset.dragging;
            }, 0);
          }}
          onPointerCancel={() => {
            const el = rail.current;
            if (el) el.style.scrollSnapType = "";
            drag.current = null;
            delete document.documentElement.dataset.dragging;
          }}
          onClickCapture={(e) => {
            if (drag.current?.moved) e.preventDefault();
          }}
          onTouchStart={hold}
          onWheel={hold}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            hold();
            go(spot + (e.key === "ArrowRight" ? 1 : -1));
          }}
        >
          {reel.map((item, i) => (
            <Slide
              key={item.slug + "-" + i}
              item={item}
              flat={i}
              locale={locale}
              onShow={i === spot}
              near={Math.abs(i - spot) <= 1}
              named={i % n === active}
            />
          ))}
        </div>
        {n > 1 && (
          <div className="gal-nav">
            <button
              type="button"
              onClick={() => {
                hold();
                go(spot - 1);
              }}
              aria-label={t.previous}
            >
              <Arrow className="arrow-left" />
            </button>
            <button
              type="button"
              onClick={() => {
                hold();
                go(spot + 1);
              }}
              aria-label={t.following}
            >
              <Arrow />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** One project, in its room. Only the project on show plays video. */
function Slide({
  item,
  flat,
  locale,
  onShow,
  near,
  named,
}: {
  item: GalleryItem;
  flat: number;
  locale: Locale;
  /** This copy is the one in the middle: it plays, and its screens take turns. */
  onShow: boolean;
  /** In the middle or next to it: only these rooms are lit and dressed. */
  near: boolean;
  /** Every copy of the project on show wears the name, so slipping sets is silent. */
  named: boolean;
}) {
  const t = copy[locale];
  const room = useRef<HTMLAnchorElement>(null);
  const shots = item.media.length ? item.media.slice(0, 3) : item.cover ? [item.cover] : [];
  const [fits, detect] = useFits(shots.length);
  const [shown, setShown] = useState(0);
  const backdrop = [item.cover, ...shots].map(stillOf).find(Boolean) ?? "";
  const href = "/" + locale + "/work/" + item.slug;

  // Screens take turns while the project is on show; full-page captures get longer.
  useEffect(() => {
    if (!onShow || shots.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(
      () => setShown((k) => (k + 1) % shots.length),
      fits[shown] === "scroll" ? 6800 : 3000,
    );
    return () => window.clearTimeout(timer);
  }, [onShow, shown, fits, shots.length]);

  const tilt = (x: number, y: number) => {
    const el = room.current;
    if (!el) return;
    el.style.setProperty("--ry", (x * 9).toFixed(2) + "deg");
    el.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    el.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
    el.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
  };

  const screens = shots.map((src, i) => (
    <div
      key={src + i}
      className={"shot" + (i === shown ? " is-active" : "")}
      data-fit={fits[i]}
      aria-hidden={i !== shown}
    >
      {isVideo(src) && onShow ? (
        <video
          {...videoProps(src)}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          onLoadedMetadata={(e) =>
            detect(i, e.currentTarget.videoWidth, e.currentTarget.videoHeight, true)
          }
        />
      ) : (
        <>
          {fits[i] === "contain" && (
            <img className="shot-backdrop" src={screenSource(stillOf(src))} alt="" />
          )}
          <img
            src={screenSource(stillOf(src))}
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
  ));

  return (
    <article
      className={"gal-slide" + (named ? " is-on" : "")}
      data-slide={flat}
      data-dive-scene
    >
      <Link
        ref={room}
        href={href}
        className="showcase-room gal-room"
        data-dive-source
        data-transition="dive"
        data-cursor={t.explore}
        data-label={item.title}
        aria-label={t.exploreProject + ": " + item.title}
        draggable={false}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const box = e.currentTarget.getBoundingClientRect();
          tilt((e.clientX - box.left) / box.width - 0.5, (e.clientY - box.top) / box.height - 0.5);
        }}
        onPointerLeave={() => tilt(0, 0)}
      >
        {backdrop && near && (
          <div className="showcase-backdrop" aria-hidden="true">
            {/* Blurred into pure light anyway: a tiny copy keeps the paint cheap. */}
            <img src={imageSource(backdrop, 240, 160)} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        <div className="showcase-beam" aria-hidden="true" />
        <div className="showcase-glow" aria-hidden="true" />
        <div className="showcase-device" data-dive-device>
          <div className="showcase-tilt">
            <OpeningLaptop>{near ? screens : null}</OpeningLaptop>
          </div>
        </div>
        <div className="gal-caption">
          <h3 className="gal-title">
            <Chars text={item.title} single />
          </h3>
        </div>
      </Link>
    </article>
  );
}
