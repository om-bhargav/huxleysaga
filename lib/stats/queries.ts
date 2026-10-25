import { prisma } from '@/lib/prisma';
import type { ComicPalette } from '@/lib/comics/types';
import type { DashboardDTO, StudioStats } from './types';

const PLACEHOLDER = '[PLACEHOLDER]';
const countPlaceholders = (value: unknown) => JSON.stringify(value ?? '').split(PLACEHOLDER).length - 1;

const funded = (raised: number, goal: number) => (goal > 0 ? Math.round((raised / goal) * 100) : 0);

/** Studio totals, from the campaigns table */
export async function getStudioStats(): Promise<StudioStats> {
  const [sums, campaigns, upcomingIssues, liveIssues] = await Promise.all([
    prisma.campaign.aggregate({ _sum: { raised: true, backers: true } }),
    prisma.campaign.findMany({ select: { raised: true, goal: true } }),
    prisma.campaign.count({ where: { status: 'UPCOMING' } }),
    prisma.campaign.count({ where: { status: 'LIVE' } }),
  ]);

  return {
    raised: sums._sum.raised ?? 0,
    backers: sums._sum.backers ?? 0,
    fundedIssues: campaigns.filter((c) => c.raised > 0 && c.raised >= c.goal).length,
    upcomingIssues,
    liveIssues,
  };
}

const comicRef = { id: true, slug: true, name: true, shortName: true, palette: true } as const;

const toComicRef = <T extends { palette: unknown }>(comic: T) => ({ ...comic, palette: comic.palette as ComicPalette });

/** Everything the admin dashboard shows, in one round of queries */
export async function getDashboard(): Promise<DashboardDTO> {
  const [
    stats,
    comics,
    publishedComics,
    characters,
    campaigns,
    testimonials,
    publishedTestimonials,
    newContactRequests,
    topCampaigns,
    recentCharacters,
    recentTestimonials,
  ] = await Promise.all([
    getStudioStats(),
    prisma.comic.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { characters: true } },
        characters: { select: { character: { select: { name: true, alias: true, role: true, copy: true, power: true } } } },
      },
    }),
    prisma.comic.count({ where: { published: true } }),
    prisma.character.count(),
    prisma.campaign.count(),
    prisma.backerTestimonial.count(),
    prisma.backerTestimonial.count({ where: { published: true } }),
    prisma.contactRequest.count({ where: { status: 'NEW' } }),
    prisma.campaign.findMany({
      where: { raised: { gt: 0 } },
      orderBy: { raised: 'desc' },
      take: 6,
      include: { comic: { select: comicRef } },
    }),
    prisma.character.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { comics: { take: 1, select: { comic: { select: comicRef } } } },
    }),
    prisma.backerTestimonial.findMany({ orderBy: { createdAt: 'desc' }, take: 3 }),
  ]);

  const comicsByWorld: DashboardDTO['comicsByWorld'] = {};
  for (const comic of comics) {
    const key = comic.worldSlug ?? 'none';
    (comicsByWorld[key] ??= []).push({
      id: comic.id,
      slug: comic.slug,
      name: comic.name,
      poster: (comic.hero as { poster: string }).poster,
      display: comic.display,
      characters: comic._count.characters,
      published: comic.published,
    });
  }

  const contentGaps = comics
    .map((comic) => {
      const { characters: linked, ...fields } = comic;
      return {
        comic: toComicRef({
          id: comic.id,
          slug: comic.slug,
          name: comic.name,
          shortName: comic.shortName,
          palette: comic.palette,
          genre: comic.genre,
        }),
        placeholders: countPlaceholders(fields) + countPlaceholders(linked),
      };
    })
    .filter((row) => row.placeholders > 0)
    .sort((a, b) => b.placeholders - a.placeholders);

  return {
    stats,
    totals: {
      comics: comics.length,
      publishedComics,
      characters,
      campaigns,
      testimonials,
      publishedTestimonials,
      newContactRequests,
    },
    topCampaigns: topCampaigns.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      raised: c.raised,
      goal: c.goal,
      backers: c.backers,
      funded: funded(c.raised, c.goal),
      comic: c.comic ? toComicRef(c.comic) : null,
    })),
    comicsByWorld,
    contentGaps,
    recentCharacters: recentCharacters.map((c) => ({
      id: c.id,
      name: c.name,
      alias: c.alias,
      image: c.images[0],
      comic: c.comics[0] ? toComicRef(c.comics[0].comic) : null,
    })),
    recentTestimonials: recentTestimonials.map(({ id, quote, name, campaign, published }) => ({
      id,
      quote,
      name,
      campaign,
      published,
    })),
  };
}
