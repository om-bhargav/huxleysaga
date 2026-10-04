"use client";

import Lenis, { type LenisOptions } from "lenis";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import "lenis/dist/lenis.css";

/* ------------------------------------------------------------------ */
/* LENIS SETTINGS — tweak the feel here                                */
/* ------------------------------------------------------------------ */

const LENIS_OPTIONS: LenisOptions = {
  autoRaf: true,

  // Smoothness: lower = smoother/heavier glide, higher = snappier (0–1)
  lerp: 0.085,

  // Mouse wheel / trackpad
  smoothWheel: true,
  wheelMultiplier: 1,

  // Touch: keep native scrolling on phones
  syncTouch: false,
  touchMultiplier: 1.2,

  // Smooth-scroll to #anchor links. If the navbar is fixed and covers
  // section headings, set a negative offset of its height, e.g. -80
  anchors: { offset: 0 },

  // Let nested scrollable elements (modals, dropdowns) scroll on their own
  allowNestedScroll: true,

  // Users with "reduce motion" get normal 1:1 scrolling
  respectReducedMotion: true,
};

/* ------------------------------------------------------------------ */
/* CONTEXT                                                             */
/* ------------------------------------------------------------------ */

type ScrollContextValue = {
  lenis: Lenis | null;
  /** The element wrapping the page content inside <main> */
  contentRef: RefObject<HTMLDivElement | null>;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useSmoothScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  }
  return ctx;
}

/** @deprecated old name — use useSmoothScroll */
export const useContainerLenis = useSmoothScroll;

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

/**
 * Smooth scrolling for the Layout, used inside <main>:
 *
 *   <main className="relative z-5 bg-background mb-[400px] …">
 *     <SmoothScroll>{children}</SmoothScroll>
 *   </main>
 *
 * Lenis is created here (not with a global ReactLenis provider) and lives
 * only as long as this component. It smooths the PAGE scroll rather than
 * making a separate scroll box, because the Layout needs the page itself to
 * scroll: the fixed Navbar stays put, and the 400px bottom margin on <main>
 * is what lets the page scroll past the content to reveal the Footer.
 *
 * `contentRef` wraps the page content; whenever it changes size (images
 * loading, sections expanding, a new route) Lenis re-measures right away,
 * so the scroll end — and the footer reveal — is always correct.
 */
export default function SmoothScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  // Create Lenis on mount, destroy on unmount
  useEffect(() => {
    const instance = new Lenis({
      ...LENIS_OPTIONS,
      wrapper: window,
      // Measure the whole document so the scroll range includes the
      // Navbar and the footer-reveal margin on <main>, not just the content
      content: document.documentElement,
    });
    setLenis(instance);

    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Re-measure immediately when the page content changes size
  // (Lenis's own check waits 250ms, which can briefly cut off the footer)
  useEffect(() => {
    const content = contentRef.current;
    if (!lenis || !content) return;

    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(content);
    return () => observer.disconnect();
  }, [lenis]);

  // Back to the top on every route change
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  return (
    <ScrollContext.Provider value={{ lenis, contentRef }}>
      <div ref={contentRef} className={`w-full ${className}`}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
}