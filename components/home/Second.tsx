'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { GlitchImage, GlitchScope } from '@/components/shared/GlitchImage'; // adjust path
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path

export type ShowcaseItem = {
  title: string;
  description: string;
  image: string;
  button: { label: string; href: string };
};

const picsum = (seed: string) => `https://picsum.photos/seed/${seed}/1920/1080`;

/* Placeholder copy: swap in your real text */

const defaultItems: ShowcaseItem[] = [
  {
    title: 'Spy Files',
    description:
      'Step into a world of covert operations, hidden identities, and high-stakes missions. Follow elite agents as they uncover secrets buried deep within a global web of deception.',
    image: picsum('universe-spy-files'),
    button: { label: 'Explore Spy Files', href: '/universes/spy-files' },
  },
  {
    title: 'Gaming',
    description:
      'Enter worlds where every decision matters. From legendary heroes to dangerous quests, discover immersive stories and unforgettable adventures built for gamers.',
    image: picsum('universe-gaming'),
    button: { label: 'Explore Gaming', href: '/universes/gaming' },
  },
  {
    title: 'Wild West',
    description:
      'Ride into a lawless frontier of outlaws, gunslingers, and dusty towns. In the Wild West, every trail has a story and every showdown could change your fate.',
    image: picsum('universe-wild-west'),
    button: { label: 'Explore Wild West', href: '/universes/wild-west' },
  },
];
/* Blinks on like a bad signal */
const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.6, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
};

function Panel({ item, index, total }: { item: ShowcaseItem; index: number; total: number }) {
  const ref = useRef<HTMLElement>(null);

  // 0 when the panel's top touches the bottom of the screen, 1 when it reaches the top
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  // Image starts as an inset box with black around it and grows to fill the screen
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(12% 8% 0% 8%)', 'inset(0% 0% 0% 0%)'],
  );
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <GlitchScope>
      <section ref={ref} className="relative h-svh min-h-[600px] overflow-hidden bg-black font-heading uppercase text-white">
        {/* Expanding image with glitch */}
        <motion.div style={{ clipPath }} className="absolute inset-0">
          <motion.div style={{ scale }} className="absolute inset-0">
            <GlitchImage src={item.image} alt={item.title} />
          </motion.div>
        </motion.div>

        {/* Fade to black at the bottom so the text reads */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 45%, transparent 100%)' }}
        />

        {/* Text, flickers in when the panel comes into view */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="absolute bottom-0 left-0 max-w-[440px] px-4 pb-10"
        >
          <motion.span variants={flicker} custom={0} aria-hidden="true" className="block size-1 bg-white" />
          <motion.h2 variants={flicker} custom={0.1} className="mt-3 text-[clamp(2.5rem,5vw,5rem)] leading-none">
            {item.title}
          </motion.h2>
          <motion.p
            variants={flicker}
            custom={0.2}
            className="mt-3 text-[10px] leading-relaxed tracking-wider text-white/90 sm:text-xs"
          >
            {item.description}
          </motion.p>
          <motion.div variants={flicker} custom={0.3} className="mt-2 -ml-1">
            <BracketButton label={item.button.label} href={item.button.href} />
          </motion.div>
        </motion.div>
      </section>
    </GlitchScope>
  );
}

/** Stack of full-screen product panels. Each image grows from an inset box to full screen as it scrolls in. */
export default function ProductShowcase({ items = defaultItems }: { items?: ShowcaseItem[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <Panel key={item.title} item={item} index={i} total={items.length} />
      ))}
    </div>
  );
}