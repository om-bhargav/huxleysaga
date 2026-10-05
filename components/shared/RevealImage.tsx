'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

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
  /** The <Image> itself, e.g. object-contain or object-[50%_20%] */
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
  /** Overlays (captions, gradients) that should reveal together with the image */
  children?: ReactNode;
};

/**
 * An image that wipes in from any side.
 *
 * Change `src` and the new image wipes in over the old one, which dims underneath
 * and is removed once the wipe finishes (AnimatePresence keyed by src).
 *
 * The clip sits on the inner layer, never on the element being watched:
 * a box clipped to nothing reads as off-screen to an observer and would never reveal.
 */
export function RevealImage({
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
  children,
}: RevealImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });
  const reduceMotion = useReducedMotion();
  const active = trigger === 'mount' || inView;

  // Reduced motion: a plain fade instead of a moving wipe
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
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <AnimatePresence>
        <motion.div
          key={src}
          variants={variants}
          initial="hidden"
          animate={active ? 'show' : 'hidden'}
          exit="exit"
          className="absolute inset-0 will-change-[clip-path]"
        >
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes={sizes}
            priority={priority}
            className={cn('object-cover', imageClassName)}
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default RevealImage;