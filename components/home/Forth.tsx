'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { IoPlayBack, IoPlayForward } from 'react-icons/io5';
import { Divider } from '@/components/shared/Divider'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];
const REVEAL = 1; // seconds for a new image to wipe in
const AUTOPLAY = 5000; // ms between images of the same character

export type Character = {
  name: string;
  description: string;
  role: string; // shown as "Class"
  appearsIn: string;
  images: string[];
};

const pic = (seed: string, w = 1200, h = 1500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const images = (slug: string) => [1, 2, 3].map((n) => pic(`char-${slug}-${n}`));

/* Only Scrape's details come from your screenshot. Names ending in … were cut off there,
   so check them; everything marked Placeholder needs your real copy. */
const defaultCharacters: Character[] = [
  {
    name: 'Scrape',
    description:
      'Once one of the countless mass-produced robots of the wastelands, Scrape now sits forgotten in a cell deep inside Machine City. Kind and eager to help, though years alone have left his circuits a little scrambled.',
    role: 'Utility robot',
    appearsIn: 'Huxley',
    images: images('scrape'),
  },
  ...['The Oracle', 'Dreamwalkers', 'Necromancers', 'Combat units', 'Titans', 'Max', 'Phantoms', 'Huxley', 'Kai', 'Karmak', 'Terada'].map(
    (name): Character => ({
      name,
      description: 'Placeholder description. Replace with this character’s real bio.',
      role: 'Placeholder',
      appearsIn: 'Placeholder',
      images: images(name.toLowerCase().replace(/\s+/g, '-')),
    }),
  ),
];

/* Blinks on like a bad signal: on, off, dim, off, on */
const flicker: Variants = {
  hidden: { opacity: 0 },
  show: (delay: number = 0) => ({
    opacity: [0, 1, 0, 0.5, 0, 1],
    transition: { duration: 0.6, times: [0, 0.15, 0.3, 0.5, 0.7, 1], delay },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* Text that flickers in whenever `id` changes */
function FlickerSwap({ id, delay = 0, children }: { id: string | number; delay?: number; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={id} variants={flicker} custom={delay} initial="hidden" animate="show" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function CharactersSection({ characters = defaultCharacters }: { characters?: Character[] }) {
  // `layer` rises on every change so the newest image is always on top;
  // `dir` decides how it's revealed: 'up' for the same character, 'left' for a new character
  const [view, setView] = useState({ char: 0, img: 0, layer: 0, dir: 'up' as 'up' | 'left' });
  const character = characters[view.char];
  const reduceMotion = useReducedMotion();

  const selectCharacter = (next: number) => {
    const c = (next + characters.length) % characters.length;
    setView((v) => (c === v.char ? v : { char: c, img: 0, layer: v.layer + 1, dir: 'left' }));
  };

  const selectImage = (next: number) => {
    setView((v) => {
      const count = characters[v.char].images.length;
      const i = (next + count) % count;
      return i === v.img ? v : { ...v, img: i, layer: v.layer + 1, dir: 'up' };
    });
  };

  // Cycle through the current character's images; restarts after any change
  useEffect(() => {
    if (reduceMotion || character.images.length < 2) return;
    const t = window.setTimeout(() => selectImage(view.img + 1), AUTOPLAY);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.char, view.img, reduceMotion]);

  // Keep the active thumbnail in view (skipped on first load so the page doesn't jump)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hidden = view.dir === 'up' ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)';
  const scrollerRef = useRef<HTMLDivElement>(null);
  const prevChar = useRef(view.char);
  useEffect(() => {
    if (prevChar.current === view.char) return; // no change, so no scroll (safe under Strict Mode)
    prevChar.current = view.char;

    const scroller = scrollerRef.current;
    const thumb = thumbRefs.current[view.char];
    if (!scroller || !thumb) return;

    const s = scroller.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (t.left < s.left) scroller.scrollBy({ left: t.left - s.left, behavior });
    else if (t.right > s.right) scroller.scrollBy({ left: t.right - s.right, behavior });
  }, [view.char, reduceMotion]);
  return (
    <section className="px-3 pb-16 pt-5 font-heading uppercase text-white">
      <Divider />
      <h2 className="mt-3 text-center text-3xl tracking-wide lg:text-4xl">Characters</h2>

      {/* Main panel */}
      <div className="mt-12 grid border border-white/10 bg-neutral-950 lg:grid-cols-2">
        {/* Image */}
        <div className="border-b border-white/10 p-3.5 lg:border-b-0 lg:border-r">
          <div className="relative aspect-[4/5] overflow-hidden bg-black">
            {/* Image layers; `isolate` keeps their growing z-index inside this box */}
            <div className="absolute inset-0 isolate">
              <AnimatePresence initial={false}>
                <motion.div
                  key={view.layer}
                  style={{ zIndex: view.layer }}
                  initial={{ clipPath: hidden }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                  exit={{ filter: 'brightness(0.5)', transition: { duration: REVEAL, ease } }}
                  transition={{ duration: REVEAL, ease }}
                  className="absolute inset-0"
                >
                  <Image
                    src={character.images[view.img]}
                    alt={`${character.name}, image ${view.img + 1}`}
                    fill
                    priority={view.layer === 0}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Preload this character's other images so dot changes are instant */}
            <div aria-hidden="true" className="pointer-events-none absolute size-px opacity-0">
              {character.images.map((src) => (
                <Image key={src} src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" />
              ))}
            </div>

            {/* Image dots */}
            {character.images.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
                {character.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Show image ${i + 1}`}
                    aria-current={i === view.img}
                    onClick={() => selectImage(i)}
                    className="py-1"
                  >
                    <motion.span
                      animate={{ width: i === view.img ? 40 : 14, opacity: i === view.img ? 1 : 0.4 }}
                      transition={{ duration: 0.4, ease }}
                      className="block h-3.5 bg-white"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="border-b border-white/10 px-[8%] py-12 lg:py-20">
            <FlickerSwap id={view.char}>
              <h3 className="text-[clamp(2.5rem,4.5vw,5rem)] leading-none">{character.name}</h3>
            </FlickerSwap>
          </div>

          <div className="flex-1 px-[8%] py-12 lg:py-20">
            <FlickerSwap id={view.char} delay={0.1}>
              <p className="max-w-[60ch] text-[11px] leading-relaxed tracking-wider text-white/60 sm:text-xs">
                {character.description}
              </p>
            </FlickerSwap>
          </div>

          <dl className="grid grid-cols-2 border-t border-white/10">
            <div className="border-r border-white/10 px-[16%] py-12 lg:py-20">
              <dt className="text-[11px] tracking-widest text-white/50 sm:text-xs">Class</dt>
              <dd className="mt-1.5 text-[11px] font-semibold tracking-widest sm:text-xs">
                <FlickerSwap id={view.char} delay={0.2}>
                  {character.role}
                </FlickerSwap>
              </dd>
            </div>
            <div className="px-[16%] py-12 lg:py-20">
              <dt className="text-[11px] tracking-widest text-white/50 sm:text-xs">Appears in</dt>
              <dd className="mt-1.5 text-[11px] font-semibold tracking-widest sm:text-xs">
                <FlickerSwap id={view.char} delay={0.25}>
                  {character.appearsIn}
                </FlickerSwap>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Character picker */}
      <div className="mt-4 flex gap-3">
        <div className="flex w-12 shrink-0 flex-col gap-2.5">
          <button
            type="button"
            aria-label="Previous character"
            onClick={() => selectCharacter(view.char - 1)}
            className="grid flex-1 place-items-center border border-white/10 transition-colors hover:bg-white hover:text-black"
          >
            <IoPlayBack className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next character"
            onClick={() => selectCharacter(view.char + 1)}
            className="grid flex-1 place-items-center border border-white/10 transition-colors hover:bg-white hover:text-black"
          >
            <IoPlayForward className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div ref={scrollerRef} className="flex min-w-0 flex-1 gap-3.5 overflow-x-auto [contain:inline-size] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {characters.map((c, i) => {
            const active = i === view.char;
            return (
              <button
                key={c.name}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                aria-label={c.name}
                aria-current={active}
                onClick={() => selectCharacter(i)}
                className="group relative w-[136px] shrink-0 border border-white/10 p-2.5 text-left"
              >
                {/* Active highlight slides between thumbnails */}
                {active && (
                  <motion.span
                    layoutId="active-character"
                    transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                    className="absolute inset-0 bg-white/10"
                  >
                    <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-white" />
                    <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-white" />
                  </motion.span>
                )}

                <span className="relative block aspect-square overflow-hidden">
                  <Image
                    src={c.images[0]}
                    alt=""
                    fill
                    sizes="136px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="relative mt-2.5 block truncate text-[11px] font-semibold tracking-widest">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}