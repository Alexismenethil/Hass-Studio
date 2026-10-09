"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Arrow } from "./icon";
import { Chars } from "./text";
import { OpeningLaptop } from "./laptop";
import {
  cloudinaryUrl,
  copy,
  isCloudinary,
  isVideo,
  videoPoster,
  videoSource,
  type Locale,
} from "@/lib/content";
import { auraSource, sizedSource } from "@/lib/media";

export type Chapter = {
  slug: string;
  title: string;
  label: string;
  year: number;
  description: string;
  screen: string;
  phone: string;
  aura: string;
};

/** The first clause of a description: one line that says what it is. */
const tagline = (text: string) => {
  const first = text.split(/[:.;]/)[0].trim();
  return first ? first + "." : "";
};

/**
 * The work, one chapter each, stacked like cards on a table. A chapter rises
 * out of the dark tilted away from you; the laptop stands up and its lid opens
 * as it reaches the middle, the display wakes, a phone floats in beside it.
 * When the next one slides over it, it sinks back into the dark.
 *
 * The choreography is all scroll-driven CSS on each chapter's own view
 * timeline; script only plays the video of the chapter on screen.
 */
export function WorkChapters({
  items,
  heading,
  locale,
}: {
  items: Chapter[];
  heading: string;
  locale: Locale;
}) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target.querySelector<HTMLVideoElement>("video");
          if (!video) continue;
          if (entry.isIntersecting && !calm) void video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.35 },
    );
    el.querySelectorAll(".ch").forEach((chapter) => watch.observe(chapter));
    return () => watch.disconnect();
  }, []);

  return (
    <section ref={root} id="work" className="work" data-header="dark">
      <header className="work-head">
        <h2 className="work-heading" data-chars>
          <Chars text={heading} italicLast />
        </h2>
      </header>

      {items.map((item, i) => {
        const words = item.title.split(" ");
        const longest = Math.max(...words.map((w) => w.length));
        let letter = 0;
        return (
          <article
            key={item.slug}
            className="ch"
            data-dive-scene
            style={
              {
                "--i": i,
                "--len": item.title.length,
                "--lw": longest,
                "--lc": item.title.replace(/\s/g, "").length,
              } as CSSProperties
            }
          >
            <div className="ch-inner" data-dive-source>
              <div className="ch-aura" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={auraSource(item.aura)} alt="" decoding="async" />
              </div>
              <h3 className="ch-title" aria-label={item.title}>
                {words.map((word, w) => (
                  <Fragment key={w}>
                    <span className="ch-word" aria-hidden="true">
                      {Array.from(word).map((char, c) => (
                        <span
                          key={c}
                          className="ch-char"
                          style={{ "--li": letter++ } as CSSProperties}
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                    {w < words.length - 1 && " "}
                  </Fragment>
                ))}
              </h3>

              <div className="ch-stage">
                <div className="ch-rig">
                  <div className="ch-device" data-dive-device>
                    <OpeningLaptop>
                      <div
                        className="screen"
                        style={{ "--o": 1, "--y": 0 } as CSSProperties}
                      >
                        {isVideo(item.screen) ? (
                          // A phone gets a lighter cut; the original is the last resort
                          // while Cloudinary is still preparing the renditions.
                          <video
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster={videoPoster(item.screen) || undefined}
                          >
                            {isCloudinary(item.screen) && (
                              <source
                                media="(max-width: 767px)"
                                src={cloudinaryUrl(
                                  item.screen,
                                  "c_limit,q_auto,w_960",
                                  "mp4",
                                )}
                                type="video/mp4"
                              />
                            )}
                            <source
                              src={videoSource(item.screen)}
                              type="video/mp4"
                            />
                            <source src={item.screen} />
                          </video>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sizedSource(item.screen, 1400)}
                            alt=""
                            decoding="async"
                          />
                        )}
                      </div>
                    </OpeningLaptop>
                  </div>
                  {item.phone && (
                    <div className="ch-phone" aria-hidden="true">
                      <span className="ch-phone-body">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sizedSource(item.phone, 440)}
                          alt=""
                          decoding="async"
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <footer className="ch-foot">
                <p className="ch-line">{tagline(item.description)}</p>
                <Link
                  href={"/" + locale + "/work/" + item.slug}
                  className="ch-go"
                  data-transition="dive"
                  data-magnetic="0.25"
                  aria-label={t.exploreProject + ": " + item.title}
                >
                  <span className="ch-go-label">{t.exploreProject}</span>
                  <span className="ch-go-ring">
                    <Arrow diagonal />
                  </span>
                </Link>
              </footer>
              <span className="ch-shade" aria-hidden="true" />
            </div>
          </article>
        );
      })}
    </section>
  );
}
