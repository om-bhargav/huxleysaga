'use client';

import { motion, type Variants } from 'framer-motion';
import { GlitchImage, GlitchScope } from './GlitchImage'; // adjust path
import { BracketButton } from './BracketButton'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

export type FeatureSectionProps = {
  image: string;
  title: string;
  description: string;
  button: { label: string; href: string };
  id?: string;
};

const content: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const rise: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 1, ease } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};
const pop: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
};

/* Short horizontal tick sitting on the center line */
function Tick() {
  return <motion.span aria-hidden="true" variants={pop} className="block h-px w-2.5 bg-white/70" />;
}

/**
 * Full-screen section: background image, big centered title, description and a
 * "[ LABEL ]" button. Hovering the button glitches the background.
 */
export default function FeatureSection({ image, title, description, button, id }: FeatureSectionProps) {
  return (
    <GlitchScope>
      <section
        id={id}
        className="relative isolate flex md:min-h-[150vh] items-center justify-center overflow-hidden bg-black px-4 py-24 text-white"
      >
        <GlitchImage src={image} />

        {/* Darken for readability */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />

        {/* Faint vertical center line */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease }}
          className="absolute inset-y-0 left-1/2 w-px origin-top bg-white/10"
        />

        <motion.div
          variants={content}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="relative -mt-[10vh] flex max-w-[640px] flex-col items-center text-center"
        >
          <Tick />

          <h2 className="mt-6 overflow-hidden text-[clamp(3rem,6.5vw,7rem)] uppercase leading-none">
            <motion.span variants={rise} className="block">
              {title}
            </motion.span>
          </h2>

          <motion.span aria-hidden="true" variants={pop} className="mt-5 block size-1 bg-white" />

          <motion.p
            variants={fadeUp}
            className="mt-4 font-heading text-[11px] uppercase leading-relaxed tracking-wider sm:text-[13px]"
          >
            {description}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-3">
            <BracketButton label={button.label} href={button.href} />
          </motion.div>

          <div className="mt-8">
            <Tick />
          </div>
        </motion.div>
      </section>
    </GlitchScope>
  );
}