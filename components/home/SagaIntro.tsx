'use client';

import { motion, type Variants } from 'framer-motion';
import { Divider } from '@/components/shared/Divider'; // adjust path

type SagaIntroProps = {
  title?: string;
  text?: string;
};

/* Blinks on like a bad signal */
const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.5, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
};

/* Mostly left to right, with a little scatter so it doesn't feel mechanical (same on server and client) */
const wordDelay = (i: number) => 0.2 + i * 0.03 + ((i * 37) % 5) * 0.04;

/** Title + large grey paragraph. The words flicker in when scrolled into view. */
export default function SagaIntro({
  title = 'The Huxley® Saga',
  /* Placeholder copy: swap in your real text */
  text = "An original sci-fi universe from concept artist Ben Mauro. It began with the graphic novel 'Huxley' and carries on through a growing series of prequel novels.",
}: SagaIntroProps) {
  const words = text.split(' ');

  return (
    <section className="bg-black px-3 pb-24 pt-20 font-heading uppercase">
      <Divider />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mt-4 max-w-[70%] text-[clamp(1.125rem,1.6vw,1.75rem)] leading-[1.1] tracking-wide max-lg:max-w-none"
      >
        <motion.h2 variants={flicker} custom={0} className="text-white">
          {title}
        </motion.h2>

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
      </motion.div>
    </section>
  );
}