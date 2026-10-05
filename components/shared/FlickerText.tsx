'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion';

/* Blinks on like a bad signal. `custom` is the delay in seconds. */
export const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.6, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
};

/* Same timing without the flashing, for visitors who ask for less motion */
const fade: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({ opacity: 1, transition: { duration: 0.4, delay } }),
};

type Tag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'li' | 'ul' | 'section';

type FlickerProps = Omit<
  HTMLMotionProps<'div'>,
  'variants' | 'custom' | 'initial' | 'animate' | 'whileInView' | 'viewport' | 'children'
> & {
  children?: ReactNode;
  /** Element to render. Default 'div' */
  as?: Tag;
  /** Seconds before it flickers on. Default 0 */
  delay?: number;
  /**
   * Drive it from outside, e.g. a shared useInView for a whole column.
   * true plays it, false hides it again. When set, `trigger` is ignored.
   */
  active?: boolean;
  /**
   * 'inView' (default): plays when scrolled into view.
   * 'mount': plays straight away.
   * 'parent': follows a parent's initial/animate, e.g. one trigger for a whole text block.
   */
  trigger?: 'inView' | 'mount' | 'parent';
  /** inView only: play once, or every time it comes back into view. Default true */
  once?: boolean;
  /** inView only: how much must be visible before it plays (0–1). Default 0.5 */
  amount?: number;
};

/** Anything that should blink on like a bad signal. */
export function Flicker({
  children,
  as = 'div',
  delay = 0,
  active,
  trigger = 'inView',
  once = true,
  amount = 0.5,
  ...rest
}: FlickerProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  const playback =
    active !== undefined
      ? { initial: 'hidden', animate: active ? 'show' : 'hidden' }
      : trigger === 'parent'
        ? {}
        : trigger === 'mount'
          ? { initial: 'hidden', animate: 'show' }
          : { initial: 'hidden', whileInView: 'show', viewport: { once, amount } };

  return (
    <Component variants={reduceMotion ? fade : flicker} custom={delay} {...playback} {...rest}>
      {children}
    </Component>
  );
}

/** One trigger for several Flickers inside it (use trigger="parent" on the children). */
export function FlickerGroup({
  children,
  as = 'div',
  active,
  trigger = 'inView',
  once = true,
  amount = 0.5,
  ...rest
}: Omit<FlickerProps, 'delay' | 'trigger'> & { trigger?: 'inView' | 'mount' }) {
  const Component = motion[as] as typeof motion.div;
  const playback =
    active !== undefined
      ? { initial: 'hidden', animate: active ? 'show' : 'hidden' }
      : trigger === 'mount'
        ? { initial: 'hidden', animate: 'show' }
        : { initial: 'hidden', whileInView: 'show', viewport: { once, amount } };

  return (
    <Component {...playback} {...rest}>
      {children}
    </Component>
  );
}

export default Flicker;