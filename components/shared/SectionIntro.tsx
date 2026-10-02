'use client';

import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Divider } from './Divider'; // adjust path

/* Blinks on like a bad signal */
export const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.5, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
};

/* Mostly left to right, with a little scatter so it doesn't feel mechanical (same on server and client) */
export const wordDelay = (i: number) => 0.2 + i * 0.03 + ((i * 37) % 5) * 0.04;

type SectionIntroProps = {
  title: string;
  /** Large grey paragraph under the title. Leave out for a heading-only section. */
  text?: string;
  /** Small extra next to the title, e.g. a count */
  aside?: ReactNode;
  className?: string;
};

/**
 * The saga-intro header: a rule, a title, and a big grey paragraph whose words
 * flicker in one by one when it is scrolled into view.
 */
export function SectionIntro({ title, text, aside, className = '' }: SectionIntroProps) {
  const words = text?.split(' ') ?? [];

  return (
    <div className={className}>
      <Divider />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mt-4 max-w-[70%] text-[clamp(1.125rem,1.6vw,1.75rem)] leading-[1.1] tracking-wide max-lg:max-w-none"
      >
        <motion.h2 variants={flicker} custom={0} className="flex items-center gap-3 text-white">
          {title}
          {aside && <span className="text-white/40">{aside}</span>}
        </motion.h2>

        {text && (
          <p className="text-white/40">
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
              {words.map((word, i) => (
                <motion.span key={i} variants={flicker} custom={wordDelay(i)} className="inline-block whitespace-pre">
                  {word}
                  {i < words.length - 1 && ' '}
                </motion.span>
              ))}
            </span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
