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

type Dive = { layer: HTMLDivElement; room: HTMLElement; started: number; timers: number[] };

const inView = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
};

/** The small viewport's height — what the stage is sized by (100svh). On a phone
 *  innerHeight is the large one whenever the toolbar is tucked away. */
function smallViewport() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.append(probe);
  const height = probe.getBoundingClientRect().height || window.innerHeight;
  probe.remove();
  return height;
}

/** Where the project page's laptop will sit, so the dive can aim for it before that page exists. */
function stageLaptop() {
  const vw = window.innerWidth;
  const vh = Math.max(smallViewport(), 520);
  const narrow = vw < 760;
  // Must match --lw and .stage-device in site.css, or the dive aims at the wrong
  // laptop and the handover snaps.
  return {
    x: vw / 2,
    y: vh * (narrow ? 0.42 : 0.47),
    w: narrow ? vw * 0.92 : Math.min(vw * 0.66, vh * 1.12, 1280),
  };
}

/** A copy of the project card grows into the whole screen while the project page loads behind it. */
function startDive(source: HTMLElement): Dive {
  const box = source.getBoundingClientRect();
  const device = source.querySelector<HTMLElement>("[data-dive-device]");
  const layer = document.createElement("div");
  layer.className = "dive";
  const room = source.cloneNode(true) as HTMLElement;
  room.classList.add("is-diving");
  room.removeAttribute("href");
  room.setAttribute("aria-hidden", "true");
  // Keep the exact frame a video was showing; a fresh copy would start black.
  const live = source.querySelectorAll("video");
  room.querySelectorAll("video").forEach((copy, i) => {
    const video = live[i];
    if (!video || video.readyState < 2) return;
    const still = document.createElement("canvas");
    still.width = video.videoWidth;
    still.height = video.videoHeight;
    still.getContext("2d")?.drawImage(video, 0, 0);
    copy.replaceWith(still);
  });
  room.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
  const styles = getComputedStyle(source);
  for (const name of ["--drift", "--power", "--lid", "--mx", "--my"]) {
    const value = styles.getPropertyValue(name);
    if (value) room.style.setProperty(name, value);
  }
  const set = (values: Record<string, number>) =>
    Object.entries(values).forEach(([name, value]) => room.style.setProperty(name, value.toFixed(1) + "px"));
  set({ "--x": box.left, "--y": box.top, "--w": box.width, "--h": box.height, "--r": parseFloat(styles.borderTopLeftRadius) || 0 });
  const tilt = room.querySelector<HTMLElement>(".showcase-tilt");
  if (device) {
    const d = device.getBoundingClientRect();
    // The measured width, not the layout one: a card in the rail may be scaled back.
    set({ "--dx": d.left + d.width / 2 - box.left, "--dy": d.top + d.height / 2 - box.top, "--dw": d.width });
    const liveTilt = device.querySelector<HTMLElement>(".showcase-tilt");
    if (tilt && liveTilt) tilt.style.transform = getComputedStyle(liveTilt).transform;
  }
  layer.append(room);
  document.body.append(layer);
  room.getBoundingClientRect();
  const target = stageLaptop();
  requestAnimationFrame(() => {
    layer.classList.add("is-deep");
    room.classList.add("is-deep");
    if (tilt) tilt.style.transform = "";
    set({ "--x": 0, "--y": 0, "--w": window.innerWidth, "--h": window.innerHeight, "--r": 0 });
    set({ "--dx": target.x, "--dy": target.y, "--dw": target.w });
  });
  return { layer, room, started: performance.now(), timers: [] };
}

/**
 * Internal navigation plays a short scene: an arch of night rises with the
 * destination's name, the page changes behind it, and the arch lifts away.
 * Project cards dive into their room instead, straight into the opening laptop.
 */
export function PageTransition() {
  const router = useRouter();
  const path = usePathname();
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const [label, setLabel] = useState("");
  const covering = useRef(false);
  const diving = useRef<Dive | null>(null);
  const lastPath = useRef(path);

  useEffect(() => {
    const html = document.documentElement;
    const endDive = () => {
      const dive = diving.current;
      if (!dive || dive.layer.classList.contains("is-out")) return;
      // The project's own room becomes visible under the fading copy.
      if (html.dataset.arrival === "dive") html.dataset.arrival = "landed";
      window.dispatchEvent(new Event("hass:arrive"));
      dive.layer.classList.add("is-out");
      dive.timers.push(
        window.setTimeout(() => {
          dive.layer.remove();
          dive.timers.forEach((t) => window.clearTimeout(t));
          if (html.dataset.arrival === "landed") delete html.dataset.arrival;
          diving.current = null;
        }, 850),
      );
    };
    // Capture phase: runs before next/link, which skips navigation once the click is prevented.
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      if (html.dataset.dragging) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !/^\/(en|es)(\/|$)/.test(url.pathname)) return;
      if (url.pathname === window.location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      if (covering.current || diving.current) return;
      const href = url.pathname + url.search + url.hash;
      const source =
        anchor.dataset.transition === "dive"
          ? anchor.closest("[data-dive-scene]")?.querySelector<HTMLElement>("[data-dive-source]")
          : null;
      if (source && inView(source)) {
        html.dataset.arrival = "dive";
        diving.current = startDive(source);
        // Never leave the room over the page if navigation fails.
        diving.current.timers.push(window.setTimeout(endDive, 8000));
        router.push(href);
        return;
      }
      covering.current = true;
      // A project opens on its laptop; its name would only delay it.
      const toWork = /^\/(en|es)\/work\/[^/]+\/?$/.test(url.pathname);
      if (toWork) html.dataset.arrival = "curtain";
      const text =
        anchor.dataset.label ||
        anchor.getAttribute("aria-label") ||
        anchor.textContent?.replace(/\s+/g, " ").trim() ||
        "";
      setLabel(toWork ? "" : text.slice(0, 42));
      setPhase("cover");
      window.setTimeout(() => router.push(href), 760);
      window.setTimeout(() => {
        if (covering.current) {
          covering.current = false;
          setPhase("reveal");
        }
      }, 6000);
    };
    const land = () => {
      const dive = diving.current;
      if (!dive) return;
      let tries = 0;
      const look = () => {
        const laptop = document.querySelector<HTMLElement>(".stage .laptop-main");
        if (!laptop && tries++ < 20) return void dive.timers.push(window.setTimeout(look, 60));
        if (!laptop) return endDive();
        const r = laptop.getBoundingClientRect();
        dive.room.classList.add("is-settling");
        dive.room.style.setProperty("--dx", (r.left + r.width / 2).toFixed(1) + "px");
        dive.room.style.setProperty("--dy", (r.top + r.height / 2).toFixed(1) + "px");
        dive.room.style.setProperty("--dw", r.width.toFixed(1) + "px");
        // Let the first screen finish loading so the handover is invisible.
        const first = laptop.querySelector<HTMLImageElement | HTMLVideoElement>(
          ".screen img:not(.screen-backdrop), .screen video",
        );
        const ready = () =>
          !first ||
          (first instanceof HTMLImageElement ? first.complete : first.readyState >= 2);
        const since = performance.now();
        const handover = () => {
          if (ready() || performance.now() - since > 1200) endDive();
          else dive.timers.push(window.setTimeout(handover, 80));
        };
        dive.timers.push(window.setTimeout(handover, 480));
      };
      dive.timers.push(window.setTimeout(look, Math.max(0, dive.started + 950 - performance.now())));
    };
    const onPath = () => land();
    window.addEventListener("hass:path", onPath);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("hass:path", onPath);
      document.removeEventListener("click", click, true);
    };
  }, [router]);

  useEffect(() => {
    if (path === lastPath.current) return;
    lastPath.current = path;
    if (diving.current) window.dispatchEvent(new Event("hass:path"));
    if (!covering.current) return;
    covering.current = false;
    const frame = requestAnimationFrame(() => setPhase("reveal"));
    return () => cancelAnimationFrame(frame);
  }, [path]);

  useEffect(() => {
    const html = document.documentElement;
    if (phase === "reveal") window.dispatchEvent(new Event("hass:arrive"));
    if (phase !== "reveal") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
      if (html.dataset.arrival === "curtain") delete html.dataset.arrival;
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div className={"veil is-" + phase} aria-hidden="true">
      <span className="veil-warm" />
      <span className="veil-sheet" />
      <span className="veil-card" key={label}>
        <Sun className="veil-sun" />
        {label && (
          <span className="veil-name">
            {Array.from(label).map((char, i) => (
              <span key={i} style={{ "--ci": i } as CSSProperties}>
                {char === " " ? "\u00a0" : char}
              </span>
            ))}
          </span>
        )}
      </span>
    </div>
  );
}
