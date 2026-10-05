'use client';

import { motion, type Variants } from 'framer-motion';
import { Divider } from '@/components/shared/Divider';
import { RollingNumber } from '@/components/shared/RollingNumber';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Stat = {
  value: number;
  suffix?: string;
  label: string;
  description: string;
};

/* Placeholder descriptions: swap in your real copy */
const stats: Stat[] = [
  {
    value: 12,
    suffix: '+',
    label: 'Years',
    description: 'First sketched around 2014, in full development since 2015, and still growing with new chapters like The Oracle.',
  },
  {
    value: 40,
    suffix: 'M+',
    label: 'Views',
    description: 'Trailer views from around the world across the official YouTube channel and social accounts.',
  },
  {
    value: 210,
    suffix: 'K',
    label: 'Subscribers',
    description: 'People subscribed to the official YouTube channel today, and the number keeps rising.',
  },
  {
    value: 500,
    suffix: 'K+',
    label: 'Followers',
    description: 'A combined worldwide following for the creator, from behind-the-scenes process to new lore drops.',
  },
];

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/* Short bright ticks on the four corners of a card */
function CornerTicks() {
  const tick = 'absolute h-px w-1.5 bg-foreground/40';
  return (
    <span aria-hidden="true" className="pointer-events-none">
      <span className={`${tick} -left-px -top-px`} />
      <span className={`${tick} -right-px -top-px`} />
      <span className={`${tick} -bottom-px -left-px`} />
      <span className={`${tick} -bottom-px -right-px`} />
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="px-3 pb-14 pt-5 font-heading uppercase text-white">
      <Divider />

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="mt-3 text-center text-3xl tracking-wide lg:text-4xl"
      >
        Stats
      </motion.h2>

      <motion.ul
        variants={grid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, i) => (
          <motion.li
            key={stat.label}
            variants={card}
            className="relative flex min-h-[250px] flex-col border border-white/10 p-3"
          >
            <CornerTicks />

            {/* Grey box hugging the number */}
            <span className="self-start bg-foreground/5 px-1.5 text-[clamp(2.75rem,4.5vw,5rem)] font-light">
              <RollingNumber value={stat.value} suffix={stat.suffix} delay={i * 150} />
            </span>

            <h3 className="mt-auto pt-12 text-lg tracking-wide lg:text-xl">{stat.label}</h3>
            <p className="mt-2 text-[10px] leading-relaxed tracking-wider text-white/50 sm:text-xs">
              {stat.description}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}