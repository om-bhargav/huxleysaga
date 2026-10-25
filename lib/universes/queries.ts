import type { Issue } from '@/config/universes';
import { worlds } from '@/config/worlds';
import type { ComicCta, ComicDirection, ComicFace, ComicHero, ComicPalette, ComicStory } from '@/lib/comics/types';
import { formatMoney } from '@/lib/format';
import type { Campaign, Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { UniverseDTO, UniverseSummary } from './types';

/* Only published comics reach the public site, and draft campaigns stay out of them */

/** Worlds in config/worlds order, unassigned comics after */
const worldRank = (slug: string | null) => {
  const index = worlds.findIndex((w) => w.slug === slug);
  return index === -1 ? worlds.length : index;
};

/** Published comics as cards, grouped by world and in each world's sort order */
export async function listUniverses(): Promise<UniverseSummary[]> {
  const comics = await prisma.comic.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      slug: true,
      name: true,
      overline: true,
      shortName: true,
      genre: true,
      hook: true,
      display: true,
      palette: true,
      hero: true,
      worldSlug: true,
    },
  });

  return comics
    .map((c) => ({
      ...c,
      overline: c.overline ?? undefined,
      palette: c.palette as ComicPalette,
      hero: { poster: (c.hero as ComicHero).poster },
    }))
    .sort((a, b) => worldRank(a.worldSlug) - worldRank(b.worldSlug));
}

/** Just what the page's <title> and description need, or null when there's no such published comic */
export const getUniverseMeta = (slug: string) =>
  prisma.comic.findFirst({ where: { slug, published: true }, select: { name: true, overline: true, hook: true } });

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const yearOf = (date: Date) => date.getUTCFullYear();

/** Start and end dates → 'Aug 14 – Sep 14, 2026', the way config/universes writes them */
const formatRan = (startsAt: Date | null, endsAt: Date | null) => {
  if (!startsAt || !endsAt) return undefined;
  const start = dateFormat.format(startsAt) + (yearOf(startsAt) === yearOf(endsAt) ? '' : `, ${yearOf(startsAt)}`);
  return `${start} – ${dateFormat.format(endsAt)}, ${yearOf(endsAt)}`;
};

/** A campaign → an issue card. One that has raised money shows its figures; the rest show their description. */
const toIssue = (c: Campaign): Issue =>
  c.raised > 0
    ? {
        title: c.title,
        raised: formatMoney(c.raised),
        backers: c.backers,
        goal: formatMoney(c.goal),
        funded: c.goal > 0 ? Math.round((c.raised / c.goal) * 100) : 0,
        ran: formatRan(c.startsAt, c.endsAt),
      }
    : { title: c.title, status: c.description };

/** Pass to findFirst/findMany so a comic comes back with everything its page shows */
const universeInclude = {
  galleryImages: { orderBy: { sortOrder: 'asc' } },
  characters: {
    orderBy: [{ character: { sortOrder: 'asc' } }, { character: { createdAt: 'asc' } }],
    include: { character: true },
  },
  campaigns: {
    where: { status: { not: 'DRAFT' } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  },
} as const satisfies Prisma.ComicInclude;

type ComicWithPage = Prisma.ComicGetPayload<{ include: typeof universeInclude }>;

/* The JSON columns were validated by lib/comics/schema on the way in */
const toUniverse = (comic: ComicWithPage): UniverseDTO => ({
  slug: comic.slug,
  name: comic.name,
  overline: comic.overline ?? undefined,
  shortName: comic.shortName,
  genre: comic.genre,
  hook: comic.hook,
  palette: comic.palette as ComicPalette,
  display: comic.display,
  direction: comic.direction as ComicDirection,
  hero: comic.hero as ComicHero,
  story: comic.story as ComicStory,
  characters: comic.characters.map(({ character: c }) => ({
    name: c.name,
    alias: c.alias ?? undefined,
    copy: c.copy,
    power: c.power ?? undefined,
    role: c.role,
    images: c.images,
  })),
  gallery: {
    title: comic.galleryTitle,
    note: comic.galleryNote ?? undefined,
    images: comic.galleryImages.map(({ src, caption }) => ({ src, caption })),
  },
  campaign: comic.campaigns.map(toIssue),
  face: (comic.face as ComicFace | null) ?? null,
  cta: comic.cta as ComicCta,
  signup: { line: comic.signupLine },
});

/** One published comic in the shape of config/universes' Universe, or null when there's none */
export async function getUniverse(slug: string): Promise<UniverseDTO | null> {
  const comic = await prisma.comic.findFirst({ where: { slug, published: true }, include: universeInclude });
  return comic ? toUniverse(comic) : null;
}

/** Every published comic in a world (a slug from config/worlds), in the world's sort order */
export async function getWorldUniverses(worldSlug: string): Promise<UniverseDTO[]> {
  const comics = await prisma.comic.findMany({
    where: { worldSlug, published: true },
    include: universeInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return comics.map(toUniverse);
}
