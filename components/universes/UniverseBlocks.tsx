'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiPlay, FiPlus, FiX } from 'react-icons/fi';
import { BlockLabel, UniverseHeading } from './UniverseTheme'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { Marquee } from '@/components/shared/Marquee'; // adjust path
import type { Universe } from '@/config/universes'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/** Shared shell so all eight blocks share one rhythm and anchor scheme. */
function Block({
  id,
  index,
  label,
  children,
  className = '',
}: {
  id: string;
  index: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-14 px-3 py-16 lg:py-24 ${className}`}>
      <BlockLabel index={index}>{label}</BlockLabel>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/* 1 ─ Intro video. Full-screen film for the comic; the poster stands in until the file lands. */
export function IntroVideo({ universe }: { universe: Universe }) {
  return (
    <section id="intro" className="relative h-svh min-h-[560px] overflow-hidden">
      <Image
        src={universe.hero.poster}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(to top, var(--u-ink) 4%, transparent 60%)` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-x-0 bottom-0 p-3 pb-10 lg:p-8">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          {universe.overline && (
            <motion.p
              variants={rise}
              className="font-heading text-[11px] uppercase tracking-widest opacity-70 sm:text-[13px]"
            >
              {universe.overline}
            </motion.p>
          )}

          <motion.div variants={rise}>
            <UniverseHeading as="h1" className="mt-2 text-[clamp(2.5rem,8vw,7.5rem)]">
              {universe.name}
            </UniverseHeading>
          </motion.div>

          <motion.p
            variants={rise}
            className="mt-4 max-w-[46ch] font-heading text-[11px] uppercase leading-relaxed tracking-widest opacity-80 sm:text-[13px]"
          >
            {universe.genre} · {universe.hook}
          </motion.p>

          {/* The spec's block 1 is a video; this marks where it goes. */}
          <motion.p
            variants={rise}
            className="mt-6 inline-flex items-center gap-2 border px-3 py-2 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
            style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
          >
            <FiPlay aria-hidden="true" className="size-3" />
            Intro video — {universe.hero.videoNote}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* 2 ─ About the story, with the spec's optional "read the full story" expander. */
export function AboutStory({ universe }: { universe: Universe }) {
  const [open, setOpen] = useState(false);
  const { headline, text, more } = universe.story;

  return (
    <Block id="story" index={2} label="About the story">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={rise}>
        <UniverseHeading className="max-w-[22ch] text-[clamp(1.75rem,4.5vw,4rem)]">{headline}</UniverseHeading>

        <p className="mt-8 max-w-[70ch] text-sm leading-relaxed opacity-80 lg:text-base">{text}</p>

        {more && (
          <>
            <motion.p
              id="full-story"
              initial={false}
              animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.45, ease }}
              className="max-w-[70ch] overflow-hidden text-sm leading-relaxed opacity-80 lg:text-base"
            >
              <span className="mt-4 block">{more}</span>
            </motion.p>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="full-story"
              className="mt-6 inline-flex items-center gap-2 border px-3 py-2 font-heading text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70 sm:text-[11px]"
              style={{ borderColor: 'var(--u-accent)' }}
            >
              {open ? <FiX aria-hidden="true" className="size-3" /> : <FiPlus aria-hidden="true" className="size-3" />}
              {open ? 'Close' : 'Read the full story'}
            </button>
          </>
        )}
      </motion.div>
    </Block>
  );
}

/* 3 ─ Meet the characters. Large artwork takes the screen as each one scrolls in. */
export function MeetCharacters({ universe }: { universe: Universe }) {
  if (!universe.characters.length) {
    return (
      <Block id="characters" index={3} label="Meet the characters">
        <p className="max-w-[60ch] text-sm leading-relaxed opacity-60">
          [PLACEHOLDER] No characters supplied for this universe yet. Each one needs a name, alias, tagline, bio,
          power, role and artwork.
        </p>
      </Block>
    );
  }

  return (
    <Block id="characters" index={3} label="Meet the characters">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {universe.characters.map((character) => (
          <motion.li
            key={character.name}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={rise}
            className="group/char flex flex-col border"
            style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
          >
            <div className="relative aspect-3/4 overflow-hidden">
              <Image
                src={character.image}
                alt={character.name}
                fill
                sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 94vw"
                className="object-cover transition-transform duration-700 group-hover/char:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, var(--u-ink), transparent 55%)' }}
              />

              {character.alias && (
                <span
                  className="absolute left-3 top-3 border px-2 py-1 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
                  style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
                >
                  {character.alias}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-3.5 lg:p-5">
              <UniverseHeading as="h3" className="text-xl lg:text-2xl">
                {character.name}
              </UniverseHeading>

              <p className="mt-3 flex-1 text-xs leading-relaxed opacity-70 sm:text-sm">{character.copy}</p>

              <dl
                className="mt-5 grid grid-cols-2 gap-3 border-t pt-3 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
                style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
              >
                <div>
                  <dt className="opacity-50">Role</dt>
                  <dd className="mt-1.5">{character.role}</dd>
                </div>
                {character.power && (
                  <div>
                    <dt className="opacity-50">Power</dt>
                    <dd className="mt-1.5">{character.power}</dd>
                  </div>
                )}
              </dl>
            </div>
          </motion.li>
        ))}
      </ul>
    </Block>
  );
}

/* 4 ─ Gallery. Click to enlarge, arrows to move through. */
export function Gallery({ universe }: { universe: Universe }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const images = universe.gallery.images;
  const open = openIndex === null ? null : images[openIndex];

  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? null : (i + delta + images.length) % images.length));

  return (
    <Block id="gallery" index={4} label="Gallery">
      <UniverseHeading className="text-[clamp(1.5rem,3.5vw,3rem)]">{universe.gallery.title}</UniverseHeading>

      {universe.gallery.note && (
        <p className="mt-3 max-w-[70ch] text-xs leading-relaxed opacity-50 sm:text-sm">{universe.gallery.note}</p>
      )}

      <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <motion.li
            key={image.src}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={rise}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group/shot relative block aspect-4/5 w-full overflow-hidden border focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"
              style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
            >
              <Image
                src={image.src}
                alt={image.caption}
                fill
                sizes="(min-width: 1024px) 23vw, 46vw"
                className="object-cover transition-transform duration-700 group-hover/shot:scale-105"
              />
              <span
                className="absolute inset-x-0 bottom-0 p-2 text-left font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
                style={{ background: 'linear-gradient(to top, var(--u-ink), transparent)' }}
              >
                {image.caption}
              </span>
            </button>
          </motion.li>
        ))}
      </ul>

      {/* Lightbox */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption}
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-3 backdrop-blur-sm lg:p-8"
          onClick={() => setOpenIndex(null)}
        >
          <div className="flex items-center justify-between font-heading text-[11px] uppercase tracking-widest text-white">
            <span>{open.caption}</span>
            <button type="button" onClick={() => setOpenIndex(null)} aria-label="Close" className="p-2">
              <FiX aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            <Image src={open.src} alt={open.caption} fill sizes="100vw" className="object-contain" />
          </div>

          <div
            className="flex items-center justify-center gap-6 pt-3 font-heading text-[11px] uppercase tracking-widest text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => step(-1)} className="px-3 py-2">
              ← Prev
            </button>
            <span className="opacity-50">
              {(openIndex ?? 0) + 1} / {images.length}
            </span>
            <button type="button" onClick={() => step(1)} className="px-3 py-2">
              Next →
            </button>
          </div>
        </div>
      )}
    </Block>
  );
}

/* 5 ─ Kickstarter stats. Figures come from spec section 8. */
export function CampaignStats({ universe }: { universe: Universe }) {
  return (
    <Block id="campaign" index={5} label="Kickstarter stats">
      <ul className="grid gap-3 lg:grid-cols-2">
        {universe.campaign.map((issue) => (
          <motion.li
            key={issue.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={rise}
            className="border p-3.5 lg:p-6"
            style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
          >
            <UniverseHeading as="h3" className="text-xl lg:text-2xl">
              {issue.title}
            </UniverseHeading>

            {issue.raised ? (
              <>
                <dl className="mt-6 grid grid-cols-2 gap-6 font-heading uppercase sm:grid-cols-4">
                  <div>
                    <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Raised</dt>
                    <dd className="mt-2 text-xl lg:text-2xl" style={{ color: 'var(--u-accent)' }}>
                      {issue.raised}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Backers</dt>
                    <dd className="mt-2 text-xl lg:text-2xl">
                      <RollingNumber value={issue.backers ?? 0} delay={150} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Funded</dt>
                    <dd className="mt-2 text-xl lg:text-2xl">
                      <RollingNumber value={issue.funded ?? 0} suffix="%" delay={150} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Goal</dt>
                    <dd className="mt-2 text-xl lg:text-2xl">{issue.goal}</dd>
                  </div>
                </dl>

                {/* Funding bar, capped at full while the real number stays on show */}
                <div
                  className="relative mt-6 h-1.5"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
                >
                  <motion.span
                    aria-hidden="true"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 1.2, ease, delay: 0.2 }}
                    style={{ width: '100%', originX: 0, backgroundColor: 'var(--u-accent)' }}
                    className="absolute inset-y-0 left-0"
                  />
                </div>

                <p className="mt-4 font-heading text-[10px] uppercase tracking-widest opacity-50 sm:text-[11px]">
                  {issue.ran}
                </p>
              </>
            ) : (
              <p className="mt-6 font-heading text-[11px] uppercase tracking-widest opacity-60 sm:text-[13px]">
                {issue.status}
              </p>
            )}
          </motion.li>
        ))}
      </ul>
    </Block>
  );
}

/* 6 ─ Face of the comic: the creator or collaborator behind this universe. */
export function FaceOfTheComic({ universe }: { universe: Universe }) {
  const face = universe.face;

  return (
    <Block id="face" index={6} label="Face of the comic">
      {face ? (
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={rise}
          className="grid gap-3 border lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
          style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}
        >
          <div className="relative aspect-4/5 overflow-hidden max-lg:aspect-4/3">
            <Image
              src={face.image}
              alt={face.name}
              fill
              sizes="(min-width: 1024px) 38vw, 94vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center p-3.5 lg:p-8">
            <span
              className="self-start border px-2 py-1 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
              style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
            >
              {face.tag}
            </span>

            <UniverseHeading as="h3" className="mt-6 text-[clamp(1.75rem,3.5vw,3rem)]">
              {face.name}
            </UniverseHeading>

            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed opacity-70">{face.bio}</p>

            <a
              href={face.href}
              target="_blank"
              rel="noreferrer"
              className="mt-8 self-start border px-3 py-2 font-heading text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70 sm:text-[11px]"
              style={{ borderColor: 'var(--u-accent)' }}
            >
              [ View profile ]
            </a>
          </div>
        </motion.div>
      ) : (
        <p className="max-w-[60ch] text-sm leading-relaxed opacity-60">
          [PLACEHOLDER] No creator, artist or collaborator confirmed for this universe yet. Needs a name,
          photo or video, a short bio, a profile link and their approval.
        </p>
      )}
    </Block>
  );
}

/* 7 ─ Kickstarter CTA. Button wording follows the campaign-state logic in spec section 5. */
export function CampaignCta({ universe }: { universe: Universe }) {
  return (
    <section id="back" className="scroll-mt-14 px-3 py-20 lg:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={rise}
        className="border p-3.5 lg:p-10"
        style={{ borderColor: 'var(--u-accent)' }}
      >
        <BlockLabel index={7}>Back the campaign</BlockLabel>

        <UniverseHeading className="mt-8 max-w-[24ch] text-[clamp(1.75rem,4.5vw,4rem)]">
          {universe.cta.headline}
        </UniverseHeading>

        <div className="mt-10 flex flex-wrap gap-3">
          {universe.cta.buttons.map((button) => (
            <a
              key={button.label}
              href={button.href}
              target="_blank"
              rel="noreferrer"
              className="border px-5 py-3 font-heading text-[11px] uppercase tracking-widest transition-colors sm:text-[13px]"
              style={{ borderColor: 'var(--u-accent)', backgroundColor: 'var(--u-accent)', color: 'var(--u-ink)' }}
            >
              [ {button.label} ]
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* 8 ─ Email signup, tagged per universe so the list knows which world it came from. */
export function EmailSignup({ universe }: { universe: Universe }) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  return (
    <Block id="signup" index={8} label="Email signup">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <UniverseHeading className="max-w-[18ch] text-[clamp(1.5rem,3.5vw,3rem)]">
          {universe.signup.line}
        </UniverseHeading>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: post to the list with tag `${universe.slug}` once the admin panel exists
            setJoined(true);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Email address"
            className="min-w-0 flex-1 border bg-transparent px-3 py-3 font-heading text-[11px] uppercase tracking-widest placeholder:opacity-50 focus-visible:outline focus-visible:outline-1 sm:text-[13px]"
            style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 25%, transparent)' }}
          />
          <button
            type="submit"
            className="border px-6 py-3 font-heading text-[11px] uppercase tracking-widest sm:text-[13px]"
            style={{ borderColor: 'var(--u-accent)', backgroundColor: 'var(--u-accent)', color: 'var(--u-ink)' }}
          >
            {joined ? 'Joined' : 'Join'}
          </button>
        </form>
      </div>

      <p aria-live="polite" className="sr-only">
        {joined ? 'Thanks — you are on the list.' : ''}
      </p>
    </Block>
  );
}

/** Design direction from the spec, kept on the page while the bespoke motion is built. */
export function ProductionNotes({ universe }: { universe: Universe }) {
  const notes = [
    { label: 'Type', value: universe.direction.type },
    { label: 'Motion', value: universe.direction.motion },
    { label: 'Cursor / sound', value: universe.direction.cursor },
    { label: 'Character reveal', value: universe.direction.reveal },
    { label: 'Gallery', value: universe.direction.gallery },
  ];

  return (
    <section className="px-3 pb-20">
      <details className="border" style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)' }}>
        <summary className="cursor-pointer p-3.5 font-heading text-[10px] uppercase tracking-widest opacity-60 sm:text-[11px]">
          Design direction from the spec — not yet built
        </summary>
        <dl className="grid gap-5 p-3.5 pt-0 lg:grid-cols-2">
          {notes.map((note) => (
            <div key={note.label}>
              <dt className="font-heading text-[10px] uppercase tracking-widest opacity-50 sm:text-[11px]">
                {note.label}
              </dt>
              <dd className="mt-1.5 text-xs leading-relaxed opacity-70 sm:text-sm">{note.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

/** Sticky in-page menu (spec section 2 note, and conflict 13). */
export function JumpMenu({ universe }: { universe: Universe }) {
  const links = [
    { label: 'Story', href: '#story' },
    { label: 'Characters', href: '#characters' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Campaign', href: '#campaign' },
    { label: 'Back it', href: '#back' },
  ];

  return (
    <nav
      aria-label={`${universe.name} sections`}
      className="sticky top-10 z-30 border-y backdrop-blur-sm"
      style={{
        borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--u-ink) 85%, transparent)',
      }}
    >
      <Marquee className="md:hidden" speed={24} fadeEdges={false}>
        {links.map((link) => (
          <a key={link.label} href={link.href} className="px-3 py-3 font-heading text-[10px] uppercase tracking-widest">
            {link.label}
          </a>
        ))}
      </Marquee>

      <ul className="hidden gap-8 px-3 py-3 font-heading text-[10px] uppercase tracking-widest md:flex sm:text-[11px]">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="transition-opacity hover:opacity-60">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
