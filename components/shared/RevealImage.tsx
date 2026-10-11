'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { GlitchImage, GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path

export type RevealDirection = 'top-down' | 'bottom-up' | 'left-right' | 'right-left';

type Ease = [number, number, number, number];

const defaultEase: Ease = [0.76, 0, 0.24, 1];

/* Never keep a frame empty for longer than this if an image is slow or broken */
const LOAD_TIMEOUT = 8000;

/* Start downloading once the frame is this close to the viewport */
const PRELOAD_MARGIN = '600px';

/* Start state for each direction: fully inset on the side the wipe travels towards */
const hiddenClip: Record<RevealDirection, string> = {
  'top-down': 'inset(0% 0% 100% 0%)',
  'bottom-up': 'inset(100% 0% 0% 0%)',
  'left-right': 'inset(0% 100% 0% 0%)',
  'right-left': 'inset(0% 0% 0% 100%)',
};
const shownClip = 'inset(0% 0% 0% 0%)';

/* Swap for your own cn() (clsx + tailwind-merge) if you have one */
const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export type RevealImageProps = {
  src: string;
  alt: string;
  /** Which way the wipe travels. Default: top-down */
  direction?: RevealDirection;
  /** Outer frame. Give it a size: an aspect ratio (aspect-4/3) or a height, plus borders etc. */
  className?: string;
  /** The <Image> itself, e.g. object-contain. In glitch mode it styles GlitchImage's wrapper instead. */
  imageClassName?: string;
  /** Seconds. Default 1.1 */
  duration?: number;
  /** Seconds before the wipe starts. Default 0 */
  delay?: number;
  ease?: Ease;
  /** 'inView' waits until the frame scrolls into view; 'mount' plays straight away. Default inView */
  trigger?: 'inView' | 'mount';
  /** Play once, or wipe back out when it leaves the viewport. Default true */
  once?: boolean;
  /** How much of the frame must be visible before it plays (0–1). Default 0.3 */
  amount?: number;
  sizes?: string;
  priority?: boolean;
  /** Skip Next's image optimizer (plain image only; GlitchImage handles its own). Default true */
  unoptimized?: boolean;

  /* ── Glitch ── */
  /** Render with GlitchImage. Inside a GlitchScope it also reacts to that scope's triggers. Default false */
  glitch?: boolean;
  /** Fire a burst the moment the wipe lands (and on every src swap). Default true when glitch is on */
  glitchOnReveal?: boolean;
  /** Fire a burst when the pointer enters the frame. Default false */
  glitchOnHover?: boolean;
  /** Give this image its own scope, so its bursts don't spread to the rest of the section. Default false */
  isolateGlitch?: boolean;
  /** Passed to GlitchImage: frames per burst and ms per frame. Defaults 6 / 60 */
  glitchFrames?: number;
  glitchFrameMs?: number;

  /** Overlays (captions, gradients) that should reveal together with the image */
  children?: ReactNode;
};

/**
 * An image that wipes in from any side, optionally as a GlitchImage.
 *
 * The wipe waits until the image has actually loaded and decoded, so it never
 * reveals an empty frame. Change `src` and the old image stays fully visible
 * until the new one is ready; then the new one wipes in over it while the old
 * one dims underneath, and the old one is removed once the wipe lands.
 */
export function RevealImage(props: RevealImageProps) {
  // Already inside a GlitchScope? useGlitchTrigger returns {} when there isn't one.
  const inScope = useGlitchTrigger().onMouseEnter !== undefined;

  // GlitchImage only reacts to a scope, so bring one along when there's none (or when asked to isolate)
  if (props.glitch && (!inScope || props.isolateGlitch)) {
    return (
      <GlitchScope>
        <RevealImageInner {...props} />
      </GlitchScope>
    );
  }
  return <RevealImageInner {...props} />;
}

function RevealImageInner({
  src,
  alt,
  direction = 'top-down',
  className,
  imageClassName,
  duration = 1.1,
  delay = 0,
  ease = defaultEase,
  trigger = 'inView',
  once = true,
  amount = 0.3,
  sizes = '100vw',
  priority = false,
  unoptimized = true,
  glitch = false,
  glitchOnReveal = true,
  glitchOnHover = false,
  glitchFrames,
  glitchFrameMs,
  children,
}: RevealImageProps) {
  // The clip sits on the inner layers, never on the element being watched:
  // a box clipped to nothing reads as off-screen to an observer and would never reveal.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });
  const reduceMotion = useReducedMotion();
  const active = trigger === 'mount' || inView;

  // The image sits inside a layer clipped to nothing until it has loaded. Browsers treat
  // a lazy image in there as invisible and never start it, so the wipe would wait forever
  // (until a click or re-render happened to nudge it). Instead, the unclipped frame is
  // watched, and the image is added and loaded eagerly once the frame comes near the screen.
  const near = useInView(ref, { once: true, margin: PRELOAD_MARGIN });
  const load = priority || trigger === 'mount' || near;

  // Fires a burst on every GlitchImage in the surrounding scope
  const fireGlitch = useGlitchTrigger().onMouseEnter;

  // One layer per src: the current image, plus the incoming one during a swap.
  // A new src is added during render (React's "adjust state when a prop changes" pattern).
  const [layers, setLayers] = useState<string[]>([src]);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const top = layers[layers.length - 1];
  if (top !== src) {
    setLayers([...layers.slice(-1), src]); // keep at most the visible image + the new one
  }

  // Reduced motion: a plain fade instead of a moving wipe (GlitchImage already skips its bursts)
  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0, transition: { duration: 0.3 } },
        show: { opacity: 1, transition: { duration: 0.4, delay } },
        dim: { opacity: 1 },
      }
    : {
        hidden: { clipPath: hiddenClip[direction], filter: 'brightness(1)', transition: { duration: duration * 0.7, ease } },
        show: { clipPath: shownClip, filter: 'brightness(1)', transition: { duration, delay, ease } },
        // The outgoing image stays put and dims while the new one wipes over it
        dim: { clipPath: shownClip, filter: 'brightness(0.4)', transition: { duration, ease } },
      };

  return (
    <div
      ref={ref}
      onMouseEnter={glitch && glitchOnHover ? fireGlitch : undefined}
      className={cn('relative overflow-hidden', className)}
    >
      {layers.map((layerSrc, i) => {
        const isTop = i === layers.length - 1;
        // Older layers dim only once the image on top is ready and starting its wipe
        const covered = !isTop && readySrc === top && active;

        return (
          <RevealLayer
            key={layerSrc}
            load={load}
            variants={variants}
            state={covered ? 'dim' : isTop && active && readySrc === layerSrc ? 'show' : isTop ? 'hidden' : 'show'}
            onReady={() => setReadySrc((current) => (isTop ? layerSrc : current))}
            onShown={() => {
              if (!isTop) return;
              // The new image has landed: drop everything underneath it
              setLayers((current) => (current[current.length - 1] === layerSrc ? [layerSrc] : current));
              if (glitch && glitchOnReveal) fireGlitch?.();
            }}
          >
            {glitch ? (
              <GlitchImage
                src={layerSrc}
                alt={alt}
                sizes={sizes}
                priority={priority}
                className={imageClassName}
                frames={glitchFrames}
                frameMs={glitchFrameMs}
                loading={priority ? undefined : 'eager'}
                // The wipe is the reveal here, so the image shouldn't also fade in underneath it
                fadeIn={false}
              />
            ) : (
              <Image
                src={layerSrc}
                alt={alt}
                fill
                unoptimized={unoptimized}
                sizes={sizes}
                priority={priority}
                loading={priority ? undefined : 'eager'}
                className={cn('object-cover', imageClassName)}
              />
            )}
            {children}
          </RevealLayer>
        );
      })}
    </div>
  );
}

/**
 * One image layer. Once `load` is on it renders its image, then reports `onReady`
 * when the <img> inside has loaded and decoded (or failed, or timed out). This works
 * the same for a plain Image and for GlitchImage, since it listens to whatever <img>
 * ends up inside.
 */
function RevealLayer({
  load,
  variants,
  state,
  onReady,
  onShown,
  children,
}: {
  load: boolean;
  variants: Variants;
  state: 'hidden' | 'show' | 'dim';
  onReady: () => void;
  onShown: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !load) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onReadyRef.current();
    };
    // Wait for decoding too, so the first painted frame of the wipe already has the picture
    const decodeThenFinish = (img: HTMLImageElement) => {
      img.decode().catch(() => undefined).then(finish);
    };

    // Already loaded (cached, or loaded before this effect ran)
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
  }, [load]);

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={state}
      onAnimationComplete={(definition) => {
        if (definition === 'show') onShown();
      }}
      className="absolute inset-0 will-change-[clip-path]"
    >
      {load && children}
    </motion.div>
  );
}

export default RevealImage;