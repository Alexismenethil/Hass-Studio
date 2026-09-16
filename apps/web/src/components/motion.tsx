"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Declarative scroll motion for server-rendered markup:
 * data-chars (letters come into focus), data-lines (masked lines rise),
 * data-reveal (rise once), data-words (words brighten with scroll),
 * data-parallax="n" (drift ±n%), data-arch (an arched window opens to full width),
 * data-wipe (a curtain lifts off the image), data-magnetic (follows the pointer).
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, s]) => {
      if (cancelled) return;
      const gsap = g.default;
      const { ScrollTrigger } = s;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-chars]").forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            once: true,
            onEnter: () => el.classList.add("is-in"),
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
          gsap.from(el.querySelectorAll(".line-inner"), {
            yPercent: 118,
            duration: 1.3,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 48,
            opacity: 0,
            duration: 1.2,
            ease: "expo.out",
            delay: Number(el.dataset.reveal) || 0,
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
            clearProps: "transform,opacity",
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-words]").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll(".w"),
            { opacity: 0.14 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: 0.25 },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax) || 10;
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.3 },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-arch]").forEach((el) => {
          const media = el.querySelector(".media");
          gsap
            .timeline({
              scrollTrigger: { trigger: el, start: "top 92%", end: "top 8%", scrub: 0.3 },
            })
            .fromTo(
              el,
              { clipPath: "inset(0% 30% 0% 30% round 600px 600px 0px 0px)" },
              { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "none" },
              0,
            )
            .fromTo(media, { scale: 1.35 }, { scale: 1, ease: "none" }, 0);
        });
        gsap.utils.toArray<HTMLElement>("[data-wipe]").forEach((el) => {
          const media = el.querySelector(".media");
          gsap
            .timeline({
              scrollTrigger: { trigger: el, start: "top 96%", end: "top 45%", scrub: 0.3 },
            })
            .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0)
            .fromTo(media, { scale: 1.4 }, { scale: 1, ease: "none" }, 0);
        });
        const footer = document.querySelector(".site-footer");
        if (footer) {
          const arrive = { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: 0.4 };
          gsap.fromTo(
            ".footer-curve",
            { scaleY: 1 },
            {
              scaleY: 0,
              ease: "none",
              scrollTrigger: { trigger: footer, start: "top bottom", end: "top 40%", scrub: true },
            },
          );
          gsap.from(".footer-inner", { yPercent: -8, ease: "none", scrollTrigger: arrive });
          gsap.fromTo(".footer-rise", { yPercent: 92 }, { yPercent: 18, ease: "none", scrollTrigger: arrive });
          gsap.fromTo(".footer-sun", { rotate: -40 }, { rotate: 20, ease: "none", scrollTrigger: arrive });
          gsap.fromTo(".footer-glow, .footer-sea", { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: arrive });
        }
        const cleanups: (() => void)[] = [];
        if (window.matchMedia("(pointer: fine)").matches)
          document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
            const strength = Number(el.dataset.magnetic) || 0.3;
            const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
            const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              x((e.clientX - r.left - r.width / 2) * strength);
              y((e.clientY - r.top - r.height / 2) * strength);
            };
            const leave = () => {
              gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
        const refresh = () => ScrollTrigger.refresh();
        document.fonts?.ready.then(refresh);
        window.addEventListener("load", refresh);
        // Sections that size themselves (the reel) settle after hydration.
        const late = window.setTimeout(refresh, 600);
        ScrollTrigger.refresh();
        return () => {
          cleanups.forEach((fn) => fn());
          window.removeEventListener("load", refresh);
          window.clearTimeout(late);
        };
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        document.querySelectorAll("[data-chars]").forEach((el) => el.classList.add("is-in"));
      });
      dispose = () => mm.revert();
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [path]);
  return null;
}
