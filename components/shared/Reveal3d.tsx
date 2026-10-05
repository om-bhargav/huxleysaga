'use client';

import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

type Ease = [number, number, number, number];

const defaultEase: Ease = [0.22, 1, 0.36, 1];

/* Swap for your own cn() (clsx + tailwind-merge) if you have one */
const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

export type Reveal3DProps = {
  /** Plain text to split. Required for split 'words' or 'chars'. */
  text?: string;
  /** Anything (a button, an icon) for split 'none': the whole block flips in as one piece. */
  children?: ReactNode;
  /** 'words' (default), 'chars', or 'none' to reveal children as a single block */
  split?: 'words' | 'chars' | 'none';
  /** Element to render. Default 'div' */
  as?: ElementType;
  className?: string;
  /** Seconds before the first piece starts. Default 0 */
  delay?: number;
  /** Seconds between pieces. Default 0.035 for words, 0.018 for chars */
  stagger?: number;
  /** Seconds per piece. Default 0.8 */
  duration?: number;
  ease?: Ease;
  /** Hinge line each piece flips on. Default bottom */
  origin?: 'top' | 'center' | 'bottom';
  /** Start tilt in degrees. Negative tips the top towards the viewer. Default -80 */
  tilt?: number;
  /** CSS perspective in px; smaller = more dramatic depth. Default 700 */
  perspective?: number;
  /** Drive it from outside (e.g. a parent's useInView). When set, trigger/once/amount are ignored. */
  active?: boolean;
  /** 'inView' waits until it scrolls into view; 'mount' plays straight away. Default inView */
  trigger?: 'inView' | 'mount';
  /** Play once, or fold away again when it leaves the viewport. Default true */
  once?: boolean;
  /** How much must be visible before it plays (0–1). Default 0.5 */
  amount?: number;
};

const originY = { top: '0%', center: '50%', bottom: '100%' } as const;

/**
 * Reveals text by scale and 3D rotation only, never opacity.
 *
 * Each word (or letter) starts squashed flat (scaleY 0) and tipped back on its hinge
 * (rotateX) inside a perspective, so it is invisible without being transparent.
 * It then unfolds upright and to full size.
 */
export function Reveal3D({
  text,
  children,
  split = 'words',
  as: Tag = 'div',
  className,
  delay = 0,
  stagger,
  duration = 0.8,
  ease = defaultEase,
  origin = 'bottom',
  tilt = -80,
  perspective = 700,
  active,
  trigger = 'inView',
  once = true,
  amount = 0.5,
}: Reveal3DProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, amount });
  const reduceMotion = useReducedMotion();
  const go = active ?? (trigger === 'mount' || inView);
  const step = stagger ?? (split === 'chars' ? 0.018 : 0.035);

  const piece: Variants = {
    hidden: {
      rotateX: tilt,
      scaleY: 0,
      scaleX: 0.9,
      z: -60,
      transition: { duration: duration * 0.5, ease },
    },
    show: (i: number) => ({
      rotateX: 0,
      scaleY: 1,
      scaleX: 1,
      z: 0,
      transition: { duration, ease, delay: delay + i * step },
    }),
  };

  // Every piece shares these: its own 3D space, hinge line, and no flicker from the back face
  const pieceStyle: CSSProperties = {
    transformOrigin: `50% ${originY[origin]}`,
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
  };

  // Reduced motion: just the content, no transforms
  if (reduceMotion) {
    return (
      <Tag className={className}>
        {split === 'none' ? children : text}
      </Tag>
    );
  }

  const state = go ? 'show' : 'hidden';

  // Whole block as one piece
  if (split === 'none') {
    return (
      <Tag ref={ref} className={className} style={{ perspective }}>
        <motion.div
          variants={piece}
          custom={0}
          initial="hidden"
          animate={state}
          style={pieceStyle}
          className="will-change-transform"
        >
          {children}
        </motion.div>
      </Tag>
    );
  }

  const words = (text ?? '').split(/(\s+)/);
  let index = 0;

  return (
    <Tag ref={ref} className={className} style={{ perspective }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => {
          // Keep the spaces as real text so lines still wrap naturally
          if (/^\s+$/.test(word)) return word;

          if (split === 'words') {
            return (
              <motion.span
                key={w}
                variants={piece}
                custom={index++}
                initial="hidden"
                animate={state}
                style={pieceStyle}
                className="inline-block will-change-transform"
              >
                {word}
              </motion.span>
            );
          }

          // Letters, grouped per word so a word never breaks mid-way
          return (
            <span key={w} className="inline-block whitespace-nowrap" style={{ perspective }}>
              {[...word].map((char, c) => (
                <motion.span
                  key={c}
                  variants={piece}
                  custom={index++}
                  initial="hidden"
                  animate={state}
                  style={pieceStyle}
                  className="inline-block will-change-transform"
                >
                  {char}
                </motion.span>
              ))}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}

export default Reveal3D;