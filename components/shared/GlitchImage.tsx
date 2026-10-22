'use client';

import Image from 'next/image';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';

/* Never leave the image hidden for longer than this if it is slow or broken */
const LOAD_TIMEOUT = 8000;

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

/**
 * True once the <img> inside `ref` has loaded and decoded (or failed, or timed out).
 * Resets whenever `key` changes, e.g. on a new src.
 */
function useImageReady(ref: RefObject<HTMLElement | null>, key: string) {
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReadyKey(key);
    };
    // Wait for decoding too, so the first visible frame already has the full picture
    const decodeThenFinish = (img: HTMLImageElement) => {
      img.decode().catch(() => undefined).then(finish);
    };

    // Already loaded (cached, or finished before this effect ran)
    const existing = el.querySelector('img');
    if (existing?.complete && existing.naturalWidth > 0) {
      decodeThenFinish(existing);
      return () => {
        done = true;
      };
    }

    // load/error don't bubble, so listen in the capture phase to catch the inner <img>
    const onEvent = (e: Event) => {
      if (!(e.target instanceof HTMLImageElement)) return;
      if (e.type === 'error') finish();
      else decodeThenFinish(e.target);
    };
    el.addEventListener('load', onEvent, true);
    el.addEventListener('error', onEvent, true);
    const timeout = window.setTimeout(finish, LOAD_TIMEOUT);

    return () => {
      done = true;
      el.removeEventListener('load', onEvent, true);
      el.removeEventListener('error', onEvent, true);
      window.clearTimeout(timeout);
    };
  }, [ref, key]);

  return readyKey === key;
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

function Cover({
  src,
  alt = '',
  priority,
  sizes = '100vw',
  eager = false,
}: {
  src: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  /** Glitch layers load straight away (the file is already cached), so no block flashes blank */
  eager?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      loading={priority ? undefined : eager ? 'eager' : undefined}
      sizes={sizes}
      className="object-cover"
    />
  );
}

type GlitchImageProps = {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  /** How wide the image actually renders, for next/image. Leave as is for full-bleed sections. */
  sizes?: string;
  /** Number of jumpy frames per burst and how long each lasts (ms) */
  frames?: number;
  frameMs?: number;
  /**
   * Fade the image in once it has loaded. Default true. Turn it off when something
   * around it already handles the reveal (RevealImage does).
   */
  fadeIn?: boolean;
  /** next/image `loading`. RevealImage sets 'eager', since a lazy image inside its clipped layer never starts */
  loading?: 'eager' | 'lazy';
};

/**
 * Full-cover image that bursts into an RGB-split, blocky glitch when its scope is triggered.
 * It stays hidden until the image has loaded (then fades in), and ignores bursts until
 * then, so it never glitches an empty or half-drawn frame.
 */
export function GlitchImage({
  src,
  alt = '',
  className = '',
  priority,
  sizes = '100vw',
  frames = 6,
  frameMs = 60,
  fadeIn = true,
  loading,
}: GlitchImageProps) {
  const scoped = useContext(GlitchContext);
  const fallback = useMotionValue(0);
  const pulse = scoped ?? fallback;
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const ready = useImageReady(frameRef, src);
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  const filterId = `glitch-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [frame, setFrame] = useState<Frame | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useMotionValueEvent(pulse, 'change', () => {
    // Nothing to glitch until the picture is actually there
    if (reduceMotion || !readyRef.current) return;
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

  // A new src that isn't loaded yet shouldn't be shown mid-burst
  const showFrame = ready ? frame : null;

  return (
    <div ref={frameRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {showFrame && (
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id={filterId} x="-5%" y="0" width="110%" height="100%" colorInterpolationFilters="sRGB">
            {/* Split into red, green and blue, nudge each sideways, then screen them back together */}
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={showFrame.split.r} dy="0" result="r2" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feOffset in="g" dx={showFrame.split.g} dy="0" result="g2" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={showFrame.split.b} dy="2" result="b2" />
            <feBlend in="r2" in2="g2" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </svg>
      )}

      {/* Base image: hidden until loaded, then fades in (or appears at once when fadeIn is off) */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: ready || !fadeIn ? 1 : 0 }}
        transition={ready && fadeIn ? { duration: reduceMotion ? 0.3 : 0.7, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
      >
        <Cover src={src} alt={alt} priority={priority} sizes={sizes} eager={loading === 'eager'} />
      </motion.div>

      {showFrame && (
        <div aria-hidden="true">
          {/* Whole-image colour split */}
          <div className="absolute inset-0" style={{ filter: `url(#${filterId})` }}>
            <Cover src={src} sizes={sizes} eager />
          </div>

          {/* Displaced blocks */}
          {showFrame.slices.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                clipPath: `inset(${s.top}% ${Math.max(0, 100 - s.left - s.width)}% ${Math.max(0, 100 - s.top - s.height)}% ${s.left}%)`,
                transform: `translate(${s.dx}px, ${s.dy}px)`,
                filter: s.rgb ? `url(#${filterId})` : undefined,
              }}
            >
              <Cover src={src} sizes={sizes} eager />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}