'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Divider } from '@/components/shared/Divider';
import { RollingNumber } from '@/components/shared/RollingNumber';
import { useTestimonials } from '@/hooks/useTestimonials';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/** Backer count. Change to 1,000+ only when it's true. */
const BACKERS = { value: 780, suffix: '+' };

type Testimonial = {
  id?: string;
  quote: string;
  name: string;
  campaign: string;
  /** Optional screenshot or artwork */
  image?: string | null;
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

function TestimonialCard({ quote, name, campaign, image }: Testimonial) {
  return (
    <figure className="relative flex h-full min-h-[250px] flex-col border border-white/10 p-3">
      <CornerTicks />

      {image && (
        <div className="relative mb-4 aspect-[4/3] overflow-hidden">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        </div>
      )}

      <blockquote className="text-sm leading-relaxed tracking-wide text-white/80">“{quote}”</blockquote>

      <figcaption className="mt-auto pt-12">
        <span className="block text-lg tracking-wide lg:text-xl">{name}</span>
        <span className="mt-2 block text-[10px] tracking-wider text-white/50 sm:text-xs">
          Backed {campaign}
        </span>
      </figcaption>
    </figure>
  );
}

/** Pass testimonials to skip fetching; otherwise the published ones come from /api/backer-testimonials */
export default function BackersSection({ testimonials: testimonialsProp }: { testimonials?: Testimonial[] }) {
  const { testimonials: published } = useTestimonials(testimonialsProp ? null : { published: true });
  const testimonials = testimonialsProp ?? published;

  return (
    <section className="px-3 py-10 uppercase text-white">
      <Divider />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="mt-3 text-center"
      >
        <h2 className="text-3xl tracking-wide lg:text-4xl">Our backers</h2>
        <p className="mt-2 text-sm tracking-wider text-white/50">
          <RollingNumber value={BACKERS.value} suffix={BACKERS.suffix} /> trusted backers
        </p>
      </motion.div>

      {/* The backer count stays up even before any testimonials are published */}
      {testimonials.length > 0 && (
        <ul className="mt-12 grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.li
              key={t.id ?? i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease, delay: (i % 4) * 0.12 }}
            >
              <TestimonialCard {...t} />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}