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

/**
 * A tiny, already blurred copy of a picture: stretched over a whole scene it
 * reads as that picture's light, and costs the phone no filter to draw.
 */
export const auraSource = (src: string) =>
  isCloudinary(src)
    ? cloudinaryUrl(src, "c_fill,w_96,h_60,e_blur:600,q_auto,f_auto")
    : imageSource(src, 96, 60);

/** A picture at one width, for a plain <img> that is never drawn much larger. */
export const sizedSource = (src: string, width: number) =>
  isCloudinary(src)
    ? cloudinaryUrl(src, "c_limit,f_auto,q_auto,w_" + width)
    : imageSource(src, Math.round(width / 2), Math.round(width / 3.2));
