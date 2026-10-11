'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, type Variants } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { IoPlayBack, IoPlayForward } from 'react-icons/io5';
import { GlowCircles } from '@/components/shared/GlowCircles'; // adjust path
import LoadedImage, { ImagePreloader } from '../shared/LoadedImage';

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

/** One background in the stack. `first` is the slide the section opens with. */
type BgLayer = { id: number; index: number; first: boolean };
type BgState = 'waiting' | 'shown' | 'dim';

const SHOWN_CLIP = 'inset(0% 0% 0% 0%)';
const HIDDEN_CLIP = 'inset(100% 0% 0% 0%)';

export default function TestimonialsSection({ slides = defaultSlides }: { slides?: Testimonial[] }) {
  // `layer` goes up on every change; `index` is the slide asked for (the dots follow it straight away)
  const [{ index, layer }, setState] = useState({ index: 0, layer: 0 });

  // The backgrounds on screen: the current one, plus the next one while it loads and wipes in.
  // A new background waits until its image has loaded; until then the old one stays as it is.
  const [layers, setLayers] = useState<BgLayer[]>([{ id: 0, index: 0, first: true }]);
  const [readyId, setReadyId] = useState<number | null>(null);
  const [shownId, setShownId] = useState<number | null>(null);
  const top = layers[layers.length - 1];
  if (top.id !== layer) {
    // Keep only the background that is fully on screen underneath the new one
    setLayers([...layers.filter((l) => l.id === shownId), { id: layer, index, first: false }]);
  }

  // The quote changes together with its background, not before it
  const textIndex =
    readyId === top.id ? top.index : (layers.find((l) => l.id === shownId)?.index ?? top.index);
  const slide = slides[textIndex];

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
      className="relative isolate flex h-svh min-h-[150vh] items-center justify-center overflow-hidden px-4 uppercase text-white"
    >
      {/* Background images, newest on top: each new one waits for its image, then wipes up
          over the old one, which dims underneath. `isolate` keeps the stacking inside this box. */}
      <div className="absolute inset-0 isolate">
        {layers.map((bg) => {
          const isTop = bg.id === top.id;
          const state: BgState = isTop
            ? readyId === bg.id
              ? 'shown'
              : 'waiting'
            : readyId === top.id
              ? 'dim'
              : 'shown';
          return (
            <BackgroundLayer
              key={bg.id}
              src={slides[bg.index].image}
              first={bg.first}
              state={state}
              onReady={() => setReadyId((current) => (bg.id === top.id ? bg.id : current))}
              onShown={() => {
                if (!isTop) return;
                setShownId(bg.id);
                setLayers((current) => current.filter((l) => l.id === bg.id));
              }}
            />
          );
        })}
      </div>

      {/* Download the other slides once the page has loaded, so they wipe in without waiting.
          Same `sizes` and `unoptimized` as the backgrounds, so it's the same files. */}
      <ImagePreloader srcs={slides.map((s) => s.image)} sizes="100vw" unoptimized />

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
              key={textIndex}
              variants={text}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              exit="exit"
              className="flex flex-col items-center"
            >
              <blockquote className="text-[clamp(2rem,4.5vw,4.5rem)] font-heading leading-[0.95]">
                <span className="sr-only">“{slide.quote}”</span>
                <span aria-hidden="true">
                  {`“${slide.quote}”`.split(' ').map((word, i, words) => (
                    <motion.span key={i} variants={flicker} custom={wordDelay(i)} className="inline-block whitespace-pre">
                      {word}
                      {i < words.length - 1 && ' '}
                    </motion.span>
                  ))}
                </span>
              </blockquote>

              <motion.span variants={flicker} custom={0.6} aria-hidden="true" className="mt-5 block size-1 bg-white" />

              <figcaption className="mt-4 flex flex-col items-center gap-1">
                <motion.span variants={flicker} custom={0.7} className="text-sm font-heading tracking-wider">
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

/**
 * One full-screen background. It waits (hidden) until its image is ready, then the
 * opening one fades in and later ones wipe up, each settling from a slight zoom.
 */
function BackgroundLayer({
  src,
  first,
  state,
  onReady,
  onShown,
}: {
  src: string;
  first: boolean;
  state: BgState;
  onReady: () => void;
  onShown: () => void;
}) {
  const revealing = state !== 'waiting';
  const target =
    state === 'waiting'
      ? first
        ? { clipPath: SHOWN_CLIP, opacity: 0, filter: 'brightness(1)' }
        : { clipPath: HIDDEN_CLIP, opacity: 1, filter: 'brightness(1)' }
      : state === 'dim'
        ? { clipPath: SHOWN_CLIP, opacity: 1, filter: 'brightness(0.5)' }
        : { clipPath: SHOWN_CLIP, opacity: 1, filter: 'brightness(1)' };

  return (
    <motion.div
      initial={false}
      animate={target}
      transition={
        state === 'waiting' ? { duration: 0 } : first ? { duration: 0.9, ease: 'easeOut' } : { duration: REVEAL, ease }
      }
      onAnimationComplete={() => {
        if (state === 'shown') onShown();
      }}
      className="absolute inset-0"
    >
      {/* The zoom-settle starts with the reveal, not when the layer is added */}
      <motion.div
        initial={false}
        animate={{ scale: revealing ? 1 : 1.12 }}
        transition={revealing ? { duration: REVEAL + 0.6, ease } : { duration: 0 }}
        className="absolute inset-0"
      >
        {/* fadeMs 0: the wipe is the reveal, LoadedImage just reports when the picture is ready */}
        <LoadedImage
          unoptimized
          src={src}
          alt=""
          fill
          priority={first}
          // Later slides sit in a clipped layer until loaded, where a lazy image would never start
          loading={first ? undefined : 'eager'}
          sizes="100vw"
          fadeMs={0}
          onReady={onReady}
          className="object-cover"
        />
      </motion.div>
    </motion.div>
  );
}