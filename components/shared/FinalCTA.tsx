'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path
import { communityLinks, socialLinks, type ExternalLink } from '@/config/links';
import { Divider } from '@/components/shared/Divider';
import { StretchText } from '@/components/shared/StrechText';
import { GATE_IMAGES } from '@/lib/assets';
import RevealImage, { RevealDirection } from './RevealImage';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Cta = { label: string; href: string };

/** URL for a label in one of the lists in config/links.ts */
const hrefOf = (list: ExternalLink[], label: string) =>
  list.find((link) => link.label === label)?.href ?? '#';

const ctas: Cta[] = [
  { label: 'Explore the Universes', href: '/universes' },
  { label: 'Join Discord', href: hrefOf(socialLinks, 'Discord') },
  { label: 'Follow Us', href: hrefOf(socialLinks, 'Instagram') },
  { label: 'Shop', href: hrefOf(communityLinks, 'Shop') },
  { label: 'View Kickstarter', href: hrefOf(communityLinks, 'Kickstarter') },
];

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.8, ease, delay },
});

export default function FinalCta({
  images = GATE_IMAGES.slice(0, 4),
}: {
  /** Four background images, shown side by side */
  images?: string[];
}) {
  return (
    <section className="w-full overflow-x-clip px-3 pt-5 uppercase text-white">
      <Divider />

      <div className="relative mt-3 flex min-h-[70svh] w-full min-w-0 flex-col justify-end overflow-hidden border border-white/10 p-3 sm:p-5">
        {/* Visual: four images side by side (2×2 on phones) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-white/10 lg:grid-cols-4 lg:grid-rows-1"
        >
          {Array.from({ length: 4 }, (_, i) => {
            const src = images[i];
            const direction: RevealDirection = i % 2 === 0 ? 'top-down' : 'bottom-up';

            return src ? (
              <RevealImage
                key={i}
                src={src}
                alt=""
                direction={direction}
                delay={i * 0.12}
                duration={1.2}
                amount={0.2}
                sizes="(min-width: 1024px) 25vw, 50vw"
                unoptimized={false}
                className="min-w-0 bg-black"
              />
            ) : (
              <div key={i} className="min-w-0 bg-black" />
            );
          })}
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

        {/* Content */}
        <div className="relative w-full min-w-0">
          <motion.p {...rise()} className="text-xs tracking-[0.2em] text-white/60 sm:text-sm sm:tracking-[0.25em]">
            The night is just getting started
          </motion.p>

          <motion.div {...rise(0.1)} className="mt-3 w-full min-w-0 overflow-hidden">
            <h2 className="sr-only">Night O’Clock</h2>
            <div aria-hidden="true">
              {/* Card has padding on both sides, so the word gets a touch less than the full 12vw on phones */}
              <StretchText className="font-heading text-[10.5vw] leading-[0.85] sm:text-[12vw]">
                NIGHT O&apos;CLOCK
              </StretchText>
            </div>
          </motion.div>

          <motion.ul {...rise(0.2)} className="mt-6 flex flex-wrap gap-x-4 gap-y-2 sm:mt-8 sm:gap-x-6">
            {ctas.map((cta) => (
              <li key={cta.label} className="max-w-full">
                <BracketButton label={cta.label} href={cta.href} />
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}