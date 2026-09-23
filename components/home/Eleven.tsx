'use client';

import { motion, type Variants } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { MorphImage, MorphScope } from '@/components/shared/MorphImage'; // adjust path
import { DotButton } from '@/components/shared/DotButton'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type QuoteSectionProps = {
  image?: string;
  /** Each item is one line of the quote */
  lines?: string[];
  cite?: { label: string; href: string };
};

const quote: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const quoteLine: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.9, ease } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/* Faint sci-fi frame lines behind the quote */
function HudFrame() {
  const draw = {
    initial: { scaleX: 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true },
    transition: { duration: 1.4, ease },
  };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Outer angled frame */}
      <motion.svg
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.4 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute left-[9%] top-[6%] hidden h-[88%] w-[82%] lg:block"
      >
        <polygon
          points="4,0 96,0 100,18 100,82 96,100 4,100 0,82 0,18"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>

      {/* Full-width center line with a dot near each end */}
      <motion.div {...draw} className="absolute inset-x-0 top-1/2 h-px origin-center bg-white/15" />
      <span className="absolute left-[9%] top-1/2 -mt-0.5 size-1 bg-white/70" />
      <span className="absolute right-[9%] top-1/2 -mt-0.5 size-1 bg-white/70" />

      {/* Band behind the quote with bright end ticks */}
      <motion.div
        {...draw}
        transition={{ ...draw.transition, delay: 0.2 }}
        className="absolute inset-x-[9%] top-1/2 hidden h-[100px] -translate-y-1/2 origin-center border-y border-white/10 lg:block"
      />
      <div className="absolute inset-x-[17%] top-1/2 hidden h-[100px] -translate-y-1/2 lg:block">
        <span className="absolute inset-y-0 left-0 w-px bg-white/60" />
        <span className="absolute inset-y-0 right-0 w-px bg-white/60" />
        <span className="absolute -left-2 top-1/2 h-px w-2 bg-white/60" />
        <span className="absolute -right-2 top-1/2 h-px w-2 bg-white/60" />
      </div>
    </div>
  );
}

export default function QuoteSection({
  image = 'https://picsum.photos/seed/oracle/1920/1080',
  lines = ['"It was a time of great change', 'and order for humanity.', 'The A.I. wars had begun"'],
  cite = { label: 'The Oracle', href: '/products/the-oracle' },
}: QuoteSectionProps) {
  return (
    <MorphScope>
      <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden bg-black px-4 py-24 text-white lg:h-[30vw]">
        <MorphImage src={image} />

        {/* Darken for readability */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/50" />

        <HudFrame />

        <motion.figure
          variants={quote}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="relative flex flex-col items-center text-center"
        >
          <blockquote className="font-heading text-[clamp(1.4rem,2.6vw,3.25rem)] uppercase leading-[1.05] tracking-wide">
            {lines.map((line) => (
              <span key={line} className="block overflow-hidden">
                <motion.span variants={quoteLine} className="block">
                  {line}
                </motion.span>
              </span>
            ))}
          </blockquote>

          <motion.figcaption variants={fadeUp} className="mt-5">
            <DotButton label={cite.label} href={cite.href} />
          </motion.figcaption>
        </motion.figure>

        {/* Small chevron near the bottom */}
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 bottom-14 flex justify-center text-white/40"
        >
          <FiChevronDown className="size-4" />
        </motion.div>
      </section>
    </MorphScope>
  );
}