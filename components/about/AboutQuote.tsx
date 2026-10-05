'use client';

import { motion } from 'framer-motion';
import { Divider } from '@/components/shared/Divider'; // adjust path
import { flicker, wordDelay } from '@/components/shared/SectionIntro'; // adjust path

/* Placeholder copy: swap in the real pull-quote */
const quote =
  'Huxley is one of those rare worlds that feels lived in from the first page.';
const author = 'Nikita Buyanov';
const role = 'Director of Escape from Tarkov';

/** A single pull-quote, set large, flickering in word by word. */
export default function AboutQuote() {
  const words = quote.split(' ');

  return (
    <section className="px-3  font-heading uppercase">
      <Divider />

      <motion.figure
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-4"
      >
        <blockquote className="max-w-[24ch] text-[clamp(1.5rem,3.6vw,3.25rem)] leading-[1.05] tracking-wide text-white max-lg:max-w-none">
          <span className="sr-only">{quote}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <motion.span key={i} variants={flicker} custom={wordDelay(i)} className="inline-block whitespace-pre">
                {word}
                {i < words.length - 1 && ' '}
              </motion.span>
            ))}
          </span>
        </blockquote>

        <motion.figcaption
          variants={flicker}
          custom={0.6}
          className="mt-8 flex flex-wrap items-center gap-3 text-[11px] tracking-widest sm:text-[13px]"
        >
          <span aria-hidden="true" className="size-1 bg-white" />
          <span className="text-white">{author}</span>
          <span aria-hidden="true" className="text-white/40">
            /
          </span>
          <span className="text-white/40">{role}</span>
        </motion.figcaption>
      </motion.figure>
    </section>
  );
}
