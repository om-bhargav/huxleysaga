'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { IoPlayBack, IoPlayForward } from 'react-icons/io5';
import { Divider } from '@/components/shared/Divider';
import { LoadedImage } from '@/components/shared/LoadedImage'; // adjust path

/* ---------- Types ---------- */

export type CharacterStat = { label: string; value: string };

export type ShowcaseCharacter = {
  name: string;
  /** Small line above the name, e.g. a codename */
  alias?: string;
  description: string;
  /** The first image is also the thumbnail. Two or more turn on the dots and autoplay. */
  images: string[];
  /** Shown along the bottom of the panel, one column each */
  stats?: CharacterStat[];
};

export type CharactersSectionProps = {
  characters: ShowcaseCharacter[];
  /** Heading with a divider above the panel. Leave it out when a wrapper already titles the section. */
  title?: ReactNode;
  /** Draws the character's name. Defaults to an h3 in the heading font. */
  renderName?: (character: ShowcaseCharacter) => ReactNode;
  /** Panel colours: any CSS colour or var(). Defaults to white on near-black. */
  colors?: { ink?: string; paper?: string; accent?: string };
  className?: string;
};

/** Size and wrapping of the big name, for custom `renderName` headings */
export const characterNameClass = 'text-[clamp(2.5rem,4.5vw,5rem)] leading-none [overflow-wrap:anywhere]';

/* ---------- Motion ---------- */

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];
const REVEAL = 1; // seconds for a new image to wipe in
const AUTOPLAY = 5000; // ms between images of the same character
const LOAD_TIMEOUT = 8000; // never wait longer than this for a slow or broken image
const MAIN_SIZES = '(min-width: 1024px) 50vw, 100vw';

const shownClip = 'inset(0% 0% 0% 0%)';
const hiddenClip = { up: 'inset(100% 0% 0% 0%)', left: 'inset(0% 0% 0% 100%)' } as const;

/** One picture in the main panel. `first` is the image the section opens with. */
type Layer = { id: number; src: string; alt: string; dir: 'up' | 'left'; first: boolean };

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

const defaultRenderName = (character: ShowcaseCharacter) => (
  <h3 className={`font-heading ${characterNameClass}`}>{character.name}</h3>
);

/* ---------- Component ---------- */

/**
 * Character showcase: a large image and details panel with a thumbnail picker.
 * Works with any list of characters; map your own data to `ShowcaseCharacter`.
 */
export function CharactersSection({
  characters,
  title,
  renderName = defaultRenderName,
  colors,
  className = '',
}: CharactersSectionProps) {
  if (!characters.length) return null;

  const Root = title ? 'section' : 'div';
  const style = {
    '--cs-ink': colors?.ink ?? '#0a0a0a',
    '--cs-paper': colors?.paper ?? '#ffffff',
    '--cs-accent': colors?.accent ?? colors?.paper ?? '#ffffff',
    '--cs-line': 'color-mix(in srgb, var(--cs-paper) 15%, transparent)',
    color: 'var(--cs-paper)',
  } as CSSProperties;

  return (
    <Root className={`uppercase ${className}`} style={style}>
      {title && (
        <>
          <Divider />
          <h2 className="mb-12 mt-3 text-center text-3xl tracking-wide lg:text-4xl">{title}</h2>
        </>
      )}
      <Viewer characters={characters} renderName={renderName} />
    </Root>
  );
}

function Viewer({
  characters,
  renderName,
}: {
  characters: ShowcaseCharacter[];
  renderName: (character: ShowcaseCharacter) => ReactNode;
}) {
  // `layer` rises on every change so the newest image is always on top;
  // `dir` decides how it's revealed: 'up' for the same character, 'left' for a new character
  const [view, setView] = useState({ char: 0, img: 0, layer: 0, dir: 'up' as 'up' | 'left' });
  const character = characters[view.char];
  const images = character.images;
  const stats = character.stats ?? [];
  const reduceMotion = useReducedMotion();

  // Unique per instance, so two sections on one page don't share the sliding highlight
  const highlightId = `${useId()}-active-character`;

  const altFor = (c: ShowcaseCharacter, img: number) =>
    c.images.length > 1 ? `${c.name}, image ${img + 1}` : c.name;

  // The main panel's pictures: the one on screen, plus the next one while it loads and wipes in.
  // A new picture waits until it has loaded before wiping in; until then the old one stays as it is.
  const [layers, setLayers] = useState<Layer[]>(() => [
    { id: 0, src: images[0], alt: altFor(character, 0), dir: 'up', first: true },
  ]);
  const [readyId, setReadyId] = useState<number | null>(null);
  const [shownId, setShownId] = useState<number | null>(null);
  const top = layers[layers.length - 1];
  if (top.id !== view.layer) {
    // Keep only the picture that is fully on screen underneath the new one
    setLayers([
      ...layers.filter((l) => l.id === shownId),
      { id: view.layer, src: images[view.img], alt: altFor(character, view.img), dir: view.dir, first: false },
    ]);
  }

  // Warm the browser cache: this character's other images, and the first image of the
  // characters either side, plus any thumbnail being pointed at
  const [hoverWarm, setHoverWarm] = useState<string[]>([]);
  const neighbours = [characters[(view.char + 1) % characters.length], characters[(view.char - 1 + characters.length) % characters.length]];
  const warm = [...new Set([...images, ...neighbours.map((c) => c.images[0]), ...hoverWarm])];

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
    if (reduceMotion || images.length < 2) return;
    const t = window.setTimeout(() => selectImage(view.img + 1), AUTOPLAY);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.char, view.img, reduceMotion]);

  // Keep the active thumbnail in view (skipped on first load so the page doesn't jump)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
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
    <>
      {/* Main panel */}
      <div className="grid border border-[color:var(--cs-line)] bg-[color-mix(in_srgb,var(--cs-paper)_3%,var(--cs-ink))] lg:grid-cols-2">
        {/* Image */}
        <div className="border-b border-[color:var(--cs-line)] p-3.5 lg:border-b-0 lg:border-r">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--cs-ink)]">
            {/* Image layers, newest on top; `isolate` keeps their stacking inside this box */}
            <div className="absolute inset-0 isolate">
              {layers.map((layer) => {
                const isTop = layer.id === top.id;
                const state: LayerState = isTop
                  ? readyId === layer.id
                    ? 'shown'
                    : 'waiting'
                  : readyId === top.id
                    ? 'dim' // the new picture is ready and wiping in over this one
                    : 'shown';
                return (
                  <ImageLayer
                    key={layer.id}
                    layer={layer}
                    state={state}
                    reduceMotion={!!reduceMotion}
                    onReady={() => setReadyId((current) => (layer.id === top.id ? layer.id : current))}
                    onShown={() => {
                      if (!isTop) return;
                      setShownId(layer.id);
                      setLayers((current) => current.filter((l) => l.id === layer.id));
                    }}
                  />
                );
              })}
            </div>

            {/* Downloads the pictures you're likely to open next, so they wipe in without waiting */}
            <div aria-hidden="true" className="pointer-events-none absolute size-px overflow-hidden opacity-0">
              {warm.map((src) => (
                <Image key={src} src={src} alt="" fill sizes={MAIN_SIZES} loading="eager" />
              ))}
            </div>

            {images.length > 1 && (
              <>
                {/* Image dots */}
                <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
                  {images.map((src, i) => (
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
                        className="block h-3.5 bg-[var(--cs-paper)]"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="border-b border-[color:var(--cs-line)] px-[8%] py-12 lg:py-20">
            <FlickerSwap id={view.char}>
              {character.alias && (
                <p className="mb-4 text-[11px] tracking-widest text-[var(--cs-accent)] sm:text-xs">
                  {character.alias}
                </p>
              )}
              {renderName(character)}
            </FlickerSwap>
          </div>

          <div className="flex-1 px-[8%] py-12 lg:py-20">
            <FlickerSwap id={view.char} delay={0.1}>
              <p className="max-w-[60ch] text-[11px] leading-relaxed tracking-wider opacity-70 sm:text-xs">
                {character.description}
              </p>
            </FlickerSwap>
          </div>

          {stats.length > 0 && (
            <dl
              className="grid border-t border-[color:var(--cs-line)]"
              style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`px-[16%] py-12 lg:py-20 ${i < stats.length - 1 ? 'border-r border-[color:var(--cs-line)]' : ''}`}
                >
                  <dt className="text-[11px] tracking-widest opacity-50 sm:text-xs">{stat.label}</dt>
                  <dd className="mt-1.5 text-[11px] font-semibold tracking-widest sm:text-xs">
                    <FlickerSwap id={view.char} delay={0.2 + i * 0.05}>
                      {stat.value}
                    </FlickerSwap>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Character picker */}
      <div className="relative z-10 mt-4 flex gap-3">
        <div className="flex w-12 shrink-0 flex-col gap-2.5">
          <button
            type="button"
            aria-label="Previous character"
            onClick={() => selectCharacter(view.char - 1)}
            className="grid flex-1 place-items-center border border-[color:var(--cs-line)] transition-colors hover:bg-[var(--cs-paper)] hover:text-[var(--cs-ink)]"
          >
            <IoPlayBack className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next character"
            onClick={() => selectCharacter(view.char + 1)}
            className="grid flex-1 place-items-center border border-[color:var(--cs-line)] transition-colors hover:bg-[var(--cs-paper)] hover:text-[var(--cs-ink)]"
          >
            <IoPlayForward className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <motion.div
          ref={scrollerRef}
          layoutScroll
          className="flex min-w-0 flex-1 gap-3.5 overflow-x-auto [contain:inline-size] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {characters.map((c, i) => {
            const active = i === view.char;
            return (
              <button
                key={i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                aria-label={c.name}
                aria-current={active}
                onClick={() => selectCharacter(i)}
                onPointerEnter={() =>
                  setHoverWarm((current) => (current.includes(c.images[0]) ? current : [...current, c.images[0]]))
                }
                className="group relative w-[136px] cursor-pointer! shrink-0 border border-[color:var(--cs-line)] p-2.5 text-left"
              >
                {/* Active highlight slides between thumbnails */}
                {active && (
                  <motion.span
                    layoutId={highlightId}
                    transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                    className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--cs-paper)_10%,transparent)]"
                  >
                    <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-[color:var(--cs-accent)]" />
                    <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-[color:var(--cs-accent)]" />
                    <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[color:var(--cs-accent)]" />
                    <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-[color:var(--cs-accent)]" />
                  </motion.span>
                )}

                <span className="relative block  aspect-square overflow-hidden">
                  <LoadedImage
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
        </motion.div>
      </div>
    </>
  );
}

type LayerState = 'waiting' | 'shown' | 'dim';

/**
 * One picture in the main panel. It reports `onReady` once its image has loaded and
 * decoded (or failed, or timed out), and only then wipes in. The opening picture
 * fades in instead of wiping.
 */
function ImageLayer({
  layer,
  state,
  reduceMotion,
  onReady,
  onShown,
}: {
  layer: Layer;
  state: LayerState;
  reduceMotion: boolean;
  onReady: () => void;
  onShown: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onReadyRef.current();
    };
    // Wait for decoding too, so the first frame of the wipe already has the picture
    const decodeThenFinish = (img: HTMLImageElement) => {
      img.decode().catch(() => undefined).then(finish);
    };

    const existing = el.querySelector('img');
    if (existing?.complete && existing.naturalWidth > 0) {
      decodeThenFinish(existing);
      return () => {
        done = true;
      };
    }

    // load/error don't bubble, so listen in the capture phase to catch the inner <img>
    const onEvent = (e: Event) => {
      if (!(e.target instanceof HTMLImageElement)) return;
      if (e.type === 'error') finish();
      else decodeThenFinish(e.target);
    };
    el.addEventListener('load', onEvent, true);
    el.addEventListener('error', onEvent, true);
    const timeout = window.setTimeout(finish, LOAD_TIMEOUT);

    return () => {
      done = true;
      el.removeEventListener('load', onEvent, true);
      el.removeEventListener('error', onEvent, true);
      window.clearTimeout(timeout);
    };
  }, []);

  // The opening picture (and everything under reduced motion) fades; later ones wipe
  const fades = layer.first || reduceMotion;
  const target =
    state === 'waiting'
      ? fades
        ? { clipPath: shownClip, opacity: 0, filter: 'brightness(1)' }
        : { clipPath: hiddenClip[layer.dir], opacity: 1, filter: 'brightness(1)' }
      : state === 'dim'
        ? { clipPath: shownClip, opacity: 1, filter: 'brightness(0.5)' }
        : { clipPath: shownClip, opacity: 1, filter: 'brightness(1)' };

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={target}
      transition={
        state === 'waiting'
          ? { duration: 0 }
          : fades
            ? { duration: 0.6, ease: 'easeOut' }
            : { duration: REVEAL, ease }
      }
      onAnimationComplete={() => {
        if (state === 'shown') onShown();
      }}
      className="absolute inset-0"
    >
      <Image src={layer.src} alt={layer.alt} fill sizes={MAIN_SIZES} loading="eager" className="object-cover" />
    </motion.div>
  );
}

export default CharactersSection;