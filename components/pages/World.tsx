'use client';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { Divider } from '@/components/shared/Divider'; // adjust path
import { FrameButton } from '@/components/shared/FrameButton'; // adjust path
import {
  CharactersSection,
  characterNameClass,
  type ShowcaseCharacter,
} from '@/components/shared/CharactersSection'; // adjust path
import { displayFont } from '@/fonts/universes'; // adjust path
import type { Issue, Universe } from '@/config/universes'; // adjust path
import { displayFontClass, worlds, type World } from '@/config/worlds'; // adjust path
import { socialLinks } from '@/config/links'; // adjust path
import UniverseCard from '@/components/universes/UniverseCard';
import { PageError, PageLoader } from '@/components/shared/PageStatus';
import { useUniverses, useWorldUniverses } from '@/hooks/useUniverses';
import type { UniverseSummary } from '@/lib/universes/types';
import LoadedImage from '../shared/LoadedImage';
import { useState } from 'react';

/* [PLACEHOLDER] Shop and Kickstarter URLs are still open items in the spec */
const SHOP_URL = '#';
const KICKSTARTER_URL = '#';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const pad = (n: number) => String(n).padStart(2, '0');
const linkFor = (label: string) => socialLinks.find((l) => l.label === label)?.href ?? '#';
const isPlaceholder = (text?: string) => !text || text.startsWith('[PLACEHOLDER]');
/* '$10,895' → 10895 */
const toNumber = (money?: string) => Number(money?.replace(/[^0-9.]/g, '')) || 0;

/**
 * One world (/universes/[world]): its hero, its comics, every character from those
 * comics, the world's Kickstarter record, the other worlds, and a closing call to action.
 * Only this world's data is shown.
 *
 * The world itself (name, line, face) comes from config/worlds; its comics, characters and
 * campaigns from /api/worlds/:slug, and the other worlds' comic names from /api/universes.
 */
export default function WorldPage({ world }: { world: World }) {
  const { comics, error: comicsError, isLoading: comicsLoading, refresh: refreshComics } = useWorldUniverses(world.slug);
  const { universes, error: universesError, isLoading: universesLoading, refresh: refreshUniverses } = useUniverses();

  const error = comicsError ?? universesError;
  if (error) {
    return (
      <PageError
        title={`Couldn't load ${world.label}`}
        message={error.message}
        onRetry={() => {
          void refreshComics();
          void refreshUniverses();
        }}
      />
    );
  }

  if (comicsLoading || universesLoading) return <PageLoader label={`Loading ${world.label}`} />;

  const lead = comics[0];
  if (!lead) return <PageError title={world.label} message="No comics in this world yet." />;

  return (
    <div className="relative z-10 grid gap-8 bg-background md:gap-20">
      <WorldHero world={world} comics={comics} lead={lead} />
      <Comics world={world} comics={comics} />
      <Characters world={world} comics={comics} lead={lead} />
      <KickstarterJourney world={world} comics={comics} />
      <OtherWorlds current={world} universes={universes} />
    </div>
  );
}

/* ---------- Hero: the lead comic's art behind the world's name ---------- */

function WorldHero({ world, comics, lead }: { world: World; comics: Universe[]; lead: Universe }) {
  const index = worlds.findIndex((w) => w.slug === world.slug);
  const [posterReady, setPosterReady] = useState(false);

  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden px-3 pb-10 pt-24 uppercase text-white">
      {/* Zooms out only once the poster is actually there; LoadedImage fades it in */}
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: posterReady ? 1 : 1.15 }}
        transition={{ duration: 1.6, ease }}
        className="absolute inset-0"
      >
        <LoadedImage
          src={world.image}
          alt=""
          fill
          priority
          sizes="100vw"
          fadeMs={900}
          onReady={() => setPosterReady(true)}
          className="object-cover"
        />
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, var(--background) 8%, transparent 75%)' }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative grid w-full gap-6 lg:grid-cols-2 lg:items-end"
      >
        <div>
          <motion.p variants={rise} className="flex items-center gap-2 text-[10px] tracking-widest text-white/60 sm:text-[11px]">
            <span aria-hidden="true" className="size-1.5" style={{ background: lead.palette.accent }} />
            World {pad(index + 1)} / {pad(worlds.length)} · {pad(comics.length)} {comics.length === 1 ? 'comic' : 'comics'}
          </motion.p>
          <motion.h1
            variants={rise}
            className="mt-4 text-[clamp(3.5rem,12vw,11rem)] leading-[0.85]"
            style={{ fontFamily: displayFont[world.display], color: lead.palette.paper }}
          >
            {world.label}
          </motion.h1>
        </div>
        <motion.p variants={rise} className="max-w-md text-sm leading-relaxed text-white/70 lg:justify-self-end">
          {world.line}
        </motion.p>
      </motion.div>
    </section>
  );
}
/* ---------- The comics in this world ---------- */

function Comics({ world, comics }: { world: World; comics: Universe[] }) {
  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro title="The Comics" text={`Every story set in ${world.label}.`} titleClassName={displayFontClass[world.display]} />
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
        className={`mt-12 grid gap-3 ${comics.length > 1 ? 'lg:grid-cols-2' : ''}`}
      >
        {comics.map((universe, i) => (
          <UniverseCard
            key={universe.slug}
            universe={universe}
            direction={i % 2 === 0 ? 'left-right' : 'right-left'}
          />
        ))}
      </motion.ul>
    </section>
  );
}

/* ---------- Every character from this world's comics ---------- */

function Characters({ world, comics, lead }: { world: World; comics: Universe[]; lead: Universe }) {
  // "Appears in" only matters when the world holds more than one comic
  const multiple = comics.length > 1;

  const characters: ShowcaseCharacter[] = comics.flatMap((universe) =>
    universe.characters
      .filter((c) => !isPlaceholder(c.name))
      .map((c) => ({
        name: c.name,
        alias: c.alias,
        description: c.copy,
        images: c.images,
        stats: [
          ...(multiple ? [{ label: 'Appears in', value: universe.name }] : []),
          { label: 'Role', value: c.role },
          ...(c.power && !isPlaceholder(c.power) ? [{ label: 'Power', value: c.power }] : []),
        ],
      })),
  );

  if (!characters.length) return null;
  const font = displayFont[world.display];

  return (
    <section className="px-3">
      <div className="font-heading uppercase">
        <SectionIntro title="Characters" text={`The faces of ${world.label}.`} />
      </div>

      <div className="mt-12">
        <CharactersSection
          characters={characters}
          colors={{ ink: lead.palette.ink, paper: lead.palette.paper, accent: lead.palette.accent }}
          renderName={(c) => (
            <h3 className={characterNameClass} style={{ fontFamily: font }}>
              {c.name}
            </h3>
          )}
        />
      </div>

      {/* Each comic's page has the full character reveal */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-white">
        {comics.map((u) => (
          <li key={u.slug}>
            <Link
              href={`/${u.slug}#characters`}
              className="opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            >
              Meet them in {u.name} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- This world's Kickstarter record ---------- */

function KickstarterJourney({ world, comics }: { world: World; comics: Universe[] }) {
  const issues = comics.flatMap((universe) => universe.campaign.map((issue) => ({ issue, universe })));
  if (!issues.length) return null;

  const funded = issues.filter(({ issue }) => issue.raised);
  const totals = [
    {
      label: 'Raised',
      value: `$${funded.reduce((sum, { issue }) => sum + toNumber(issue.raised), 0).toLocaleString('en-US')}`,
    },
    { label: 'Backers', count: funded.reduce((sum, { issue }) => sum + (issue.backers ?? 0), 0) },
    { label: 'Issues funded', count: funded.length },
    { label: 'On the way', count: issues.length - funded.length },
  ];

  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro
        title="Kickstarter Journey"
        text={`How the backers brought ${world.label} to life.`}
      />

      {/* World totals, worked out from each comic's campaigns */}
      <motion.dl
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
        className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {totals.map((stat) => (
          <motion.div
            key={stat.label}
            variants={rise}
            className="border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6"
          >
            <dt className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">{stat.label}</dt>
            <dd className="mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-none">
              {stat.count !== undefined ? <RollingNumber value={stat.count} delay={200} /> : stat.value}
            </dd>
          </motion.div>
        ))}
      </motion.dl>

      {/* One card per issue: funded ones with their figures, upcoming ones with their status */}
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {issues.map(({ issue, universe }) => (
          <motion.li key={`${universe.slug}-${issue.title}`} variants={rise}>
            <IssueCard issue={issue} universe={universe} />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function IssueCard({ issue, universe }: { issue: Issue; universe: Universe }) {
  return (
    <Link
      href={`/${universe.slug}`}
      className={`flex h-full flex-col border border-white/10 bg-neutral-950 p-3.5 text-white transition-colors hover:border-white/30 lg:p-6 ${issue.raised ? '' : 'opacity-70'}`}
    >
      <span aria-hidden="true" className="h-1 w-10" style={{ background: universe.palette.accent }} />
      <span className="mt-4 text-[10px] tracking-widest text-white/40 sm:text-[11px]">{universe.name}</span>
      <span className="mt-2 text-xl leading-tight" style={{ fontFamily: displayFont[universe.display] }}>
        {issue.title}
      </span>

      {issue.raised ? (
        <>
          <span className="mt-8 text-[clamp(1.75rem,3vw,2.5rem)] leading-none">{issue.raised}</span>
          {issue.goal && (
            <span className="mt-1.5 text-[10px] tracking-widest text-white/40 sm:text-[11px]">
              raised · {issue.goal} goal
            </span>
          )}

          <span className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[11px] tracking-widest">
            <span>
              <span className="block text-white/40">Backers</span>
              <span className="mt-1.5 block">
                {issue.backers !== undefined ? <RollingNumber value={issue.backers} delay={200} /> : '—'}
              </span>
            </span>
            <span>
              <span className="block text-white/40">Funded</span>
              <span className="mt-1.5 block">
                {issue.funded !== undefined ? (
                  <>
                    <RollingNumber value={issue.funded} delay={200} />%
                  </>
                ) : (
                  '—'
                )}
              </span>
            </span>
          </span>
        </>
      ) : (
        <span className="mt-8 text-[11px] leading-relaxed tracking-widest text-white/60">
          {isPlaceholder(issue.status) ? 'Coming soon' : issue.status}
        </span>
      )}

      {issue.ran && (
        <span className="mt-auto pt-6 text-[10px] tracking-widest text-white/40 sm:text-[11px]">{issue.ran}</span>
      )}
    </Link>
  );
}

/* ---------- Links to the other worlds ---------- */

function OtherWorlds({ current, universes }: { current: World; universes: UniverseSummary[] }) {
  const others = worlds.filter((w) => w.slug !== current.slug);
  if (!others.length) return null;

  return (
    <section className="px-3 uppercase pb-10">
      <Divider />
      <p className="mt-3 text-[10px] tracking-widest text-white/40 sm:text-[11px]">Other worlds</p>
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {others.map((world) => (
          <motion.li key={world.slug} variants={rise}>
            <Link
              href={`/universes/${world.slug}`}
              className="group flex h-full flex-col border border-white/10 bg-neutral-950 p-3.5 text-white transition-colors hover:border-white/30 lg:p-6"
            >
              <span className="flex items-center justify-between text-[10px] tracking-widest text-white/40 sm:text-[11px]">
                <span>{pad(worlds.indexOf(world) + 1)}</span>
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
              <span
                className="mt-6 text-[clamp(1.5rem,3vw,2.5rem)] leading-none"
                style={{ fontFamily: displayFont[world.display] }}
              >
                {world.label}
              </span>
              <span className="mt-auto pt-6 text-[10px] leading-relaxed tracking-widest text-white/50 sm:text-[11px]">
                {universes
                  .filter((u) => u.worldSlug === world.slug)
                  .map((u) => u.name)
                  .join(' · ')}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
