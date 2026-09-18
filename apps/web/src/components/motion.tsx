"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Motion for server-rendered markup, in two halves.
 *
 * Entrances happen once: this file only adds `is-in` when an element reaches
 * the screen and the browser transitions it (data-chars letters come into
 * focus, data-reveal rises, data-words brighten).
 *
 * Everything that follows the scroll itself — parallax drifts, the arched
 * window, the wipe, the footer's sunset — is a CSS scroll-driven animation in
 * site.css. Nothing is moved from script while the page scrolls, which is what
 * keeps long pages steady on phones.
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const entrances = document.querySelectorAll<HTMLElement>(
      "[data-chars],[data-reveal],[data-words]",
    );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      entrances.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      // A little inside the screen, so nothing animates while still under the fold.
      { rootMargin: "0px 0px -7% 0px" },
    );
    entrances.forEach((el) => {
      const delay = Number(el.dataset.reveal);
      if (delay) el.style.setProperty("--delay", delay + "s");
      observer.observe(el);
    });

    // Buttons and orbs lean towards the pointer; the CSS transition does the easing.
    const cleanups: (() => void)[] = [];
    if (window.matchMedia("(pointer: fine)").matches)
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const strength = Number(el.dataset.magnetic) || 0.3;
        const move = (e: PointerEvent) => {
          const box = el.getBoundingClientRect();
          const x = (e.clientX - box.left - box.width / 2) * strength;
          const y = (e.clientY - box.top - box.height / 2) * strength;
          el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
        };
        const leave = () => {
          el.style.translate = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        el.classList.add("is-magnetic");
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [path]);
  return null;
}
