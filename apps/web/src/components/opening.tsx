"use client";
import { getImageProps } from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { createRenderer, type Texture } from "./gl/gl";
import { Chars } from "./text";
import { Sun } from "./cinema";
import { copy, isVideo, lines, type Locale } from "@/lib/content";
import { loaderFor, videoProps } from "@/lib/media";
import { clamp, easeInOut, easeOut, mix, span, useScene } from "@/lib/scene";

/** Mediterranean light: leaf shadows drifting over the photograph, a warm sun under the pointer. */
const LIGHT = `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform float uTime;
uniform float uShape;
uniform float uReveal;
uniform float uDusk;
void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float zoom = 1.0 + 0.1 * uShape + (1.0 - uReveal) * 0.22;
  vec2 st = (uv - 0.5) / zoom + 0.5;
  st += (uMouse - 0.5) * vec2(-0.014, -0.01);
  st += vec2(sin(uTime * 0.11), cos(uTime * 0.09)) * 0.003;
  float sea = smoothstep(0.62, 0.15, uv.y);
  float ripple = noise(vec2(st.x * 22.0, st.y * 90.0 - uTime * 0.7));
  st.x += (ripple - 0.5) * 0.003 * sea;
  vec2 tuv = cover(st, uRes, uImg);
  vec2 dir = tuv - 0.5;
  float split = 0.002 * uShape + (1.0 - uReveal) * 0.01;
  vec3 col = vec3(
    texture2D(uTex, tuv + dir * split).r,
    texture2D(uTex, tuv).g,
    texture2D(uTex, tuv - dir * split).b
  );
  vec2 lp = vec2(uv.x * aspect, uv.y) * 1.8 + vec2(uTime * 0.016, -uTime * 0.01);
  float leaves = fbm(lp + 1.6 * fbm(lp * 0.8 + vec2(0.0, uTime * 0.025)));
  float light = smoothstep(0.38, 0.72, leaves);
  col *= mix(vec3(0.83, 0.86, 0.9), vec3(1.1, 1.03, 0.9), light);
  vec2 d = (uv - uMouse) * vec2(aspect, 1.0);
  col += vec3(1.0, 0.8, 0.55) * 0.13 * exp(-dot(d, d) * 5.0);
  float vignette = smoothstep(1.2, 0.3, length((uv - 0.5) * vec2(1.15, 1.0)));
  col *= mix(0.62, 1.0, vignette);
  float flare = pow(1.0 - uReveal, 2.0);
  col = mix(col, vec3(1.0, 0.93, 0.8), flare * 0.9);
  col = mix(col, vec3(0.078, 0.086, 0.07), uDusk);
  gl_FragColor = vec4(col, 1.0);
}`;

type Props = {
  image: string;
  mobileImage: string;
  title: string;
  sub: string;
  eyebrow: string;
  statement: string;
  alt: string;
  locale: Locale;
};

const halves = (text: string): [string, string] => {
  const list = lines(text);
  if (list.length > 1) return [list[0], list.slice(1).join(" ")];
  const words = text.split(" ");
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
};

export function Opening({ image, mobileImage, title, sub, eyebrow, statement, alt, locale }: Props) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createRenderer>>(null);
  const texture = useRef<Texture | null>(null);
  const live = useRef({ mouse: [0.5, 0.45], target: [0.5, 0.45], readyAt: 0, revealAt: 0 });
  const [left, right] = halves(statement);

  const still = !isVideo(image) && image;
  const desktop = still
    ? getImageProps({ src: image, alt, width: 1920, height: 1080, sizes: "100vw", quality: 75, loading: "eager", fetchPriority: "high", ...loaderFor(image) }).props
    : null;
  const mobile =
    mobileImage && !isVideo(mobileImage)
      ? getImageProps({ src: mobileImage, alt, width: 900, height: 1600, sizes: "100vw", quality: 75, ...loaderFor(mobileImage) }).props
      : null;

  useEffect(() => {
    const el = root.current;
    const surface = canvas.current;
    if (!el || !surface) return;
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const firstVisit = html.dataset.intro !== "seen" && !reduced;
    try {
      sessionStorage.setItem("hass-intro", "1");
    } catch {}
    // The CSS intro opens its arch ~1.35s after navigation start; the light follows it.
    const delay = firstVisit ? Math.max(0, 1350 - performance.now()) : 0;
    live.current.revealAt = performance.now() + delay;
    const reveal = window.setTimeout(() => el.classList.add("is-in"), delay + 60);
    if (reduced) return () => window.clearTimeout(reveal);
    const r = createRenderer(surface, LIGHT);
    renderer.current = r;
    if (r) {
      const narrow = window.innerWidth < 768 && !!mobileImage;
      texture.current = r.texture(narrow ? mobileImage : image, () => {
        live.current.readyAt = performance.now();
        surface.classList.add("is-ready");
        texture.current?.video?.play().catch(() => {});
      });
    }
    const move = (e: PointerEvent) => {
      live.current.target = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.clearTimeout(reveal);
      window.removeEventListener("pointermove", move);
      r?.destroy();
      renderer.current = null;
    };
  }, [image, mobileImage]);

  useScene(root, ({ p, vw, vh, dt, time, reduced }) => {
    const el = root.current;
    const win = frame.current;
    if (!el || !win) return;
    const s = live.current;
    const a = reduced ? 0 : easeInOut(span(p, 0, 0.42));
    const b = reduced ? 0 : easeInOut(span(p, 0.56, 0.92));
    const shape = a;
    const narrow = vw < 768;
    const W = narrow ? vw * 0.62 : Math.min(vw * 0.28, vh * 0.44);
    const H = Math.min(vh * (narrow ? 0.5 : 0.64), W * 1.48);
    const top = (vh - H) * 0.5 + vh * (narrow ? 0.02 : 0.03);
    // Contract into an arch, then pass through it: the arch grows past the screen.
    const grow = 1 + b * b * 7;
    const w = mix(vw, W, shape) * grow;
    const h = mix(vh, H, shape) * grow;
    const cy = mix(vh / 2, top + H / 2, shape) + b * vh * 0.9;
    const x = (vw - w) / 2;
    const y = cy - h / 2;
    const radius = (w / 2) * shape;
    win.style.clipPath = `inset(${y.toFixed(1)}px ${x.toFixed(1)}px ${(vh - y - h).toFixed(1)}px ${x.toFixed(1)}px round ${radius.toFixed(1)}px ${radius.toFixed(1)}px 0px 0px)`;
    el.style.setProperty("--a", a.toFixed(4));
    el.style.setProperty("--b", b.toFixed(4));
    el.style.setProperty("--shape", (shape * (1 - b)).toFixed(4));
    el.dataset.header = shape > 0.3 && b < 0.5 ? "light" : "dark";

    const k = 1 - Math.exp(-dt * 2.5);
    s.mouse[0] += (s.target[0] - s.mouse[0]) * k;
    s.mouse[1] += (s.target[1] - s.mouse[1]) * k;
    const r = renderer.current;
    const tex = texture.current;
    if (!r || !tex?.ready || reduced) return;
    const since = (performance.now() - Math.max(s.readyAt, s.revealAt)) / 1000;
    const revealed = easeOut(clamp(since / 2.6));
    r.refresh(tex);
    const [cw, ch] = r.resize(narrow ? 1.25 : 1.6);
    const gl = r.gl;
    gl.uniform2f(r.uniform("uRes"), cw, ch);
    gl.uniform2f(r.uniform("uImg"), tex.width, tex.height);
    gl.uniform2f(r.uniform("uMouse"), s.mouse[0], s.mouse[1]);
    gl.uniform1f(r.uniform("uTime"), time);
    gl.uniform1f(r.uniform("uShape"), shape);
    gl.uniform1f(r.uniform("uReveal"), revealed);
    gl.uniform1f(r.uniform("uDusk"), b * b);
    r.bind(0, tex, "uTex");
    r.draw();
  });

  return (
    <section ref={root} className="opening" data-header="dark" aria-label={title.replace(/\n/g, " ")}>
      <div className="intro" aria-hidden="true">
        <div className="intro-window" />
        <div className="intro-mark">
          <Sun className="intro-sun" />
          <span className="intro-count" />
        </div>
      </div>
      <div className="opening-sticky">
        <div className="opening-paper" aria-hidden="true">
          <Sun className="opening-sun" />
        </div>
        <p className="opening-side is-left" aria-hidden="true">
          <Chars text={left} single />
        </p>
        <p className="opening-side is-right" aria-hidden="true">
          <Chars text={right} single />
        </p>
        <div ref={frame} className="opening-frame">
          <div className="opening-media">
            {desktop ? (
              <picture>
                {mobile && <source media="(max-width: 767px)" srcSet={mobile.srcSet} />}
                <img {...desktop} alt={alt} />
              </picture>
            ) : (
              image && <video {...videoProps(image)} muted loop playsInline autoPlay aria-label={alt} />
            )}
            <canvas ref={canvas} className="opening-gl" aria-hidden="true" />
          </div>
          <div className="opening-shade" />
          <div className="opening-copy">
            <h1 className="opening-title">
              <Chars text={title} italicLast />
            </h1>
            {sub && <p className="opening-sub">{sub.replace(/\n/g, " ")}</p>}
          </div>
        </div>
        {eyebrow && (
          <p className="opening-eyebrow" aria-hidden="true" style={{ "--len": eyebrow.length } as CSSProperties}>
            {eyebrow}
          </p>
        )}
        <a className="opening-cue" href="#services">
          <span>{t.scroll}</span>
          <i />
        </a>
      </div>
    </section>
  );
}
