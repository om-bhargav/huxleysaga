'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { displayFont } from '@/fonts/universes'; // adjust path
import { studioStats, universes } from '@/config/universes'; // adjust path

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
    <div className="relative z-10 grid gap-5 bg-background">
      <section className="bg-black px-3 pb-10 pt-20 font-heading uppercase">
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
      <section className="bg-black px-3 pb-24 font-heading uppercase">
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-3 lg:grid-cols-2"
        >
          {universes.map((universe) => (
            <motion.li key={universe.slug} variants={rise}>
              <Link
                href={`/${universe.slug}`}
                className="group/world relative flex h-full flex-col overflow-hidden border focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={{
                  backgroundColor: universe.palette.ink,
                  color: universe.palette.paper,
                  borderColor: `color-mix(in srgb, ${universe.palette.paper} 20%, transparent)`,
                }}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={universe.hero.poster}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 48vw, 94vw"
                    className="object-cover transition-transform duration-700 group-hover/world:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${universe.palette.ink}, transparent 65%)` }}
                  />
                  <span
                    className="absolute left-3 top-3 border px-2 py-1 text-[10px] tracking-widest sm:text-[11px]"
                    style={{ borderColor: universe.palette.accent, color: universe.palette.accent }}
                  >
                    {universe.genre}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3.5 lg:p-6">
                  {universe.overline && (
                    <span className="text-[10px] tracking-widest opacity-60 sm:text-[11px]">{universe.overline}</span>
                  )}

                  <span
                    style={{ fontFamily: displayFont[universe.display] }}
                    className="mt-2 text-[clamp(1.75rem,3.6vw,3rem)] leading-none"
                  >
                    {universe.name}
                  </span>

                  <span className="mt-4 flex-1 text-xs leading-relaxed tracking-wider opacity-70 sm:text-sm">
                    {universe.hook}
                  </span>

                  <span
                    className="mt-8 inline-flex items-center gap-3 text-[11px] tracking-widest sm:text-[13px]"
                    style={{ color: universe.palette.accent }}
                  >
                    <span aria-hidden="true">[</span>
                    Explore universe
                    <span aria-hidden="true">]</span>
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </div>
  );
}
