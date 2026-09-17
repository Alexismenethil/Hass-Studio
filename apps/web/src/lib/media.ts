import { getImageProps, type ImageLoader } from "next/image";
import type { SyntheticEvent } from "react";
import { cloudinaryUrl, isCloudinary, videoPoster, videoSource } from "./content";

/** Cloudinary resizes and picks the best format itself; other images go through Next. */
export const cloudinaryLoader: ImageLoader = ({ src, width }) =>
  cloudinaryUrl(src, "c_limit,f_auto,q_auto,w_" + width);

export const loaderFor = (src: string) => (isCloudinary(src) ? { loader: cloudinaryLoader } : {});

/** A single resized URL for places that need a plain src (textures, reflections). */
export const imageSource = (src: string, width: number, height: number) =>
  src.startsWith("/_next/")
    ? src
    : getImageProps({ src, alt: "", width, height, quality: 75, ...loaderFor(src) }).props.src;

/**
 * Props for a <video> of any upload. The light MP4 rendition is tried first;
 * while Cloudinary is still preparing it, the original file plays instead.
 */
export const videoProps = (src: string) => ({
  src: videoSource(src),
  poster: videoPoster(src) || undefined,
  onError: (e: SyntheticEvent<HTMLVideoElement>) => fallBack(e.currentTarget, src),
});

export function fallBack(video: HTMLVideoElement, original: string) {
  if (video.getAttribute("src") === original) return;
  video.src = original;
  video.load();
  if (video.autoplay || video.dataset.playing) void video.play().catch(() => {});
}
