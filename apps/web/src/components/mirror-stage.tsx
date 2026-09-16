"use client";
import { getImageProps } from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { copy, isVideo, pad, type Locale } from "@/lib/content";
import { Arrow } from "./icon";

/**
 * cover: fills the display. contain: portrait screens (phones) float over a
 * blurred copy. scroll: full-page website captures travel inside the display.
 */
type Fit = "cover" | "contain" | "scroll";
const FADE = 0.14;
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const frame = (className = "laptop-frame") => (
  <img
    className={className}
    src="/images/laptop-frontal.webp"
    alt=""
    width={1586}
    height={992}
    draggable={false}
    decoding="async"
  />
);

function Laptop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"laptop " + className}>
      {frame()}
      <div className="laptop-screen">{children}</div>
    </div>
  );
}

/** The photographed laptop cut at its hinge, so the lid can open in 3D. */
function OpeningLaptop({ children }: { children: ReactNode }) {
  return (
    <div className="laptop laptop-main">
      <div className="laptop-lid">
        <div className="laptop-lid-front">
          {frame()}
          <div className="laptop-screen">
            {children}
            <span className="screen-power" aria-hidden="true" />
          </div>
        </div>
        <span className="laptop-lid-back" aria-hidden="true" />
      </div>
      <div className="laptop-base">{frame()}</div>
    </div>
  );
}

export function MirrorStage({
  media,
  title,
  locale,
  url = "",
}: {
  media: string[];
  title: string;
  locale: Locale;
  url?: string;
}) {
  const t = copy[locale];
  const count = media.length;
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const dust = useRef<HTMLCanvasElement>(null);
  const chosen = useRef(0);
  const paused = useRef(false);
  const [active, setActive] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [fits, setFits] = useState<Fit[]>(() => media.map(() => "cover"));
  // One optimized URL per image, shared by the display and every reflection.
  const sources = useMemo(
    () =>
      media.map((src) =>
        isVideo(src)
          ? src
          : getImageProps({ src, alt: "", width: 960, height: 600, quality: 75 })
              .props.src,
      ),
    [media],
  );
  const hasVideo = media.some(isVideo);

  const detect = useCallback((i: number, w: number, h: number, video: boolean) => {
    if (!w || !h) return;
    const ratio = h / w;
    const fit: Fit =
      !video && w >= 1360 && ratio > 0.8 ? "scroll" : ratio > 0.8 ? "contain" : "cover";
    setFits((prev) => (prev[i] === fit ? prev : prev.map((f, k) => (k === i ? fit : f))));
  }, []);

  const introLength = () => window.innerHeight * (window.innerWidth < 760 ? 0.55 : 0.85);

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
      const intro = Math.min(total, introLength());
      window.scrollTo({
        top:
          window.scrollY +
          el.getBoundingClientRect().top +
          intro +
          ((total - intro) * (next + 0.5)) / count,
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
    let a = -1;
    let q = -1;
    let current = -1;
    let frame = 0;
    let visible = false;
    // Motes of dust drifting through the beam above the laptop.
    const motes = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.012,
    }));
    const drawDust = (light: number) => {
      const surface = dust.current;
      const ctx = surface?.getContext("2d");
      if (!surface || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(surface.clientWidth * dpr);
      const h = Math.round(surface.clientHeight * dpr);
      if (surface.width !== w || surface.height !== h) {
        surface.width = w;
        surface.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      if (light < 0.2 || reduced.matches) return;
      const now = performance.now() / 1000;
      ctx.globalCompositeOperation = "lighter";
      for (const mote of motes) {
        mote.y -= mote.speed / 60;
        if (mote.y < -0.05) {
          mote.y = 1.05;
          mote.x = Math.random();
        }
        const x = (mote.x + Math.sin(now * 0.3 + mote.phase) * 0.012) * w;
        const y = mote.y * h;
        const beam = Math.max(0, 1 - Math.abs(mote.x - 0.5) / (0.18 + mote.y * 0.32));
        const alpha = (0.08 + beam * 0.55) * mote.z * clamp((light - 0.2) / 0.5) * (0.7 + 0.3 * Math.sin(now * 1.7 + mote.phase));
        if (alpha < 0.01) continue;
        ctx.fillStyle = `rgba(255, 236, 205, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, (0.5 + mote.z * 1.6) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const write = (name: string, value: number) => {
      const v = value.toFixed(4);
      if (written.get(name) === v) return;
      written.set(name, v);
      el.style.setProperty(name, v);
    };
    const goal = () => {
      if (reduced.matches) return { a: 1, q: chosen.current + 0.5 };
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const total = Math.max(0, el.offsetHeight - vh);
      const intro = Math.min(total, introLength());
      const travelled = clamp(-top, 0, total);
      return {
        a: intro > 0 ? clamp(-top / intro) : 1,
        q: total - intro > 0 ? clamp((travelled - intro) / (total - intro)) * count : 0,
      };
    };
    const tick = () => {
      const g = goal();
      const k = a < 0 || reduced.matches ? 1 : 0.2;
      a = a < 0 ? g.a : a + (g.a - a) * k;
      q = q < 0 ? g.q : q + (g.q - q) * k;
      if (Math.abs(g.a - a) < 0.0005) a = g.a;
      if (Math.abs(g.q - q) < 0.0005) q = g.q;
      write("--a", easeOut(a));
      // The lid lifts once the room is dark; the display wakes with a warm flash.
      const lid = reduced.matches ? 1 : easeInOut(clamp((a - 0.3) / 0.55));
      const power = reduced.matches ? 1 : clamp((a - 0.78) / 0.22);
      write("--lid", lid);
      write("--power", power);
      write("--flash", power * (1 - power) * 4);
      drawDust(a);
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
        if (play && video.paused) void video.play().catch(() => setPaused(true));
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
              src={src}
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

  const reflection = (
    <div className="mirror-inner">
      <Laptop className="mirror-laptop is-ghost">{screens(false)}</Laptop>
      <Laptop className="mirror-laptop">{screens(false)}</Laptop>
      <span className="mirror-sheen" />
    </div>
  );

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
        <canvas ref={dust} className="stage-dust" aria-hidden="true" />
        <div className="stage-room">
          <div className="mirror mirror-left" aria-hidden="true">
            {reflection}
          </div>
          <div className="stage-device">
            <OpeningLaptop>{screens(true)}</OpeningLaptop>
            <span className="stage-floor" aria-hidden="true" />
          </div>
          <div className="mirror mirror-right" aria-hidden="true">
            {reflection}
          </div>
        </div>
        <div className="stage-ui">
          <span className="stage-caption" aria-live="polite">
            {t.screen} <b>{pad(active + 1)}</b> / {pad(count)}
          </span>
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
      </div>
    </section>
  );
}
