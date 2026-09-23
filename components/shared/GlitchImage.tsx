'use client';

import Image from 'next/image';
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';

/* Each trigger bumps this counter; every GlitchImage in the scope reacts. No re-renders in your section. */
const GlitchContext = createContext<MotionValue<number> | null>(null);

/** Wrap a section in this so any trigger inside can glitch any GlitchImage inside. */
export function GlitchScope({ children }: { children: ReactNode }) {
  const pulse = useMotionValue(0);
  return <GlitchContext.Provider value={pulse}>{children}</GlitchContext.Provider>;
}

/** Spread onto any element to make hovering/focusing it fire a glitch burst. */
export function useGlitchTrigger() {
  const pulse = useContext(GlitchContext);
  if (!pulse) return {};
  const fire = () => pulse.set(pulse.get() + 1);
  return { onMouseEnter: fire, onFocus: fire };
}

type Slice = { top: number; height: number; left: number; width: number; dx: number; dy: number; rgb: boolean };
type Frame = { split: { r: number; g: number; b: number }; slices: Slice[] };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* One random glitch frame: channel offsets + a handful of shifted rectangular blocks */
function makeFrame(): Frame {
  const count = Math.round(rand(5, 11));
  return {
    split: { r: rand(-14, -4), g: rand(-3, 3), b: rand(4, 14) },
    slices: Array.from({ length: count }, () => ({
      top: rand(20, 90),
      height: rand(2, 12),
      left: rand(10, 70),
      width: rand(8, 35),
      dx: rand(-40, 40),
      dy: rand(-4, 4),
      rgb: Math.random() > 0.4,
    })),
  };
}

function Cover({ src, alt = '', priority }: { src: string; alt?: string; priority?: boolean }) {
  return <Image src={src} alt={alt} fill priority={priority} sizes="100vw" className="object-cover" />;
}

type GlitchImageProps = {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  /** Number of jumpy frames per burst and how long each lasts (ms) */
  frames?: number;
  frameMs?: number;
};

/** Full-cover image that bursts into an RGB-split, blocky glitch when its scope is triggered. */
export function GlitchImage({ src, alt = '', className = '', priority, frames = 6, frameMs = 60 }: GlitchImageProps) {
  const scoped = useContext(GlitchContext);
  const fallback = useMotionValue(0);
  const pulse = scoped ?? fallback;
  const reduceMotion = useReducedMotion();

  const filterId = `glitch-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [frame, setFrame] = useState<Frame | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useMotionValueEvent(pulse, 'change', () => {
    if (reduceMotion) return;
    clearTimers();
    // Step through a few random frames (jumpy, not smooth), with a blank gap mid-way for a flicker
    for (let i = 0; i < frames; i++) {
      timers.current.push(
        window.setTimeout(() => setFrame(i === Math.floor(frames / 2) ? null : makeFrame()), i * frameMs),
      );
    }
    timers.current.push(window.setTimeout(() => setFrame(null), frames * frameMs));
  });

  useEffect(() => clearTimers, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {frame && (
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id={filterId} x="-5%" y="0" width="110%" height="100%" colorInterpolationFilters="sRGB">
            {/* Split into red, green and blue, nudge each sideways, then screen them back together */}
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={frame.split.r} dy="0" result="r2" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feOffset in="g" dx={frame.split.g} dy="0" result="g2" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={frame.split.b} dy="2" result="b2" />
            <feBlend in="r2" in2="g2" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </svg>
      )}

      {/* Base image */}
      <Cover src={src} alt={alt} priority={priority} />

      {frame && (
        <div aria-hidden="true">
          {/* Whole-image colour split */}
          <div className="absolute inset-0" style={{ filter: `url(#${filterId})` }}>
            <Cover src={src} />
          </div>

          {/* Displaced blocks */}
          {frame.slices.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                clipPath: `inset(${s.top}% ${Math.max(0, 100 - s.left - s.width)}% ${Math.max(0, 100 - s.top - s.height)}% ${s.left}%)`,
                transform: `translate(${s.dx}px, ${s.dy}px)`,
                filter: s.rgb ? `url(#${filterId})` : undefined,
              }}
            >
              <Cover src={src} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}