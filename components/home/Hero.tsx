'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { animate, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsDown,
  FiPause,
  FiPlay,
  FiVolume2,
  FiVolumeX,
} from 'react-icons/fi';
import { StretchText } from '../shared/StrechText';
import { SITE_NAME } from '@/config';
import { HOME_HERO_IMAGE } from '@/lib/assets';
import RevealImage from '../shared/RevealImage';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type HeroProps = {
  /** Background image (used as the first video's poster too) */
  image?: string;
  /** Background videos, played one after another in a loop */
  videos?: string[];
  tagline?: string;
};
const word = SITE_NAME.toUpperCase();

type Dir = 1 | -1;
type Reveal = [from: string, to: string];

/* Reveal shapes for the incoming video, used in turn on each switch.
   `next` is used going forward, `prev` going back (mirrored where it matters).
   Start and end of each pair share the same structure so clip-path can interpolate. */
const CRT: Reveal = ['inset(50% 0% 50% 0%)', 'inset(0% 0% 0% 0%)'];
const IRIS: Reveal = ['circle(0% at 50% 50%)', 'circle(75% at 50% 50%)'];
const REVEALS: { next: Reveal; prev: Reveal }[] = [
  // CRT switch-on: a horizontal slit opens out from the middle
  { next: CRT, prev: CRT },
  // Slanted blade sweeping across (left→right forward, right→left back)
  {
    next: ['polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)', 'polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)'],
    prev: ['polygon(100% 0%, 100% 0%, 125% 100%, 125% 100%)', 'polygon(100% 0%, -25% 0%, 0% 100%, 125% 100%)'],
  },
  // Iris opening from the centre
  { next: IRIS, prev: IRIS },
];
const revealFor = (round: number, dir: Dir) => {
  const r = REVEALS[(round - 1) % REVEALS.length];
  return dir === 1 ? r.next : r.prev;
};

/* 1-based character positions in reveal order.
   Letters are shuffled with a fixed seed, so the order is identical on server
   and client (no hydration mismatch). Spaces go last so they don't add empty gaps. */
const revealOrder = (() => {
  const letters: number[] = [];
  const spaces: number[] = [];
  [...word].forEach((ch, i) => (ch === ' ' ? spaces : letters).push(i + 1));

  // Seeded PRNG (mulberry32), seeded from the word itself
  let seed = [...word].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher–Yates shuffle of the letter positions
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return [...letters, ...spaces];
})();

export default function Hero({
  image = HOME_HERO_IMAGE,
  videos = [],
  tagline = 'A post-apocalyptic sci-fi universe',
}: HeroProps) {
  // As the page scrolls through the first screen, zoom the background slightly and darken it
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) =>
    typeof window === 'undefined' ? 0 : Math.min(y / window.innerHeight, 1),
  );
  const bgScale = useTransform(progress, [0, 1], [1, 1.08]);
  const dim = useTransform(progress, [0, 1], [0, 0.6]);

  // Once scrolled past the first screen, the content fully covers the hero,
  // so hide it and let the footer show through at the bottom
  const visibility = useTransform(scrollY, (y) =>
    typeof window !== 'undefined' && y > window.innerHeight ? 'hidden' : 'visible',
  );

  /* ---------- Video slider ---------- */
  const reduceMotion = useReducedMotion();
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const animsRef = useRef<{ stop: () => void }[]>([]);
  const activeRef = useRef(0);
  const roundRef = useRef(0);
  const count = videos.length;
  const isSlider = count > 1;

  // active = video on top, prev = the one being revealed over,
  // round = number of switches so far, dir = 1 forward / -1 back
  const [slide, setSlide] = useState<{ active: number; prev: number; round: number; dir: Dir }>({
    active: 0,
    prev: -1,
    round: 0,
    dir: 1,
  });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true); // must start muted for autoplay

  /** Switch to video `to`. Auto-advance always plays; manual nav keeps the paused state. */
  const goTo = (to: number, dir: Dir, autoplay = false) => {
    const from = activeRef.current;
    if (to === from) return;
    const round = roundRef.current + 1;
    roundRef.current = round;
    activeRef.current = to;

    // Cut short a reveal that's still running (fast clicking) and settle the current video
    animsRef.current.forEach((a) => a.stop());
    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.filter = '';
      if (i === from) {
        el.style.clipPath = 'none';
        el.style.transform = '';
      }
    });

    // Close the incoming layer before it's stacked on top, so it can be revealed
    const layer = layerRefs.current[to];
    if (layer) layer.style.clipPath = revealFor(round, dir)[0];

    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === to) {
        v.currentTime = 0;
        if (autoplay || !paused) v.play().catch(() => { });
      } else if (i !== from) {
        v.pause();
      }
    });

    setSlide({ active: to, prev: from, round, dir });
  };

  const goNext = () => goTo((activeRef.current + 1) % count, 1);
  const goPrev = () => goTo((activeRef.current - 1 + count) % count, -1);

  // Reveal the incoming video over the outgoing one
  useEffect(() => {
    if (slide.round === 0) return; // first video: the hero's own intro covers it
    const inLayer = layerRefs.current[slide.active];
    const outLayer = layerRefs.current[slide.prev];
    if (!inLayer || !outLayer) return;

    const [from, to] = revealFor(slide.round, slide.dir);
    const options = { duration: reduceMotion ? 0 : 1.4, ease };

    const reveal = animate(
      inLayer,
      { clipPath: [from, to], scale: [1.15, 1], filter: ['brightness(2)', 'brightness(1)'] },
      options,
    );
    const fadeOut = animate(outLayer, { filter: ['brightness(1)', 'brightness(0.3)'] }, options);
    animsRef.current = [reveal, fadeOut];

    const round = slide.round;
    const outVideo = videoRefs.current[slide.prev];
    reveal.then(() => {
      if (round !== roundRef.current) return; // a newer switch has taken over
      outVideo?.pause();
      outLayer.style.filter = ''; // reset for its next turn
    });

    return () => {
      reveal.stop();
      fadeOut.stop();
    };
  }, [slide, reduceMotion]);

  const togglePause = () => {
    const v = videoRefs.current[activeRef.current];
    if (!v) return;
    if (v.paused) v.play().catch(() => { });
    else v.pause();
  };

  const toggleMute = () => {
    const next = !muted;
    videoRefs.current.forEach((v) => {
      if (v) v.muted = next;
    });
    setMuted(next);
  };
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  return (
    <>
      <div aria-hidden="true" className="h-svh" />

      <motion.section style={{ visibility }} className="fixed inset-x-0 pt-16 top-0 z-3 h-svh overflow-hidden bg-black font-heading uppercase text-white">
        {/* Background */}
        <motion.div
          style={{ scale: bgScale }}
          initial={{ filter: 'brightness(0)' }}
          animate={{ filter: 'brightness(1)' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {count > 0 ? (
            videos.map((src, i) => (
              <div
                key={src}
                ref={(el) => {
                  layerRefs.current[i] = el;
                }}
                style={{ zIndex: i === slide.active ? 2 : i === slide.prev ? 1 : 0 }}
                className="absolute inset-0"
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={src}
                  autoPlay={i === 0}
                  muted={muted}
                  loop={!isSlider}
                  preload="auto"
                  playsInline
                  onPlaying={i === 0 ? () => setFirstFrameReady(true) : undefined}
                  onEnded={
                    isSlider
                      ? () => {
                        if (i === activeRef.current) goTo((i + 1) % count, 1, true);
                      }
                      : undefined
                  }
                  onPlay={() => {
                    if (i === activeRef.current) setPaused(false);
                  }}
                  onPause={(e) => {
                    // ignore the pause a video fires when it reaches its end
                    if (i === activeRef.current && !e.currentTarget.ended) setPaused(true);
                  }}
                  className={cn(
                    'size-full object-cover',
                    i === 0 && 'transition-opacity duration-700 ease-out',
                    i === 0 && !firstFrameReady && 'opacity-0',
                  )}
                />

                {i === 0 && image && (
                  <div
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out',
                      firstFrameReady && 'opacity-0',
                    )}
                  >
                    <RevealImage
                      src={image}
                      alt=""
                      trigger="mount"
                      priority
                      direction="bottom-up"
                      duration={1.2}
                      className="size-full"
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="absolute inset-0">
              <RevealImage
                src={image}
                alt=""
                trigger="mount"
                priority
                direction="bottom-up"
                duration={1.2}
                className="size-full"
              />
            </div>
          )}
        </motion.div>

        {/* Darkens as the page scrolls */}
        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-black" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between px-4 pb-5 pt-2.5">
          <h1 className="sr-only">{'Six Worlds. One Studio'}</h1>

          {/* Wordmark rises in on load */}
          <div aria-hidden="true">
            <StretchText className="font-heading text-[12vw] leading-[0.85]">
              {Array.from(word).map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 1.6 + revealOrder.indexOf(i + 1) * 0.5 }}
                  className={char === "'" || char === '’' ? 'font-sans' : undefined}
                >
                  {char}
                </motion.span>
              ))}
            </StretchText>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.8 }}
            className="flex items-end justify-between gap-4 text-[11px] tracking-wider sm:text-[13px]"
          >
            <p>{tagline}</p>

            <div className="flex shrink-0 items-center gap-4 sm:gap-6">
              {count > 0 && (
                <>
                  <button
                    type="button"
                    onClick={togglePause}
                    aria-label={paused ? 'Play background video' : 'Pause background video'}
                    className="flex items-center gap-1.5 uppercase tracking-wider transition-opacity hover:opacity-70"
                  >
                    {paused ? <FiPlay className="size-3.5" /> : <FiPause className="size-3.5" />}
                    <span className="hidden sm:inline">{paused ? 'Play' : 'Pause'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
                    className="flex items-center gap-1.5 uppercase tracking-wider transition-opacity hover:opacity-70"
                  >
                    {muted ? <FiVolumeX className="size-3.5" /> : <FiVolume2 className="size-3.5" />}
                    <span className="hidden sm:inline">{muted ? 'Sound off' : 'Sound on'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="flex cursor-pointer shrink-0 items-center gap-1.5 uppercase tracking-wider"
              >
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                >
                  <FiChevronsDown className="size-3.5" />
                </motion.span>
                Scroll to explore
              </button>
            </div>
          </motion.div>
        </div>

        {/* Prev / next, vertically centred on the left and right edges */}
        {isSlider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.8 }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-4 sm:px-6"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous video"
              className="pointer-events-auto grid size-11 place-items-center rounded-md border border-white/15 bg-black/50 backdrop-blur-md transition-colors hover:border-white/40 hover:bg-black/70 sm:size-12"
            >
              <FiChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next video"
              className="pointer-events-auto grid size-11 place-items-center rounded-md border border-white/15 bg-black/50 backdrop-blur-md transition-colors hover:border-white/40 hover:bg-black/70 sm:size-12"
            >
              <FiChevronRight className="size-5" />
            </button>
          </motion.div>
        )}
      </motion.section>
    </>
  );
}