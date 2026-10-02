'use client';

import { motion } from 'framer-motion';
import { GlitchImage, GlitchScope } from '@/components/shared/GlitchImage'; // adjust path
import { flicker } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* Placeholder art: swap in huxley-about-1 / huxley-about-2 */
const banner = 'https://picsum.photos/seed/huxley-about-1/1920/1080';
const secondary = 'https://picsum.photos/seed/huxley-about-2/1920/1080';

/** Two opening plates, the way the live page opens: banner, then a second still under it. */
export default function AboutHero() {
  return (
    <section className="bg-black pb-10 font-heading uppercase">
      {/* Banner */}
      <GlitchScope>
        <div className="relative aspect-16/9 overflow-hidden border border-white/10 max-lg:aspect-4/3">
          <GlitchImage src={banner} alt="" priority />
          <div aria-hidden="true" className="absolute inset-0 bg-black/40" />

          <motion.div
            initial="hidden"
            animate="show"
            className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-8"
          >
            <motion.span
              variants={flicker}
              custom={0}
              aria-hidden="true"
              className="block size-1 bg-white"
            />
            <motion.h1
              variants={flicker}
              custom={0.1}
              className="mt-3 text-[clamp(2.5rem,7vw,7rem)] leading-none tracking-wide"
            >
              About
            </motion.h1>
            <motion.p
              variants={flicker}
              custom={0.25}
              className="mt-3 max-w-[48ch] text-[10px] leading-relaxed tracking-widest text-white/70 sm:text-[11px]"
            >
              {/* Placeholder copy: swap in your real text */}
              An original sci-fi universe created by Ben Mauro, built in the open since 2014.
            </motion.p>
          </motion.div>
        </div>
      </GlitchScope>
    </section>
  );
}
