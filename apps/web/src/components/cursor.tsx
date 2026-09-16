"use client";
import { useEffect, useRef } from "react";

/** A soft circle that names the action under the pointer ("View", "Drag"). */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dot.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches) return;
    const label = el.querySelector("span")!;
    let x = -100;
    let y = -100;
    let cx = -100;
    let cy = -100;
    let frame = 0;
    const loop = () => {
      const k = reduced.matches ? 1 : 0.2;
      cx += (x - cx) * k;
      cy += (y - cy) * k;
      el.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      frame =
        Math.abs(x - cx) + Math.abs(y - cy) > 0.3
          ? requestAnimationFrame(loop)
          : 0;
    };
    let pending = 0;
    const sync = (target: Element | null) => {
      const text = target?.closest?.("[data-cursor]")?.getAttribute("data-cursor") || "";
      if (text) label.textContent = text;
      el.classList.toggle("is-on", !!text);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      sync(e.target as Element | null);
      if (!frame) frame = requestAnimationFrame(loop);
    };
    // Content moves under a still pointer while scrolling.
    const scroll = () => {
      if (pending || x < 0) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        sync(document.elementFromPoint(x, y));
      });
    };
    const leave = () => el.classList.remove("is-on");
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={dot} className="cursor" aria-hidden="true">
      <span />
    </div>
  );
}
