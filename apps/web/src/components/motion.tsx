"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Declarative scroll motion for server-rendered markup:
 * data-reveal (rise once), data-lines (masked lines rise once),
 * data-words (words brighten with scroll), data-parallax="n" (drift ±n%),
 * data-expand (media opens to full width), data-magnetic (follows pointer).
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
        const hero = document.querySelector<HTMLElement>(".hero");
        if (hero) {
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .from(".hero-media", { scale: 1.18, duration: 2.4 }, 0)
            .from(".hero .line-inner", { yPercent: 118, duration: 1.5, stagger: 0.12 }, 0.15)
            .from(".hero-sub, .hero-scroll", { opacity: 0, y: 16, duration: 1.2, stagger: 0.1 }, 0.7);
          const exit = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.3 };
          gsap.to(".hero-media", { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: exit });
          gsap.fromTo(
            ".hero-frame",
            { clipPath: "inset(0% 0% 0% 0% round 0px)" },
            { clipPath: "inset(0% 3% 9% 3% round 28px)", ease: "none", scrollTrigger: exit },
          );
          gsap.utils.toArray<HTMLElement>(".hero .line").forEach((line, i) =>
            gsap.to(line, {
              xPercent: i % 2 ? 14 : -14,
              opacity: 0.1,
              ease: "none",
              scrollTrigger: exit,
            }),
          );
          gsap.to(".hero-sub, .hero-scroll", {
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "40% top", scrub: true },
          });
        }
        gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
          if (el.closest(".hero")) return;
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
              scrollTrigger: {
                trigger: el.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.3,
              },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-expand]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(0% 7% 0% 7% round 22px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 95%", end: "top 15%", scrub: 0.3 },
            },
          );
        });
        const footer = document.querySelector(".site-footer");
        if (footer) {
          gsap.fromTo(
            ".footer-curve",
            { scaleY: 1 },
            {
              scaleY: 0,
              ease: "none",
              scrollTrigger: { trigger: footer, start: "top bottom", end: "top 40%", scrub: true },
            },
          );
          gsap.from(".footer-inner", {
            yPercent: -8,
            ease: "none",
            scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: 0.3 },
          });
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
        ScrollTrigger.refresh();
        return () => {
          cleanups.forEach((fn) => fn());
          window.removeEventListener("load", refresh);
        };
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
