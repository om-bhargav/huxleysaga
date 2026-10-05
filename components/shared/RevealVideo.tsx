'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import type { RevealDirection } from '@/components/shared/RevealImage'; // adjust path

type Ease = [number, number, number, number];

const defaultEase: Ease = [0.76, 0, 0.24, 1];

/* Start state for each direction: fully inset on the side the wipe travels towards (same as RevealImage) */
const hiddenClip: Record<RevealDirection, string> = {
  'top-down': 'inset(0% 0% 100% 0%)',
  'bottom-up': 'inset(100% 0% 0% 0%)',
  'left-right': 'inset(0% 100% 0% 0%)',
  'right-left': 'inset(0% 0% 0% 100%)',
};
const shownClip = 'inset(0% 0% 0% 0%)';

/* Swap for your own cn() (clsx + tailwind-merge) if you have one */
const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export type VideoSource = { src: string; type?: string };

export type RevealVideoProps = {
  /** One URL, or several formats in order of preference (e.g. webm first, then mp4) */
  src: string | VideoSource[];
  /** Still shown before the first frame loads, and instead of playback when motion is reduced */
  poster?: string;
  /** Which way the wipe travels. Default: top-down */
  direction?: RevealDirection;
  /** Outer frame. Give it a size: an aspect ratio (aspect-video) or a height, plus borders etc. */
  className?: string;
  /** The <video> itself, e.g. object-contain or object-[50%_20%] */
  videoClassName?: string;
  /** Seconds. Default 1.1 */
  duration?: number;
  /** Seconds before the wipe starts. Default 0 */
  delay?: number;
  ease?: Ease;
  /** 'inView' waits until the frame scrolls into view; 'mount' plays straight away. Default inView */
  trigger?: 'inView' | 'mount';
  /** Reveal once, or wipe back out when it leaves the viewport. Default true */
  once?: boolean;
  /** How much of the frame must be visible before it reveals (0–1). Default 0.3 */
  amount?: number;

  /* ── Playback ── */
  /** Start playing as the wipe begins. Needs muted to work in browsers. Default true */
  autoPlay?: boolean;
  /** Default true. Browsers block autoplay with sound. */
  muted?: boolean;
  /** Default true */
  loop?: boolean;
  /** Show native controls. Default false */
  controls?: boolean;
  /** Pause while scrolled off screen to save battery, resume on return. Default true */
  pauseOffscreen?: boolean;
  /** Load the file eagerly; use for a hero above the fold. Default false */
  priority?: boolean;
  /** Describe the video for screen readers. Leave empty for purely decorative backgrounds. */
  label?: string;

  /** Overlays (captions, gradients) that should reveal together with the video */
  children?: ReactNode;
};

/**
 * A video that wipes in from any side, the same way RevealImage does.
 *
 * Change `src` and the new video wipes in over the old one, which dims underneath
 * and is removed once the wipe finishes (AnimatePresence keyed by src).
 *
 * The clip sits on the inner layer, never on the element being watched:
 * a box clipped to nothing reads as off-screen to an observer and would never reveal.
 */
export function RevealVideo({
  src,
  poster,
  direction = 'top-down',
  className,
  videoClassName,
  duration = 1.1,
  delay = 0,
  ease = defaultEase,
  trigger = 'inView',
  once = true,
  amount = 0.3,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  pauseOffscreen = true,
  priority = false,
  label,
  children,
}: RevealVideoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });
  // Separate, never "once": tracks whether any of it is on screen right now, for pausing
  const onScreen = useInView(ref, { amount: 0 });
  const reduceMotion = useReducedMotion();
  const active = trigger === 'mount' || inView;

  // Reduced motion: no moving wipe and no autoplay, just the poster fading in
  const shouldPlay = autoPlay && !reduceMotion && active && (!pauseOffscreen || onScreen);

  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0, zIndex: 1, transition: { duration: 0.3 } },
        show: { opacity: 1, zIndex: 1, transition: { duration: 0.4, delay } },
        exit: { opacity: 0, zIndex: 0, transition: { duration: 0.4 } },
      }
    : {
        hidden: { clipPath: hiddenClip[direction], zIndex: 1, transition: { duration: duration * 0.7, ease } },
        show: { clipPath: shownClip, zIndex: 1, transition: { duration, delay, ease } },
        // The outgoing video stays put and dims while the new one wipes over it
        exit: { zIndex: 0, filter: 'brightness(0.4)', transition: { duration: duration + delay, ease } },
      };

  const key = typeof src === 'string' ? src : src.map((s) => s.src).join('|');

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <AnimatePresence>
        <motion.div
          key={key}
          variants={variants}
          initial="hidden"
          animate={active ? 'show' : 'hidden'}
          exit="exit"
          className="absolute inset-0 will-change-[clip-path]"
        >
          <VideoLayer
            src={src}
            poster={poster}
            className={videoClassName}
            playing={shouldPlay}
            muted={muted}
            loop={loop}
            controls={controls}
            priority={priority}
            label={label}
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VideoLayer({
  src,
  poster,
  className,
  playing,
  muted,
  loop,
  controls,
  priority,
  label,
}: {
  src: string | VideoSource[];
  poster?: string;
  className?: string;
  playing: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  priority: boolean;
  label?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // React doesn't always write `muted` to the DOM (notably after SSR), and browsers then refuse autoplay.
  // Setting the property directly before play() fixes that.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;

    if (playing) {
      // play() rejects when the browser blocks it (low-power mode, data saver): the poster stays up instead
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, muted]);

  return (
    <video
      ref={videoRef}
      src={typeof src === 'string' ? src : undefined}
      poster={poster}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline
      preload={priority ? 'auto' : 'metadata'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      tabIndex={controls ? undefined : -1}
      className={cn('absolute inset-0 size-full object-cover', className)}
    >
      {typeof src !== 'string' && src.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
    </video>
  );
}

export default RevealVideo;