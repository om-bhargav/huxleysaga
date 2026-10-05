'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { GlitchImage, GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path

export type RevealDirection = 'top-down' | 'bottom-up' | 'left-right' | 'right-left';

type Ease = [number, number, number, number];

const defaultEase: Ease = [0.76, 0, 0.24, 1];

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
 * Change `src` and the new image wipes in over the old one, which dims underneath
 * and is removed once the wipe finishes (AnimatePresence keyed by src).
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
  // The clip sits on the inner layer, never on the element being watched:
  // a box clipped to nothing reads as off-screen to an observer and would never reveal.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });
  const reduceMotion = useReducedMotion();
  const active = trigger === 'mount' || inView;

  // Fires a burst on every GlitchImage in the surrounding scope
  const fireGlitch = useGlitchTrigger().onMouseEnter;

  // Reduced motion: a plain fade instead of a moving wipe (GlitchImage already skips its bursts)
  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0, zIndex: 1, transition: { duration: 0.3 } },
        show: { opacity: 1, zIndex: 1, transition: { duration: 0.4, delay } },
        exit: { opacity: 0, zIndex: 0, transition: { duration: 0.4 } },
      }
    : {
        hidden: { clipPath: hiddenClip[direction], zIndex: 1, transition: { duration: duration * 0.7, ease } },
        show: { clipPath: shownClip, zIndex: 1, transition: { duration, delay, ease } },
        // The outgoing image stays put and dims while the new one wipes over it
        exit: { zIndex: 0, filter: 'brightness(0.4)', transition: { duration: duration + delay, ease } },
      };

  return (
    <div
      ref={ref}
      onMouseEnter={glitch && glitchOnHover ? fireGlitch : undefined}
      className={cn('relative overflow-hidden', className)}
    >
      <AnimatePresence>
        <motion.div
          key={src}
          variants={variants}
          initial="hidden"
          animate={active ? 'show' : 'hidden'}
          exit="exit"
          onAnimationComplete={(definition) => {
            if (glitch && glitchOnReveal && definition === 'show') fireGlitch?.();
          }}
          className="absolute inset-0 will-change-[clip-path]"
        >
          {glitch ? (
            <GlitchImage
              src={src}
              alt={alt}
              sizes={sizes}
              priority={priority}
              className={imageClassName}
              frames={glitchFrames}
              frameMs={glitchFrameMs}
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized={unoptimized}
              sizes={sizes}
              priority={priority}
              className={cn('object-cover', imageClassName)}
            />
          )}
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default RevealImage;