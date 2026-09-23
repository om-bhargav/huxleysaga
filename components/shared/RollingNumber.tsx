'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

type RollingNumberProps = {
  /** Number to count up to, e.g. 40 */
  value: number;
  /** Text after the number, e.g. "M+" */
  suffix?: string;
  /** Total count-up time in ms */
  duration?: number;
  /** How many times the number changes on the way up */
  steps?: number;
  /** Wait this long (ms) after coming into view before starting */
  delay?: number;
  className?: string;
};

type SlotProps = { char: string; sizer: string; odd: boolean };

/**
 * One character position. Every change gets a brand-new key, so AnimatePresence
 * never confuses a returning character (like a "0") with one that's still leaving.
 */
function Slot({ char, sizer, odd }: SlotProps) {
  const [shown, setShown] = useState({ char, id: 0 });
  if (shown.char !== char) setShown({ char, id: shown.id + 1 });

  return (
    <span aria-hidden="true" className="relative inline-block overflow-hidden">
      {/* Final character, invisible, keeps the slot's width fixed */}
      <span className="invisible">{sizer}</span>

      <AnimatePresence initial={false}>
        <motion.span
          key={shown.id}
          initial={{ y: odd ? '100%' : '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: odd ? '-100%' : '100%' }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="absolute inset-0 text-center"
        >
          {shown.char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Counts up to `value` when scrolled into view, starting from all zeros ("000" → "210").
 * Each character rolls when it changes:
 * odd slots push the old character up and bring the new one in from below,
 * even slots push the old character down and bring the new one in from above.
 */
export function RollingNumber({
  value,
  suffix = '',
  duration = 1800,
  steps = 12,
  delay = 0,
  className = '',
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setCurrent(value);
      return;
    }

    let step = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        step += 1;
        const t = step / steps;
        const eased = 1 - Math.pow(1 - t, 3); // fast at first, slows near the end
        setCurrent(Math.round(value * eased));
        if (step >= steps) window.clearInterval(interval);
      }, duration / steps);
    }, delay);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [inView, reduceMotion, value, duration, steps, delay]);

  const target = `${value}${suffix}`;
  // Zero-padded so every slot is always filled and the number never changes width
  const shown = String(current).padStart(String(value).length, '0') + suffix;

  return (
    <span ref={ref} className={`inline-flex leading-[1.15] ${className}`}>
      <span className="sr-only">{target}</span>

      {shown.split('').map((char, i) => (
        <Slot key={i} char={char} sizer={target[i]} odd={(i + 1) % 2 === 1} />
      ))}
    </span>
  );
}