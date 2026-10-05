"use client";
import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Inertial smooth scrolling on every device, desktop and touch.
 *
 * Native scrolling is kept only when the visitor prefers reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Drive touch scrolling through Lenis too, so phones get the same eased feel
      syncTouch: true,
      // How tightly the page follows the finger while dragging (lower = smoother, laggier)
      syncTouchLerp: 0.075,
      touchMultiplier: 1,
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