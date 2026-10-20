'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path
import { communityLinks, socialLinks, type ExternalLink } from '@/config/links';
import { Divider } from '@/components/shared/Divider';
import { StretchText } from '@/components/shared/StrechText';
import { GATE_IMAGES } from '@/lib/assets';

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
    <section className="px-3 pb-14 pt-5 uppercase text-white">
      <Divider />

      <div className="relative mt-3 flex min-h-[70svh] flex-col justify-end overflow-hidden border border-white/10 p-3 sm:p-5">
        {/* Visual: four images side by side (2×2 on phones) */}
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => {
            const src = images[i];
            return (
              <div key={i} className="relative overflow-hidden bg-black">
                {src && (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

        {/* Content */}
        <div className="relative">
          <motion.p {...rise()} className="text-sm tracking-[0.25em] text-white/60">
            The night is just getting started
          </motion.p>

          <motion.div {...rise(0.1)} className="mt-3">
            <h2 className="sr-only">Night O’Clock</h2>
            <div aria-hidden="true">
              <StretchText className="font-heading text-[12vw] leading-[0.8]">NIGHT O&apos;CLOCK</StretchText>
            </div>
          </motion.div>

          <motion.ul {...rise(0.2)} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {ctas.map((cta) => (
              <li key={cta.label}>
                <BracketButton label={cta.label} href={cta.href} />
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}