"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { copy, isVideo, pad, type Locale } from "@/lib/content";
import { videoProps } from "@/lib/media";
import { clamp, easeInOut, easeOut, span } from "@/lib/scene";
import { Arrow } from "./icon";
import { OpeningLaptop, screenSource, useFits } from "./laptop";

const FADE = 0.14;

/**
 * The scene plays by itself as soon as the page opens: the lights go down, the
 * laptop rises and opens and the display wakes. Scrolling then moves through the
 * screens. Nothing else is in the room — the light, the laptop and its
 * reflection on the floor.
 *
 * Arriving from a project card (a "dive") the laptop is already open and lit, so
 * that scene would be a lie. Instead the room itself arrives around it (`land`):
 * the beam comes down, the pool of light and the reflection gather on the floor,
 * the name writes itself in. The laptop does not move at all — the copy that
 * flew in and the real one must be the same picture, or landing jumps.
 */
function introAt(t: number, arrival: string | undefined, land: number) {
  if (arrival === "dive") return { dim: 1, rise: 1, lid: 1, power: 1, land };
  return {
    dim: arrival === "curtain" ? 1 : easeInOut(span(t, 0, 1.1)),
    rise: easeOut(span(t, 0.15, 1.7)),
    lid: easeInOut(span(t, 0.6, 1.95)),
    power: span(t, 1.75, 2.35),
    land: 1,
  };
}

export function MirrorStage({
  media,
  title,
  eyebrow = "",
  locale,
  url = "",
}: {
  media: string[];
  title: string;
  eyebrow?: string;
  locale: Locale;
  url?: string;
}) {
  const t = copy[locale];
  const count = media.length;
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const chosen = useRef(0);
  const paused = useRef(false);
  const [active, setActive] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [fits, detect] = useFits(count);
  // One optimized URL per image, shared by the display and every reflection.
  const sources = useMemo(() => media.map(screenSource), [media]);
  const hasVideo = media.some(isVideo);

  const go = useCallback(
    (index: number) => {
      const el = root.current;
      if (!el) return;
      const next = clamp(index, 0, count - 1);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        chosen.current = next;
        return;
      }
      const total = el.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top + (total * (next + 0.5)) / count,
        behavior: "smooth",
      });
    },
    [count],
  );

  useEffect(() => {
    paused.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    images.current.forEach((img, i) => {
      if (img?.complete) detect(i, img.naturalWidth, img.naturalHeight, false);
    });
  }, [detect]);

  useEffect(() => {
    const el = root.current;
    if (!el || !count) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvases = Array.from(el.querySelectorAll<HTMLCanvasElement>("canvas[data-video]"));
    const written = new Map<string, string>();
    const drawnAt = new Map<HTMLCanvasElement, number>();
    const opacity: number[] = media.map((_, i) => (i === 0 ? 1 : 0));
    // How this page was reached decides where the opening scene starts.
    const html = document.documentElement;
    const arrival = reduced.matches ? undefined : html.dataset.arrival;
    const landed = arrival === "landed";
    const mode = landed ? undefined : arrival;
    let startAt = mode ? Infinity : performance.now() + (landed ? 0 : 250);
    let landAt = Infinity;
    const arrive = () => {
      const now = performance.now();
      // The dive has handed the laptop over: bring the room up around it.
      if (mode === "dive") landAt = Math.min(landAt, now);
      // The curtain is already lifting: begin half a second into the scene.
      else startAt = Math.min(startAt, now - 450);
    };
    window.addEventListener("hass:arrive", arrive);
    const late = window.setTimeout(arrive, 2600);
    let q = -1;
    let current = -1;
    let frame = 0;
    let visible = false;
    const write = (name: string, value: number) => {
      const v = value.toFixed(4);
      if (written.get(name) === v) return;
      written.set(name, v);
      el.style.setProperty(name, v);
    };
    const goal = () => {
      if (reduced.matches) return { q: chosen.current + 0.5, p: 0 };
      const total = Math.max(0, el.offsetHeight - window.innerHeight);
      const p = total > 0 ? clamp(-el.getBoundingClientRect().top / total) : 0;
      return { q: p * count, p };
    };
    const tick = () => {
      const g = goal();
      const k = q < 0 || reduced.matches ? 1 : 0.2;
      q = q < 0 ? g.q : q + (g.q - q) * k;
      if (Math.abs(g.q - q) < 0.0005) q = g.q;
      const now = performance.now();
      const scene = reduced.matches
        ? { dim: 1, rise: 1, lid: 1, power: 1, land: 1 }
        : introAt(
            (now - startAt) / 1000,
            mode,
            easeOut(span((now - landAt) / 1000, 0, 1.15)),
          );
      write("--a", scene.dim);
      write("--rise", scene.rise);
      write("--lid", scene.lid);
      write("--power", scene.power);
      // The display wakes with a warm flash.
      write("--flash", scene.power * (1 - scene.power) * 4);
      write("--land", scene.land);
      write("--p", g.p);
      let best = 0;
      for (let i = 0; i < count; i++) {
        const fadeIn = i === 0 ? 1 : clamp((q - (i - FADE)) / (2 * FADE));
        const fadeOut = i === count - 1 ? 1 : 1 - clamp((q - (i + 1 - FADE)) / (2 * FADE));
        const o = Math.min(fadeIn, fadeOut);
        opacity[i] = o;
        write("--o" + i, o);
        write("--y" + i, fadeIn < 1 ? (1 - fadeIn) * 9 : (fadeOut - 1) * 9);
        write("--s" + i, reduced.matches ? 0 : clamp((q - i - FADE) / (1 - 2 * FADE)));
        if (o > opacity[best]) best = i;
      }
      if (best !== current) {
        current = best;
        setActive(best);
      }
      videos.current.forEach((video, i) => {
        if (!video) return;
        const play = visible && i === best && !paused.current && !document.hidden;
        if (play && video.paused)
          void video.play().catch((e) => {
            // Only a browser that refuses autoplay should show the play button.
            if (e?.name === "NotAllowedError") setPaused(true);
          });
        else if (!play && !video.paused) video.pause();
      });
      // Reflections of a video are redrawn only when its frame changes.
      for (const canvas of canvases) {
        const i = Number(canvas.dataset.video);
        const video = videos.current[i];
        if (!video || video.readyState < 2 || opacity[i] <= 0) continue;
        if (drawnAt.get(canvas) === video.currentTime) continue;
        drawnAt.set(canvas, video.currentTime);
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (visible) frame = requestAnimationFrame(tick);
        else {
          tick();
          cancelAnimationFrame(frame);
        }
      },
      { rootMargin: "15% 0px" },
    );
    tick();
    cancelAnimationFrame(frame);
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("hass:arrive", arrive);
      window.clearTimeout(late);
      videos.current.forEach((video) => video?.pause());
    };
  }, [count, media]);

  if (!count) return null;

  const screens = (main: boolean) =>
    media.map((src, i) => (
      <div
        key={i}
        className="screen"
        data-fit={fits[i]}
        style={
          {
            "--o": `var(--o${i}, ${i === 0 ? 1 : 0})`,
            "--y": `var(--y${i}, 0)`,
            "--s": `var(--s${i}, 0)`,
          } as CSSProperties
        }
      >
        {isVideo(src) ? (
          main ? (
            <video
              ref={(node) => {
                videos.current[i] = node;
              }}
              {...videoProps(src)}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={title + " — " + t.screen + " " + (i + 1)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                detect(i, v.videoWidth, v.videoHeight, true);
                root.current
                  ?.querySelectorAll<HTMLCanvasElement>(`canvas[data-video="${i}"]`)
                  .forEach((canvas) => {
                    canvas.width = 360;
                    canvas.height = Math.round((360 * v.videoHeight) / v.videoWidth);
                  });
              }}
            />
          ) : (
            <canvas data-video={i} width={360} height={225} />
          )
        ) : (
          <>
            {main && fits[i] === "contain" && (
              <img className="screen-backdrop" src={sources[i]} alt="" aria-hidden="true" />
            )}
            <img
              ref={
                main
                  ? (node) => {
                      images.current[i] = node;
                    }
                  : undefined
              }
              src={sources[i]}
              alt={main ? title + " — " + t.screen + " " + (i + 1) : ""}
              draggable={false}
              decoding="async"
              loading={i === 0 ? "eager" : "lazy"}
              onLoad={
                main
                  ? (e) =>
                      detect(
                        i,
                        e.currentTarget.naturalWidth,
                        e.currentTarget.naturalHeight,
                        false,
                      )
                  : undefined
              }
            />
          </>
        )}
      </div>
    ));

  return (
    <section
      ref={root}
      className="stage"
      data-header="dark"
      aria-label={title}
      style={{ "--m": count } as CSSProperties}
    >
      <div className="stage-sticky">
        <div className="stage-dim" aria-hidden="true" />
        <span className="stage-beam" aria-hidden="true" />
        <div className="stage-glow" aria-hidden="true">
          {screens(false)}
        </div>
        <div className="stage-room">
          <div className="stage-device">
            <OpeningLaptop>{screens(true)}</OpeningLaptop>
            <span className="stage-floor" aria-hidden="true" />
          </div>
        </div>
        <div className="stage-ui">
          <div className="stage-title">
            {eyebrow && <small>{eyebrow}</small>}
            <strong>{title}</strong>
            <span className="stage-caption" aria-live="polite">
              {t.screen} <b>{pad(active + 1)}</b> / {pad(count)}
            </span>
          </div>
          {count > 1 && (
            <div className="stage-steps">
              {media.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t.screen + " " + (i + 1)}
                  aria-pressed={i === active}
                  onClick={() => go(i)}
                >
                  <span>{pad(i + 1)}</span>
                  <i />
                </button>
              ))}
            </div>
          )}
          {count < 2 && <span />}
          <div className="stage-actions">
            {hasVideo && (
              <button
                type="button"
                className="stage-play"
                onClick={() => setPaused((p) => !p)}
                aria-label={isPaused ? t.play : t.pause}
              >
                {isPaused ? "▶" : "❙❙"}
              </button>
            )}
            {url && (
              <a
                className="stage-visit"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic="0.2"
              >
                {t.live} <Arrow diagonal />
              </a>
            )}
          </div>
        </div>
        <span className="stage-cue" aria-hidden="true">
          {t.scroll}
          <i />
        </span>
      </div>
    </section>
  );
}
