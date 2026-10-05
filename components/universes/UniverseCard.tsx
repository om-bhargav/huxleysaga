'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path
import { RevealImage, type RevealDirection } from '@/components/shared/RevealImage'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/** Only the fields the card reads; your full universe object fits as is. */
export type UniverseCardData = {
    slug: string;
    name: string;
    genre: string;
    overline?: string;
    hook: string;
    hero: { poster: string };
    palette: { ink: string; paper: string; accent: string };
};

type UniverseCardProps = {
    universe: UniverseCardData;
    /** Display font for the name, e.g. displayFont[universe.display] */
    fontFamily?: string;
    /** Which way the poster wipes in. Alternate it across the grid. */
    direction?: RevealDirection;
    /** Seconds before the poster wipe starts, to offset neighbouring cards */
    delay?: number;
    sizes?: string;
};

/* ── Hover animations, borrowed from BracketButton and FrameButton ── */

/* "Explore universe" blinks out and back like a bad signal (BracketButton) */
const labelFlicker: Variants = {
    rest: { opacity: 1 },
    hover: {
        opacity: [1, 0, 1, 0, 0.6, 1],
        transition: { duration: 0.4, times: [0, 0.15, 0.3, 0.5, 0.7, 1] },
    },
};

/* Genre tag on a different rhythm so the two don't blink in sync (FrameButton label) */
const tagFlicker: Variants = {
    rest: { opacity: 1 },
    hover: {
        opacity: [1, 0, 1, 0.4, 1, 0, 1],
        transition: { duration: 0.45, times: [0, 0.08, 0.18, 0.3, 0.45, 0.6, 1] },
    },
};

/* Accent outline stutters on like a failing light, then holds (FrameButton surface) */
const outline: Variants = {
    rest: { opacity: 0, transition: { duration: 0.2 } },
    hover: {
        opacity: [0, 1, 0.3, 1, 0.15, 1, 0.6, 1],
        transition: { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.6, 0.8, 1] },
    },
};

/* The four corners: where they sit, which way the bracket faces, and where they fly in from */
const corners = [
    { pos: '-left-1.5 -top-1.5', rotate: 'rotate-0', dx: -1, dy: -1 },
    { pos: '-right-1.5 -top-1.5', rotate: 'rotate-90', dx: 1, dy: -1 },
    { pos: '-bottom-1.5 -right-1.5', rotate: 'rotate-180', dx: 1, dy: 1 },
    { pos: '-bottom-1.5 -left-1.5', rotate: '-rotate-90', dx: -1, dy: 1 },
];

const cornerVariants = (dx: number, dy: number): Variants => ({
    rest: { opacity: 0, x: dx * 8, y: dy * 8, transition: { duration: 0.2 } },
    hover: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ease, delay: 0.1 } },
});

/**
 * One universe in the grid.
 *
 * The poster wipes in (RevealImage) and glitches as it lands. Hovering the card flickers
 * the accent outline on, snaps the corner brackets in, and flickers the genre tag and label.
 * The poster only glitches when the "[ Explore universe ]" button itself is hovered
 * (or the card gets keyboard focus, since keyboard users can't hover the button).
 *
 * Each card has its own GlitchScope, so one card's glitch never spreads to its neighbours.
 */
export function UniverseCard(props: UniverseCardProps) {
    return (
        <GlitchScope>
            <Card {...props} />
        </GlitchScope>
    );
}

function Card({
    universe,
    fontFamily,
    direction = 'left-right',
    delay = 0,
    sizes = '(min-width: 1024px) 48vw, 94vw',
}: UniverseCardProps) {
    const glitch = useGlitchTrigger();
    const [active, setActive] = useState(false);
    const { ink, paper, accent } = universe.palette;
    const state = active ? 'hover' : 'rest';

    // Card hover: outline, corners and flickers, but no glitch
    const enter = () => setActive(true);
    const leave = () => setActive(false);

    // Keyboard focus lands on the whole card, so it counts as reaching the button too
    const focus = () => {
        setActive(true);
        glitch.onFocus?.();
    };

    return (
        <motion.div initial="rest" animate={state} className="relative h-full">
            <Link
                href={`/${universe.slug}`}
                onMouseEnter={enter}
                onMouseLeave={leave}
                onFocus={focus}
                onBlur={leave}
                className="group/world relative flex h-full flex-col overflow-hidden border focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={{
                    backgroundColor: ink,
                    color: paper,
                    borderColor: `color-mix(in srgb, ${paper} 20%, transparent)`,
                }}
            >
                <RevealImage
                    glitch
                    src={universe.hero.poster}
                    alt=""
                    direction={direction}
                    delay={delay}
                    sizes={sizes}
                    className="aspect-video"
                    imageClassName="transition-transform duration-700 "
                >
                    <div
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to top, ${ink}, transparent 65%)` }}
                    />
                    {/* Inside RevealImage's animated layer, so it takes the hover state explicitly */}
                    <motion.span
                        variants={tagFlicker}
                        initial="rest"
                        animate={state}
                        className="absolute left-3 top-3 border px-2 py-1 text-[10px] tracking-widest sm:text-[11px]"
                        style={{ borderColor: accent, color: accent, backgroundColor: `color-mix(in srgb, ${ink} 60%, transparent)` }}
                    >
                        {universe.genre}
                    </motion.span>
                </RevealImage>

                <div className="flex flex-1 flex-col p-3.5 lg:p-6">
                    {universe.overline && (
                        <span className="text-[10px] tracking-widest opacity-60 sm:text-[11px]">{universe.overline}</span>
                    )}

                    <span style={{ fontFamily }} className="mt-2 text-[clamp(1.75rem,3.6vw,3rem)] leading-none">
                        {universe.name}
                    </span>

                    <span className="mt-4 flex-1 text-xs leading-relaxed tracking-wider opacity-70 sm:text-sm">
                        {universe.hook}
                    </span>

                    {/* The BracketButton look; it can't be the component itself, since a link can't sit inside a link.
                        Hovering just this glitches the poster. self-start keeps the hover area to the button, not the full row. */}
                    <span
                        onMouseEnter={glitch.onMouseEnter}
                        className="mt-8 inline-flex items-center gap-3 self-start py-2 text-[11px] tracking-widest sm:text-[13px]"
                        style={{ color: accent }}
                    >
                        <span aria-hidden="true" className="opacity-70">
                            [
                        </span>
                        <motion.span variants={labelFlicker}>Explore universe</motion.span>
                        <span aria-hidden="true" className="opacity-70">
                            ]
                        </span>
                    </span>
                </div>

                {/* Accent outline that flickers on over the resting border */}
                <motion.span
                    aria-hidden="true"
                    variants={outline}
                    className="pointer-events-none absolute inset-0 z-20 border"
                    style={{ borderColor: accent }}
                />
            </Link>

            {/* Corner brackets, outside the link so its overflow-hidden doesn't clip them */}
            {corners.map(({ pos, rotate, dx, dy }) => (
                <motion.span
                    key={pos}
                    aria-hidden="true"
                    variants={cornerVariants(dx, dy)}
                    className={`pointer-events-none absolute z-30 size-3 ${pos}`}
                >
                    <span className={`absolute inset-0 ${rotate}`}>
                        <span className="absolute left-0 top-0 h-px w-full" style={{ backgroundColor: accent }} />
                        <span className="absolute left-0 top-0 h-full w-px" style={{ backgroundColor: accent }} />
                    </span>
                </motion.span>
            ))}
        </motion.div>
    );
}

export default UniverseCard;