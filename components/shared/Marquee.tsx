'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';

type MarqueeProps = {
  /** One pass of the row. The component repeats it as many times as the screen needs. */
  children: ReactNode;
  /** Pixels per second */
  speed?: number;
  /** Pixels between items, and between one pass and the next */
  gap?: number;
  /** Fades the row into the page at both edges */
  fadeEdges?: boolean;
  /** Put `-mx-3` here to let the row bleed past a section's padding */
  className?: string;
};

/**
 * A row that drifts left forever, looping seamlessly. Hovering, touching or
 * tabbing into it stops it so an item can be read and clicked. Under reduced
 * motion nothing moves and the row becomes an ordinary horizontal scroller.
 *
 * The track carries the same `px-3` as the page, so a bleeding row still starts
 * flush with everything above it.
 */
export function Marquee({ children, speed = 40, gap = 12, fadeEdges = true, className = '' }: MarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [loopWidth, setLoopWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const paused = useRef(false);
  const reduceMotion = useReducedMotion();

  // One pass plus the gap after it: scroll that far and the copy sits exactly where the original was
  useEffect(() => {
    const group = groupRef.current;
    const viewport = viewportRef.current;
    if (!group || !viewport) return;

    const measure = () => {
      setLoopWidth(group.scrollWidth + gap);
      setViewportWidth(viewport.clientWidth);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(group);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [gap]);

  // Enough passes to cover the screen plus one loop length, so the row never runs dry.
  // Nothing moves under reduced motion, so one pass is enough there.
  // Measurement only lands after mount, so the first render always matches the server.
  // Capped: if an ancestor ever lets this row widen the page, more passes would widen it
  // further and the two would feed each other. Put `overflow-hidden` on the section too.
  const copies =
    loopWidth === 0 ? 2 : reduceMotion ? 1 : Math.min(12, Math.max(2, Math.ceil(viewportWidth / loopWidth) + 1));

  useAnimationFrame((_, delta) => {
    if (!loopWidth || paused.current || reduceMotion) return;
    const next = x.get() - (speed * delta) / 1000;
    x.set(next <= -loopWidth ? next + loopWidth : next);
  });

  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
  };

  return (
    <div
      onPointerEnter={pause}
      onPointerLeave={resume}
      onPointerDown={pause}
      onPointerUp={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      className={`relative overflow-hidden ${className}`}
    >
      <div ref={viewportRef} className={reduceMotion ? 'overflow-x-auto' : undefined}>
        <motion.div style={{ x, gap }} className="flex w-max px-3">
          {Array.from({ length: copies }, (_, copy) => {
            const original = copy === 0;

            return (
              <div
                key={copy}
                /* The first pass is the real one and gets measured; the rest only fill the row */
                ref={original ? groupRef : undefined}
                aria-hidden={original ? undefined : 'true'}
                style={{ gap }}
                className={`flex shrink-0 ${original ? '' : '[&_a]:pointer-events-none'}`}
              >
                {children}
              </div>
            );
          })}
        </motion.div>
      </div>

      {fadeEdges && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-black to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-black to-transparent"
          />
        </>
      )}
    </div>
  );
}
