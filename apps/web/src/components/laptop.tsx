"use client";
import { useCallback, useState, type ReactNode } from "react";
import { isVideo } from "@/lib/content";
import { imageSource } from "@/lib/media";

/**
 * cover: fills the display. contain: portrait screens (phones) float over a
 * blurred copy. scroll: full-page website captures travel inside the display.
 */
export type Fit = "cover" | "contain" | "scroll";

export function useFits(count: number) {
  const [fits, setFits] = useState<Fit[]>(() => Array.from({ length: count }, () => "cover"));
  const detect = useCallback((i: number, w: number, h: number, video: boolean) => {
    if (!w || !h) return;
    const ratio = h / w;
    const fit: Fit = !video && w >= 1360 && ratio > 0.8 ? "scroll" : ratio > 0.8 ? "contain" : "cover";
    setFits((prev) => (prev[i] === fit ? prev : prev.map((f, k) => (k === i ? fit : f))));
  }, []);
  return [fits, detect] as const;
}

/** One optimized URL per screen, shared by every copy of it on the page. */
export const screenSource = (src: string) =>
  isVideo(src) ? src : imageSource(src, 960, 600);

const frame = () => (
  <img
    className="laptop-frame"
    src="/images/laptop-frontal.webp"
    alt=""
    width={1586}
    height={992}
    draggable={false}
    decoding="async"
  />
);

export function Laptop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"laptop " + className}>
      {frame()}
      <div className="laptop-screen">{children}</div>
    </div>
  );
}

/** The photographed laptop cut at its hinge, so the lid can open in 3D (driven by --lid, --power, --flash). */
export function OpeningLaptop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"laptop laptop-main " + className}>
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
