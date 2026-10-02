'use client';

import { motion } from 'framer-motion';
import { GlitchImage, GlitchScope } from '@/components/shared/GlitchImage'; // adjust path
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* The live page lists these two facts and nothing else */
const facts: { label: string; value: string }[] = [
  { label: 'Created by', value: 'Ben Mauro' },
  { label: 'Creation date', value: '2014' },
];

/** History: who made it, when it started, and a way to get in touch. */
export default function AboutHistory() {
  return (
    <GlitchScope>
      <section className="bg-black px-3 pb-10 pt-20 font-heading uppercase">
        <SectionIntro
          title="History"
          /* Placeholder copy: swap in your real text */
          text="Huxley began as a single robot drawing in 2014 and has been built in public ever since, one book, trailer and edition at a time."
        />

        <div className="mt-12 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Credits */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="flex flex-col justify-between border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6"
          >
            <motion.dl variants={flicker} custom={0} className="grid gap-6 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-t border-white/10 pt-3">
                  <dt className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">{fact.label}</dt>
                  <dd className="mt-2 text-[clamp(1.25rem,2.4vw,2rem)] leading-none">{fact.value}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={flicker} custom={0.2} className="mt-12 -ml-1">
              <BracketButton label="Contact" href="/contact" />
            </motion.div>
          </motion.div>

          {/* Portrait. The clip sits on the inner layer, never on the element being watched:
              a box clipped to nothing reads as off-screen to an observer and would never reveal. */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative aspect-4/3 overflow-hidden border border-white/10"
          >
            <motion.div
              variants={{
                hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
                show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.1, ease } },
              }}
              className="absolute inset-0"
            >
              <GlitchImage
                src="https://picsum.photos/seed/huxley-ben-mauro/1200/900"
                alt="Ben Mauro"
                sizes="(min-width: 1024px) 48vw, 94vw"
              />
              <span className="absolute bottom-3 left-3 border border-white/20 bg-black/70 px-2 py-1 text-[10px] tracking-widest text-white backdrop-blur-sm sm:text-[11px]">
                Ben Mauro
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </GlitchScope>
  );
}
