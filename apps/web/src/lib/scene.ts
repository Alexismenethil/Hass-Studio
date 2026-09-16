"use client";
import { useEffect, useRef, type RefObject } from "react";

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Portion of `v` that falls between `from` and `to`, as 0–1. */
export const span = (v: number, from: number, to: number) => clamp((v - from) / (to - from));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type SceneFrame = {
  /** Smoothed progress through the section's scrollable length (0–1). */
  p: number;
  raw: number;
  rect: DOMRect;
  vw: number;
  vh: number;
  time: number;
  dt: number;
  reduced: boolean;
};

/**
 * Runs `onFrame` on every animation frame while the section is near the viewport.
 * Progress follows native scroll with a short, frame-rate independent catch-up.
 */
export function useScene(
  ref: RefObject<HTMLElement | null>,
  onFrame: (frame: SceneFrame) => void,
  { catchUp = 14, margin = "15% 0px" }: { catchUp?: number; margin?: string } = {},
) {
  const callback = useRef(onFrame);
  useEffect(() => {
    callback.current = onFrame;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let p = -1;
    let frame = 0;
    let last = performance.now();
    let visible = false;
    const step = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh;
      const raw = total > 0 ? clamp(-rect.top / total) : 0;
      p = p < 0 || reduced.matches ? raw : p + (raw - p) * (1 - Math.exp(-dt * catchUp));
      if (Math.abs(raw - p) < 0.0002) p = raw;
      callback.current({
        p,
        raw,
        rect,
        vw: window.innerWidth,
        vh,
        time: now / 1000,
        dt,
        reduced: reduced.matches,
      });
      if (visible) frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        const was = visible;
        visible = entry.isIntersecting;
        if (visible && !was) {
          last = performance.now();
          frame = requestAnimationFrame(step);
        } else if (!visible) cancelAnimationFrame(frame);
      },
      { rootMargin: margin },
    );
    step(performance.now());
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref, catchUp, margin]);
}
