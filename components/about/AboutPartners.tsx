'use client';

import { motion } from 'framer-motion';
import { Marquee } from '@/components/shared/Marquee'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* TODO: drop in each partner's real URL */
const partners: { name: string; href: string }[] = [
  { name: 'ROM', href: '#' },
  { name: 'Thames & Hudson', href: '#' },
  { name: 'Unit Image', href: '#' },
  { name: 'Studio Freight', href: '#' },
];

/** The partner row, running past on a loop the way the live page repeats it. */
export default function AboutPartners() {
  return (
    <section className="overflow-hidden bg-black px-3 pb-10 pt-20 font-heading uppercase">
      <SectionIntro title="Partners" aside={`[${String(partners.length).padStart(2, '0')}]`} />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease }}
        className="mt-12"
      >
        <Marquee className="-mx-3" speed={30}>
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-28 w-[min(70vw,320px)] shrink-0 items-center justify-center border border-white/10 bg-neutral-950 px-6 text-center text-[clamp(1rem,1.6vw,1.5rem)] tracking-wide text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {partner.name}
            </a>
          ))}
        </Marquee>
      </motion.div>
    </section>
  );
}
