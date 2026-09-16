"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** The studio's sun: twelve fine rays. */
export function Sun({ className = "" }: { className?: string }) {
  return (
    <svg className={"sun " + className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="100"
          y1="8"
          x2="100"
          y2="192"
          stroke="currentColor"
          strokeWidth="0.7"
          pathLength={1}
          transform={`rotate(${i * 15} 100 100)`}
          style={{ "--ri": i } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** A light, GPU-composited layer of film grain. */
export function Grain() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx || !layer.current) return;
    const image = ctx.createImageData(160, 160);
    for (let i = 0; i < image.data.length; i += 4) {
      const light = Math.random() > 0.5;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = light ? 255 : 0;
      image.data[i + 3] = Math.random() * 38;
    }
    ctx.putImageData(image, 0, 0);
    layer.current.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }, []);
  return <div ref={layer} className="grain" aria-hidden="true" />;
}

/**
 * Internal navigation plays a short scene: an arch of night rises with the
 * destination's name, the page changes behind it, and the arch lifts away.
 */
export function PageTransition() {
  const router = useRouter();
  const path = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const [label, setLabel] = useState("");
  const covering = useRef(false);
  const lastPath = useRef(path);

  useEffect(() => {
    // Capture phase: runs before next/link, which skips navigation once the click is prevented.
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      if (document.documentElement.dataset.dragging) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !/^\/(en|es)(\/|$)/.test(url.pathname)) return;
      if (url.pathname === window.location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      if (covering.current) return;
      covering.current = true;
      const text =
        anchor.dataset.label ||
        anchor.getAttribute("aria-label") ||
        anchor.textContent?.replace(/\s+/g, " ").trim() ||
        "";
      setLabel(text.slice(0, 42));
      setPhase("cover");
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), 760);
      // Never leave the curtain down if navigation fails.
      window.setTimeout(() => {
        if (covering.current) {
          covering.current = false;
          setPhase("reveal");
        }
      }, 6000);
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [router]);

  useEffect(() => {
    if (path === lastPath.current) return;
    lastPath.current = path;
    if (!covering.current) return;
    covering.current = false;
    const frame = requestAnimationFrame(() => setPhase("reveal"));
    return () => cancelAnimationFrame(frame);
  }, [path]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = window.setTimeout(() => setPhase("idle"), 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div className={"curtain is-" + phase} aria-hidden="true">
      <div className="curtain-panel">
        <Sun className="curtain-sun" />
        <span className="curtain-label" key={label}>
          {Array.from(label).map((char, i) => (
            <span key={i} style={{ "--ci": i } as CSSProperties}>
              {char === " " ? " " : char}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
