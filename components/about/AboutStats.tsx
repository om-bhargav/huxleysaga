'use client';

import { motion } from 'framer-motion';
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path

type Metric = { label: string; value: number; suffix?: string };

/* The live page shows these four. Placeholder values: swap in your real numbers. */
const metrics: Metric[] = [
  { label: 'Years', value: 12 },
  { label: 'Views', value: 120, suffix: 'M+' },
  { label: 'Subscribers', value: 850, suffix: 'K+' },
  { label: 'Followers', value: 40, suffix: 'M+' },
];

/** The four headline numbers, counting up as they come into view. */
export default function AboutStats() {
  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro title="By The Numbers" />

      <motion.dl
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
        className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {metrics.map((metric) => (
          <motion.div
            key={metric.label}
            variants={flicker}
            custom={0}
            className="border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6"
          >
            <dt className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">{metric.label}</dt>
            <dd className="mt-6 text-[clamp(2rem,4.5vw,4rem)] leading-none">
              <RollingNumber value={metric.value} suffix={metric.suffix} delay={200} />
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
}
