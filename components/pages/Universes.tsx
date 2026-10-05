'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { displayFont } from '@/fonts/universes'; // adjust path
import { studioStats, universes } from '@/config/universes'; // adjust path
import UniversesHero from '../universes/UniverseHero';
import UniverseCard from '../universes/UniverseCard';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/**
 * Our Universes (/universes). One card per world, each wearing its own palette and
 * display face so the overview already reads as six different places.
 */
export default function Universes() {
  return (
    <div className="relative z-10 grid gap-8 md:gap-20 bg-background">
      <UniversesHero />
      <section className="px-3 font-heading uppercase">
        <SectionIntro
          title="Our Universes"
          text="Six worlds. One studio. Each comic is its own universe, with its own characters, stories and style, made to get lost in."
          aside={`[${String(universes.length).padStart(2, '0')}]`}
        />

        {/* Studio totals, from specification section 8 */}
        <motion.dl
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
          className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {[
            { label: 'Raised', value: studioStats.raised },
            { label: 'Backer pledges', count: studioStats.pledges },
            { label: 'Issues funded', count: studioStats.issuesFunded },
            { label: 'On the way', count: studioStats.issuesComing },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={rise}
              className="border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6"
            >
              <dt className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">{stat.label}</dt>
              <dd className="mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-none">
                {stat.count !== undefined ? <RollingNumber value={stat.count} delay={200} /> : stat.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </section>

      {/* The six */}
      <section className="px-3 font-heading uppercase">
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-3 lg:grid-cols-2"
        >
          {universes.map((universe,idx) => (
            <UniverseCard direction={idx%2 === 0 ? "left-right":"right-left"} key={idx} universe={universe}/>
          ))}
        </motion.ul>
      </section>
    </div>
  );
}
