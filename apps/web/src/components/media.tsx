"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { isVideo } from "@/lib/content";

/** An uploaded image or an MP4/WebM loop that only plays while visible. */
export function Media({
  src,
  alt = "",
  sizes = "100vw",
  priority = false,
  className = "",
}: {
  src: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const moving = !!src && isVideo(src);
  useEffect(() => {
    const element = video.current;
    if (!element || !moving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void element.play().catch(() => {});
        else element.pause();
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [moving, src]);
  if (!src) return <span className={"media media-empty " + className} />;
  return moving ? (
    <video
      ref={video}
      className={"media " + className}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    />
  ) : (
    <Image
      className={"media " + className}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
