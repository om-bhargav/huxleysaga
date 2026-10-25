"use client";
import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Inertial smooth scrolling on desktop (mouse / trackpad).
 *
 * Native scrolling is kept on touch devices (phones, tablets)
 * and when the visitor prefers reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reduced || touch) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const onScroll = () => {
      ScrollTrigger.update();
    };

    lenis.on("scroll", onScroll);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's default, restored

      delete (window as unknown as { __lenis?: Lenis }).__lenis;

      lenis.destroy();
    };
  }, []);

  return null;
}