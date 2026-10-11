'use client';

import Image from 'next/image';
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/* Never leave the background empty for longer than this if the image is slow or broken */
const LOAD_TIMEOUT = 8000;

/* Shared morph intensity (0 = still, 1 = full morph). A motion value, so no re-renders. */
const MorphContext = createContext<MotionValue<number> | null>(null);

/** Wrap a section in this. Any trigger inside can morph any MorphImage inside. */
export function MorphScope({ children }: { children: ReactNode }) {
  const intensity = useMotionValue(0);
  return <MorphContext.Provider value={intensity}>{children}</MorphContext.Provider>;
}

/**
 * Spread the returned handlers onto any element to make it trigger the morph.
 * Outside a MorphScope it returns nothing, so the element works normally.
 */
export function useMorphTrigger() {
  const intensity = useContext(MorphContext);
  if (!intensity) return {};

  const start = () => animate(intensity, 1, { duration: 0.8, ease: 'easeOut' });
  const stop = () => animate(intensity, 0, { duration: 1.4, ease: 'easeInOut' });

  return { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop };
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

type MorphImageProps = {
  src: string;
  alt?: string;
  className?: string;
  /** How far pixels get pushed at full morph */
  strength?: number;
  priority?: boolean;
};

/**
 * Full-cover background image that ripples/warps while its MorphScope is triggered.
 * It stays hidden until the image has loaded, then settles in with a short fade
 * and zoom-out, so it never pops in half-drawn.
 */
export function MorphImage({ src, alt = '', className = '', strength = 60, priority }: MorphImageProps) {
  const scoped = useContext(MorphContext);
  const fallback = useMotionValue(0);
  const intensity = scoped ?? fallback;
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const ready = useImageReady(frameRef, src);

  const filterId = `morph-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);

  // Push pixels further as the intensity rises
  useMotionValueEvent(intensity, 'change', (v) => {
    displacementRef.current?.setAttribute('scale', String(v * strength));
  });

  // Keep the noise slowly shifting while morphing, so it looks liquid rather than frozen
  useAnimationFrame((t) => {
    if (intensity.get() < 0.01 || !turbulenceRef.current) return;
    const fx = 0.006 + Math.sin(t / 900) * 0.002;
    const fy = 0.012 + Math.cos(t / 1100) * 0.003;
    turbulenceRef.current.setAttribute('baseFrequency', `${fx} ${fy}`);
  });

  // Only apply the (costly) filter while it's actually visible
  const filter = useTransform(intensity, (v) => (v > 0.01 ? `url(#${filterId})` : 'none'));
  const scale = useTransform(intensity, [0, 1], [1, 1.04]);

  return (
    <div ref={frameRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence
            ref={turbulenceRef}
            type="fractalNoise"
            baseFrequency="0.006 0.012"
            numOctaves={2}
            seed={4}
            result="noise"
          />
          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="noise"
            scale={0}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Load reveal: hidden until the image is ready, then fades in while settling from a slight zoom.
          Kept on its own layer so it never fights the morph's filter and scale below. */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          ready
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: reduceMotion ? 1 : 1.06 }
        }
        transition={ready ? { duration: reduceMotion ? 0.4 : 1.2, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
      >
        {/* Slightly oversized so the warped edges stay off-screen */}
        <motion.div style={{ filter, scale }} className="absolute -inset-[5%]">
          <Image src={src} alt={alt} fill sizes="110vw" priority={priority} className="object-cover" />
        </motion.div>
      </motion.div>
    </div>
  );
}