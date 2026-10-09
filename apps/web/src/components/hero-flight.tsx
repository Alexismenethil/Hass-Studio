"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Arrow } from "./icon";
import { copy, lines, type Locale } from "@/lib/content";
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
const DESK = { lens: 1000, travel: 4200, near: -150, ring: 150, step: 330, far: -2600, gone: 560 };
const PHONE = { lens: 760, travel: 3600, near: -120, ring: 130, step: 300, far: -2400, gone: 430 };
const GOLDEN = 137.508;
/**
 * The first pictures stand close, in a ring around the title — as SubeYA's do —
 * at these places on the screen (vw, vh from the middle). The rest hang deeper
 * down the hall and arrive as you fly.
 */
const RING = [
  { d: [-34, -21], m: [-20, -30] },
  { d: [33, 19], m: [22, 29] },
  { d: [-31, 25], m: [20, -35] },
  { d: [31, -25], m: [-22, 33] },
  { d: [-7, -34], m: [-24, 19] },
  { d: [15, 33], m: [26, 40] },
];
/** Pictures this deep arrive once the flight is under way, so they may pass closer behind the title. */
const OPEN = 9;

type Geometry = typeof DESK;

const depth = (g: Geometry, i: number) =>
  i < RING.length
    ? g.near - i * g.ring
    : g.near - (RING.length - 1) * g.ring - (i - RING.length + 1) * g.step;
/** How much bigger than seen something at `z` must be to look that size from the lens. */
const unscale = (g: Geometry, z: number) => (g.lens - z) / g.lens;

/** The share of the camera's travel during which something at `z` is on show. */
const shown = (g: Geometry, z: number) => [
  (((g.far - z) / g.travel) * 100).toFixed(2) + "%",
  (((g.gone - z) / g.travel) * 100).toFixed(2) + "%",
];

function place(i: number, tall: boolean) {
  const open = i >= OPEN;
  const ring = RING[i];
  const angle = ((i * GOLDEN + 24) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dz = depth(DESK, i);
  const mz = depth(PHONE, i);
  const d = {
    x: ring ? ring.d[0] * unscale(DESK, dz) : cos * (open ? 25 + (i % 3) * 4 : 31 + (i % 3) * 4.5),
    y: ring ? ring.d[1] * unscale(DESK, dz) : sin * (open ? 19 + (i % 2) * 8 : 25 + (i % 2) * 8),
    z: dz,
    w: tall ? [8.6, 9.6][i % 2] : [18, 16, 20.5][i % 3],
  };
  // A phone has no room either side of the title: its pictures hang above and
  // below it, never level with the words.
  const tilt = (((i * 53) % 70) - 35) * (Math.PI / 180);
  const up = i % 2 ? 1 : -1;
  const m = {
    x: ring ? ring.m[0] * unscale(PHONE, mz) : Math.sin(tilt) * (open ? 30 : 34),
    y: ring
      ? ring.m[1] * unscale(PHONE, mz)
      : up * Math.cos(tilt) * (open ? 25 + (i % 3) * 4 : 36 + (i % 3) * 3),
    z: mz,
    w: tall ? [24, 27][i % 2] : [46, 42, 50][i % 3],
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
    // How far the card turns while it is dealt out from behind the title.
    "--dr": ((i % 2 ? 1 : -1) * (12 + (i % 3) * 7)).toFixed(0) + "deg",
    "--f0": f0,
    "--f1": f1,
    "--mf0": mf0,
    "--mf1": mf1,
    "--i": i,
  } as CSSProperties;
}

/**
 * The title, word by word. Each word rises out of its own mask when the page
 * opens, and at the end of the flight flies off towards the camera, away from
 * the middle (--ex, --ey), one after another.
 */
function TitleWords({ text }: { text: string }) {
  const rows = lines(text);
  const total = rows.join(" ").split(" ").filter(Boolean).length || 1;
  let n = 0;
  return (
    <>
      {rows.map((row, l) => {
        const words = row.split(" ").filter(Boolean);
        return (
          <span key={l} className={"tl" + (rows.length > 1 && l === rows.length - 1 ? " italic" : "")}>
            {words.map((word, w) => {
              const i = n++;
              const ex = ((w + 0.5) / words.length - 0.5) * 80;
              const ey = (l - (rows.length - 1) / 2) * 38;
              return (
                <Fragment key={w}>
                  <span
                    className="tw"
                    style={
                      {
                        "--wi": i,
                        "--wn": total,
                        "--ex": ex.toFixed(1) + "vw",
                        "--ey": ey.toFixed(1) + "vh",
                      } as CSSProperties
                    }
                  >
                    <span className="tw-in">{word}</span>
                  </span>
                  {w < words.length - 1 && " "}
                </Fragment>
              );
            })}
          </span>
        );
      })}
    </>
  );
}

/**
 * The opening, an inward version of SubeYA's "Ya están en la app": the title
 * stays in the middle of the screen the whole way, and the studio's real work
 * flies past it into the screen instead of down it.
 *
 * It opens with the title's words rising out of their masks and the pictures
 * dealt out from behind it like cards, each turning and growing into its place
 * in the hall. Scrolling flies the camera through them while the light turns
 * amber and goes down to the espresso night (the title turns from ink to cream
 * with it). It ends with the words flying off past you and a warm light opening
 * at the far end of the hall, onto the work.
 *
 * All of the scroll-linked motion is CSS on the section's view timeline, so the
 * browser runs it on the compositor and a phone keeps up. Script only starts
 * the opening and leans the hall towards a mouse.
 */
export function HeroFlight({
  cards,
  title,
  locale,
}: {
  cards: FlightCard[];
  title: string;
  locale: Locale;
}) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const hall = tilt.current;
    const lean = words.current;
    if (!el || !hall || !lean) return;
    // Two frames, so the browser has painted the starting positions to deal from.
    let start = requestAnimationFrame(() => {
      start = requestAnimationFrame(() => el.classList.add("is-in"));
    });
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return () => cancelAnimationFrame(start);
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
          lean.style.transform = `perspective(1400px) rotateX(${(py * 2.4).toFixed(2)}deg) rotateY(${(-px * 3.2).toFixed(2)}deg)`;
        });
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(start);
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
        <div className="flight-bloom" aria-hidden="true" />
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
                      style={place(i, card.tall)}
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
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flight-mist" aria-hidden="true" />
        <div className="flight-mist is-night" aria-hidden="true" />
        <div className="flight-copy">
          <div ref={words} className="flight-copy-in">
            <h1 className="flight-title">
              <span className="sr-only">{title.replace(/\n/g, " ")}</span>
              <span aria-hidden="true">
                <TitleWords text={title} />
              </span>
            </h1>
            {/* The same words in cream, for when the night has come. */}
            <div className="flight-title is-night" aria-hidden="true">
              <TitleWords text={title} />
            </div>
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
    </section>
  );
}
