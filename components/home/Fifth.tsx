'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, type Variants } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { IoPlayBack, IoPlayForward } from 'react-icons/io5';
import { GlowCircles } from '@/components/shared/GlowCircles'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];
const REVEAL = 1.1; // seconds for a new image to wipe up over the old one

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  image: string;
};

const picsum = (seed: string) => `https://picsum.photos/seed/${seed}/1920/1080`;

/* Only the first quote is real (from your screenshot). Replace the placeholders with real ones. */
const defaultSlides: Testimonial[] = [
  {
    quote: 'Huxley is original sci-fi done right',
    name: 'Neill Blomkamp',
    role: 'Director of District 9, Elysium & Chappie',
    image: picsum('huxley-t1'),
  },
  { quote: 'Placeholder quote number two', name: 'Name Surname', role: 'Role or publication', image: picsum('huxley-t2') },
  { quote: 'Placeholder quote number three', name: 'Name Surname', role: 'Role or publication', image: picsum('huxley-t3') },
  { quote: 'Placeholder quote number four', name: 'Name Surname', role: 'Role or publication', image: picsum('huxley-t4') },
];

const text: Variants = {
  hidden: {},
  show: {},
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/* Blinks on like a bad signal: on, off, dim, on, off, on */
const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.6, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
};

/* Scattered but fixed delay per word, so words blink on out of order (same on server and client) */
const wordDelay = (i: number) => 0.1 + ((i * 37) % 7) * 0.06;

export default function TestimonialsSection({ slides = defaultSlides }: { slides?: Testimonial[] }) {
  // `layer` goes up on every change, so the newest image always has the highest z-index
  const [{ index, layer }, setState] = useState({ index: 0, layer: 0 });
  const slide = slides[index];

  // The first quote flickers in when the section scrolls into view; later ones on every change
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.4 });

  const go = (next: number) => {
    const i = (next + slides.length) % slides.length;
    if (i === index) return;
    setState((s) => ({ index: i, layer: s.layer + 1 }));
  };

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Testimonials"
      className="relative isolate flex h-svh min-h-[150vh] items-center justify-center overflow-hidden bg-black px-4 font-heading uppercase text-white"
    >
      {/* Background images: the new one wipes up over the old one, which stays put underneath.
          `isolate` keeps their growing z-index contained inside this box. */}
      <div className="absolute inset-0 isolate">
      <AnimatePresence initial={false}>
        <motion.div
          key={layer}
          style={{ zIndex: layer }}
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ filter: 'brightness(0.5)', transition: { duration: REVEAL, ease } }}
          transition={{ duration: REVEAL, ease }}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: REVEAL + 0.6, ease }}
            className="absolute inset-0"
          >
            <Image src={slide.image} alt="" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      </div>

      {/* Preload every slide so a new one is ready before it's revealed */}
      <div aria-hidden="true" className="pointer-events-none absolute size-px opacity-0">
        {slides.map((s) => (
          <Image key={s.image} src={s.image} alt="" fill priority sizes="100vw" />
        ))}
      </div>

      {/* Overlays and HUD details */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-black/40" />
        <GlowCircles />
        <div className="absolute left-1/2 top-1/2 aspect-square h-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <span className="absolute left-[8%] top-[18%] text-[8px] tracking-widest text-white/50">15:37:2481</span>
        <FiChevronDown className="absolute bottom-[26%] left-1/2 size-4 -translate-x-1/2 text-white/30" />
      </div>

      {/* Content */}
      <div className="relative z-20 flex max-w-5xl flex-col items-center text-center">
        <div aria-live="polite" className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              variants={text}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              exit="exit"
              className="flex flex-col items-center"
            >
              <blockquote className="text-[clamp(2rem,4.5vw,4.5rem)] leading-[0.95]">
                <span className="sr-only">“{slide.quote}”</span>
                <span aria-hidden="true">
                  {`“${slide.quote}”`.split(' ').map((word, i, words) => (
                    <motion.span key={i} variants={flicker} custom={wordDelay(i)} className="inline-block">
                      {word}
                      {i < words.length - 1 && '\u00A0'}
                    </motion.span>
                  ))}
                </span>
              </blockquote>

              <motion.span variants={flicker} custom={0.6} aria-hidden="true" className="mt-5 block size-1 bg-white" />

              <figcaption className="mt-4 flex flex-col items-center gap-1">
                <motion.span variants={flicker} custom={0.7} className="text-sm tracking-wider">
                  {slide.name}
                </motion.span>
                <motion.span variants={flicker} custom={0.8} className="text-[10px] tracking-wider text-white/80 sm:text-xs">
                  {slide.role}
                </motion.span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3.5">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => go(index - 1)}
            className="grid size-11 place-items-center border border-white/15 bg-black/30 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <IoPlayBack className="size-3.5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.image}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="py-2"
              >
                <motion.span
                  animate={{ width: i === index ? 36 : 12, opacity: i === index ? 1 : 0.4 }}
                  transition={{ duration: 0.4, ease }}
                  className="block h-3 bg-white"
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => go(index + 1)}
            className="grid size-11 place-items-center border border-white/15 bg-black/30 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
          >
            <IoPlayForward className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}