"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Arrow } from "./icon";
import { Media } from "./media";
import { createRenderer, type Texture } from "./gl/gl";
import { copy, pad, type Locale } from "@/lib/content";
import { clamp, easeInOut, easeOut, useScene } from "@/lib/scene";

export type ServiceSlide = {
  id: string;
  title: string;
  tagline: string;
  includes: string;
  media: string;
  covers: string[];
  count: number;
};

/** Light burns through one photograph into the next along a drifting noise field. */
const DISSOLVE = `
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform vec2 uImgA;
uniform vec2 uImgB;
uniform float uP;
uniform float uIntro;
uniform float uTime;
void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 q = vec2(uv.x * aspect, uv.y);
  float n = fbm(q * 1.6 + vec2(uTime * 0.03, -uTime * 0.02));
  float edge = uP * 1.3 - 0.15;
  float field = n + (0.5 - uv.y) * 0.18;
  float m = 1.0 - smoothstep(edge - 0.09, edge + 0.09, field);
  vec2 push = vec2(n - 0.5, n - 0.5) * 0.09;
  vec2 ua = (uv - 0.5) / (1.0 + 0.1 * uP) + 0.5 + push * m;
  vec2 ub = (uv - 0.5) / (1.1 - 0.1 * uP) + 0.5 - push * (1.0 - m);
  vec3 a = texture2D(uA, cover(ua, uRes, uImgA)).rgb;
  vec3 b = texture2D(uB, cover(ub, uRes, uImgB)).rgb;
  vec3 col = mix(a, b, m);
  col += vec3(1.0, 0.72, 0.42) * m * (1.0 - m) * 4.0 * 0.32;
  float leaves = fbm(q * 1.4 + vec2(-uTime * 0.012, uTime * 0.008));
  col *= mix(0.9, 1.06, smoothstep(0.4, 0.7, leaves));
  float ie = uIntro * 1.3 - 0.15;
  float shown = 1.0 - smoothstep(ie - 0.1, ie + 0.1, fbm(q * 2.0 + 7.0) + (uv.y - 0.5) * 0.3);
  vec3 night = vec3(0.078, 0.086, 0.07);
  col = mix(night, col, shown) + vec3(1.0, 0.7, 0.4) * shown * (1.0 - shown) * 4.0 * 0.25;
  gl_FragColor = vec4(col, 1.0);
}`;

function CardCovers({ covers, active }: { covers: string[]; active: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!active || covers.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setShown((n) => (n + 1) % covers.length), 3200);
    return () => window.clearInterval(timer);
  }, [active, covers.length]);
  return (
    <>
      {covers.map((src, i) => (
        <span key={src + i} className={"arch-cover" + (i === shown ? " is-shown" : "")}>
          <Media src={src} sizes="(max-width: 767px) 60vw, 26vw" />
        </span>
      ))}
    </>
  );
}

export function ServicesCarousel({ slides, locale }: { slides: ServiceSlide[]; locale: Locale }) {
  const t = copy[locale];
  const n = slides.length;
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createRenderer>>(null);
  const textures = useRef<Texture[]>([]);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const current = useRef(-1);
  const [active, setActive] = useState(0);

  const go = useCallback(
    (index: number) => {
      const el = root.current;
      if (!el || n < 2) return;
      const next = clamp(index, 0, n - 1);
      const total = el.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top + (total * next) / (n - 1) + 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    },
    [n],
  );

  useEffect(() => {
    const surface = canvas.current;
    if (!surface || !n || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Phones get the crossfading photographs underneath instead of a second shader.
    if (!window.matchMedia("(min-width: 768px) and (pointer: fine)").matches) return;
    const r = createRenderer(surface, DISSOLVE);
    renderer.current = r;
    if (!r) return;
    let loaded = 0;
    textures.current = slides.map((slide) =>
      r.texture(slide.media, () => {
        loaded += 1;
        if (loaded === 1) surface.classList.add("is-ready");
      }),
    );
    return () => {
      textures.current.forEach((tex) => tex.video?.pause());
      r.destroy();
      renderer.current = null;
    };
    // Media URLs identify the slides; re-create only when they change.
  }, [slides.map((s) => s.media).join("|")]);

  // Where the browser can tie animations to scroll itself, the arrival runs on the compositor
  // (see .svc in site.css). Moving layers from script lags native scrolling, which shakes on
  // phones, so without that support only precise pointers get the lift.
  const lifts = useRef<"css" | "script" | "none">("none");
  useEffect(() => {
    lifts.current = CSS.supports("animation-timeline: view()")
      ? "css"
      : window.matchMedia("(pointer: fine)").matches
        ? "script"
        : "none";
  }, []);

  useScene(root, ({ p: raw, rect, vw, vh, time, reduced }) => {
    const el = root.current;
    if (!el) return;
    const position = raw * (n - 1);
    let p = position;
    if (reduced) p = Math.round(position);
    else if (n > 1) {
      const i = Math.min(Math.floor(position), n - 2);
      const f = position - i;
      p = i + f - (0.62 * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);
    }
    // Light breaks through the dark as soon as the section reaches the screen.
    const enter = reduced ? 1 : easeOut(clamp((vh - rect.top) / (vh * 0.72)));
    el.style.setProperty("--enter", enter.toFixed(4));
    if (lifts.current === "script")
      el.style.setProperty(
        "--lift",
        (!reduced && rect.top > 0 && rect.top <= vh ? rect.top : 0).toFixed(1) + "px",
      );
    el.style.setProperty("--p", p.toFixed(4));
    el.querySelectorAll<HTMLElement>("[data-slide]").forEach((node) => {
      const k = Number(node.dataset.slide);
      node.style.setProperty("--q", (p - k).toFixed(4));
      node.style.setProperty("--v", clamp(1 - Math.abs(p - k)).toFixed(4));
      node.style.setProperty("--r", (k === 0 ? 1 : clamp(p - (k - 1))).toFixed(4));
    });
    const index = clamp(Math.round(p), 0, n - 1);
    if (index !== current.current) {
      current.current = index;
      setActive(index);
    }
    const r = renderer.current;
    if (!r || reduced) return;
    const from = Math.min(Math.floor(p), n - 1);
    const to = Math.min(from + 1, n - 1);
    const a = textures.current[from];
    const b = textures.current[to];
    if (!a || !b) return;
    textures.current.forEach((tex, k) => {
      if (!tex.video) return;
      if (k === from || k === to) {
        if (tex.video.paused) tex.video.play().catch(() => {});
        r.refresh(tex);
      } else if (!tex.video.paused) tex.video.pause();
    });
    const [cw, ch] = r.resize(vw < 768 ? 1.2 : 1.5);
    const gl = r.gl;
    gl.uniform2f(r.uniform("uRes"), cw, ch);
    gl.uniform2f(r.uniform("uImgA"), a.width, a.height);
    gl.uniform2f(r.uniform("uImgB"), b.width, b.height);
    gl.uniform1f(r.uniform("uP"), easeInOut(p - from));
    gl.uniform1f(r.uniform("uIntro"), enter);
    gl.uniform1f(r.uniform("uTime"), time);
    r.bind(0, a, "uA");
    r.bind(1, b, "uB");
    r.draw();
  });

  if (!n) return null;
  const slide = slides[active] ?? slides[0];
  const href = (s: ServiceSlide) => "/" + locale + "/services/" + s.id;
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
          if (e.pointerType !== "mouse" || e.button === 0) drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) {
            drag.current.moved = true;
            // Page transitions listen before React does; tell them this is a drag.
            document.documentElement.dataset.dragging = "1";
          }
        }}
        onPointerUp={(e) => {
          const start = drag.current;
          if (start && Math.abs(e.clientX - start.x) > 60) go(active + (e.clientX < start.x ? 1 : -1));
          window.setTimeout(() => {
            drag.current = null;
            delete document.documentElement.dataset.dragging;
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
          if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            go(active + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1));
          }
        }}
      >
        <div className="svc-stage" aria-hidden="true">
          <div className="svc-fallback">
            {slides.map((s, i) => (
              <div className="svc-fallback-item" data-slide={i} key={s.id}>
                <Media src={s.media} sizes="100vw" />
              </div>
            ))}
          </div>
          <canvas ref={canvas} className="svc-gl" />
          <div className="svc-shade" />
        </div>

        <header className="svc-head">
          <span className="eyebrow">{t.services}</span>
          <span className="svc-count" aria-live="polite">
            <em>{pad(active + 1)}</em>
            <i />
            {pad(n)}
          </span>
        </header>

        {n > 1 && (
          <nav className="svc-chapters" aria-label={t.services}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-slide={i}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
              >
                <i />
                <span>{pad(i + 1)}</span>
                <em>{s.title}</em>
              </button>
            ))}
          </nav>
        )}

        <div className="svc-arch-wrap">
          <span className="svc-arch-ring" aria-hidden="true" />
          <Link
            href={href(slide)}
            className="svc-arch"
            data-cursor={t.view}
            data-label={slide.title}
            draggable={false}
            aria-label={slide.title}
            tabIndex={-1}
          >
            {slides.map((s, i) => (
              <span key={s.id} className="svc-arch-item" data-slide={i} aria-hidden={i !== active}>
                <CardCovers covers={s.covers} active={i === active} />
              </span>
            ))}
            <span className="svc-arch-count">
              {pad(slide.count)} {t.projects}
            </span>
          </Link>
        </div>

        <div className="svc-drum">
          {slides.map((s, i) => (
            <Link
              key={s.id}
              href={href(s)}
              className="svc-title"
              data-slide={i}
              data-cursor={t.view}
              data-label={s.title}
              aria-current={i === active ? "true" : undefined}
              tabIndex={i === active ? 0 : -1}
              draggable={false}
            >
              {Array.from(s.title).map((char, c) => (
                <span key={c} style={{ "--ci": c, "--cc": s.title.length } as CSSProperties}>
                  {char === " " ? " " : char}
                </span>
              ))}
            </Link>
          ))}
        </div>

        <p className="svc-tagline" key={"tag-" + active}>
          {slide.tagline}
        </p>

        <div className="svc-foot">
          <p className="svc-includes" key={"inc-" + active}>
            <span className="eyebrow">{t.includes}</span>
            {slide.includes}
          </p>
          <div className="svc-controls">
            {n > 1 && (
              <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={t.previous}>
                <Arrow className="arrow-left" />
              </button>
            )}
            <Link href={href(slide)} className="svc-orb" data-magnetic="0.3" data-label={slide.title}>
              <span>
                {t.view} <Arrow diagonal />
              </span>
            </Link>
            {n > 1 && (
              <button type="button" onClick={() => go(active + 1)} disabled={active === n - 1} aria-label={t.following}>
                <Arrow />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
