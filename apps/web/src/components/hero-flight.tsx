"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Arrow } from "./icon";
import { Chars } from "./text";
import { copy, type Locale } from "@/lib/content";
import { sizedSource } from "@/lib/media";

export type FlightCard = {
  src: string;
  tall: boolean;
  title: string;
  label: string;
  href: string;
};

/*
 * The geometry of the flight. Every picture hangs somewhere in a long hall of
 * space, `z` pixels in front of the camera; scrolling moves the camera through
 * the hall by `travel`. A picture is seen once it is within `far` of the camera,
 * and leaves (fades) just before it would reach the lens at `gone`. Phones get
 * a shorter hall and a closer lens. Kept in step with .flight in site.css.
 */
const DESK = { lens: 1000, travel: 4200, near: -200, step: 320, far: -2600, gone: 560 };
const PHONE = { lens: 760, travel: 3600, near: -160, step: 300, far: -2400, gone: 430 };
/** Words are read closer to the lens than pictures are seen. */
const WORDS = { desk: { far: -1100, gone: 350 }, phone: { far: -950, gone: 280 } };
const GOLDEN = 137.508;
/** Pictures this deep arrive after the title has gone, so they may fly closer to the middle… */
const OPEN = 6;
/** …unless a line of words is hung near them: then they keep to the walls. */
const CLEAR = 700;

type Geometry = typeof DESK;

/** The share of the camera's travel during which something at `z` is on show. */
const shown = (g: Geometry, z: number, far = g.far, gone = g.gone) => [
  (((far - z) / g.travel) * 100).toFixed(2) + "%",
  (((gone - z) / g.travel) * 100).toFixed(2) + "%",
];

function place(i: number, tall: boolean, words: number[]) {
  const z = DESK.near - i * DESK.step;
  const open = i >= OPEN && words.every((w) => Math.abs(w - z) > CLEAR);
  const angle = ((i * GOLDEN + 24) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const d = {
    x: cos * (open ? 23 + (i % 3) * 4 : 31 + (i % 3) * 4.5),
    y: sin * (open ? 17 + (i % 2) * 8 : 25 + (i % 2) * 8),
    z,
    w: tall ? [8.4, 9.6][i % 2] : [19, 16.5, 22][i % 3],
  };
  // A phone has no room either side of the title: its first pictures hang above
  // and below it, never level with the words.
  const tilt = (((i * 53) % 70) - 35) * (Math.PI / 180);
  const up = i % 2 ? 1 : -1;
  const m = {
    x: Math.sin(tilt) * (open ? 30 : 34),
    y: up * Math.cos(tilt) * (open ? 21 + (i % 3) * 4 : 36 + (i % 3) * 3),
    z: PHONE.near - i * PHONE.step,
    w: tall ? [24, 28][i % 2] : [50, 44, 56][i % 3],
  };
  const [f0, f1] = shown(DESK, d.z);
  const [mf0, mf1] = shown(PHONE, m.z);
  return {
    "--x": d.x.toFixed(2) + "vw",
    "--y": d.y.toFixed(2) + "vh",
    "--z": d.z + "px",
    "--w": d.w + "vw",
    "--mx": m.x.toFixed(2) + "vw",
    "--my": m.y.toFixed(2) + "vh",
    "--mz": m.z + "px",
    "--mw": m.w + "vw",
    // The walls of the hall lean in towards the middle, a little.
    "--ry": (-d.x * 0.32).toFixed(2) + "deg",
    "--rz": (((i * 37) % 9) - 4).toFixed(1) + "deg",
    "--f0": f0,
    "--f1": f1,
    "--mf0": mf0,
    "--mf1": mf1,
    "--i": i,
  } as CSSProperties;
}

/** Where a line read at `at` of the flight hangs. */
const depthOf = (at: number) => Math.round(-150 - at * DESK.travel);

/** A line of words hung in the hall so that it is closest to you at `at` of the flight. */
function hang(at: number, k: number) {
  const z = depthOf(at);
  const mz = Math.round(-120 - at * PHONE.travel);
  const [f0, f1] = shown(DESK, z, WORDS.desk.far, WORDS.desk.gone);
  const [mf0, mf1] = shown(PHONE, mz, WORDS.phone.far, WORDS.phone.gone);
  return {
    "--z": z + "px",
    "--mz": mz + "px",
    "--py": (k % 2 ? 7 : -6) + "vh",
    "--f0": f0,
    "--f1": f1,
    "--mf0": mf0,
    "--mf1": mf1,
  } as CSSProperties;
}

/**
 * The opening: a title in a cream morning, and the studio's real work hanging
 * in the space around it. Scrolling flies the camera through the pictures —
 * they come out of the haze behind the title, grow and pass either side — and
 * through a few words hung in the air, while the light turns amber and goes
 * down to the espresso night the work is shown in.
 *
 * All of it is CSS: the camera is one transform on a scroll-driven timeline,
 * so the browser flies it on the compositor and a phone keeps up. Script only
 * leans the hall towards a mouse.
 */
export function HeroFlight({
  cards,
  title,
  lines,
  locale,
}: {
  cards: FlightCard[];
  title: string;
  lines: string[];
  locale: Locale;
}) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  // Where along the flight each line is read: spread over the amber and the night.
  const stops = lines.length === 1 ? [0.64] : lines.map((_, k) => 0.54 + (k * 0.32) / (lines.length - 1));

  useEffect(() => {
    const el = root.current;
    const hall = tilt.current;
    const title = words.current;
    if (!el || !hall || !title) return;
    const begin = window.setTimeout(() => el.classList.add("is-in"), 60);
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return () => window.clearTimeout(begin);
    let frame = 0;
    let px = 0;
    let py = 0;
    const move = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          hall.style.transform = `rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
          // The title leans the other way, a little: it stands nearer than the hall.
          title.style.transform = `perspective(1400px) rotateX(${(py * 2.4).toFixed(2)}deg) rotateY(${(-px * 3.2).toFixed(2)}deg)`;
        });
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.clearTimeout(begin);
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <section
      ref={root}
      className="flight"
      data-header="light"
      aria-label={title.replace(/\n/g, " ")}
      style={{ "--lens": DESK.lens + "px", "--mlens": PHONE.lens + "px" } as CSSProperties}
    >
      <div className="flight-sticky">
        <div className="flight-dusk" aria-hidden="true" />
        <div className="flight-sunset" aria-hidden="true" />
        <div className="flight-space" aria-hidden="true">
          <div className="flight-drift">
            <div ref={tilt} className="flight-tilt">
              <div className="flight-intro">
                <div className="flight-world">
                  {cards.map((card, i) => (
                    <Link
                      key={card.src + i}
                      href={card.href}
                      className={"flight-card" + (card.tall ? " is-tall" : "")}
                      style={place(i, card.tall, stops.map(depthOf))}
                      tabIndex={-1}
                      data-cursor={t.view}
                    >
                      <span className="flight-card-in">
                        <span className="flight-frame">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sizedSource(card.src, card.tall ? 360 : 680)}
                            alt=""
                            decoding="async"
                            loading={i < 12 ? "eager" : "lazy"}
                            draggable={false}
                          />
                        </span>
                        <span className="flight-cap">
                          <b>{card.title}</b>
                          <small>{card.label}</small>
                        </span>
                      </span>
                    </Link>
                  ))}
                  {lines.map((line, k) => (
                    <p key={k} className="flight-phrase" style={hang(stops[k], k)}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flight-mist" aria-hidden="true" />
        <div className="flight-copy">
          <div ref={words} className="flight-copy-in">
            <h1 className="flight-title" data-chars>
              <Chars text={title} italicLast />
            </h1>
          </div>
        </div>
        <a className="flight-go" href="#work">
          <span>{t.selectedWork}</span>
          <i>
            <Arrow className="arrow-down" />
          </i>
        </a>
      </div>
      {/* Where the light has gone down: the header turns light over it. */}
      <div className="flight-night" data-header="dark" aria-hidden="true" />
      {lines.length > 0 && <p className="sr-only">{lines.join(" ")}</p>}
    </section>
  );
}
