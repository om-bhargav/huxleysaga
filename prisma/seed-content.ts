/**
 * Seeds comics, characters and campaigns from config/universes.ts and config/worlds.ts.
 *
 *   pnpm db:seed:content      everything below, in order
 *   pnpm db:seed:campaigns    campaigns only (comics must already be seeded)
 *
 * Or pick parts: npx tsx prisma/seed-content.ts comics characters campaigns
 *
 * Backer testimonials and contact requests are left alone (prisma/seed.ts does the full reset).
 * Safe to run again: nothing is deleted, so campaigns keep their comic links.
 *
 *   Universe            → Comic, matched by slug and updated in place. Its gallery images are replaced.
 *                         Placed in its world from config/worlds (worlds themselves only live in config).
 *   Universe.characters → Character, matched by name. Same name in two comics = one character in both (Kat).
 *                         Its comic links are set to exactly the comics it appears in.
 *   Universe.campaign   → Campaign, matched by title within its comic. Issues with figures are FUNDED
 *                         (LIVE if still running), the rest UPCOMING.
 *
 * Comics, characters and campaigns added in the admin, and not in the config, are kept as they are.
 */
import 'dotenv/config';
import { universes, type Issue, type Universe } from '@/config/universes';
import { worlds } from '@/config/worlds';
import type { CampaignStatus } from '@/lib/campaigns/types';
import { comicCreateSchema } from '@/lib/comics/schema';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

/* ---------- Comics ---------- */

const worldOf = (slug: string) => worlds.find((w) => w.comics.includes(slug));

/** Order within its world (config/worlds order), unassigned comics after */
const comicOrder = (u: Universe) => {
  const world = worldOf(u.slug);
  return world ? world.comics.indexOf(u.slug) : universes.indexOf(u);
};

/** Creates the comic, or updates the one with the same slug. Returns true when it was new. */
async function seedComic(u: Universe) {
  /* Same validation the API uses, so whatever's seeded can be edited in the admin as-is */
  const { gallery, signup, face, direction, ...rest } = comicCreateSchema.parse({
    slug: u.slug,
    name: u.name,
    overline: u.overline ?? null,
    shortName: u.shortName,
    genre: u.genre,
    hook: u.hook,
    worldSlug: worldOf(u.slug)?.slug ?? null,
    display: u.display,
    palette: u.palette,
    direction: u.direction,
    hero: u.hero,
    story: u.story,
    gallery: { title: u.gallery.title, note: u.gallery.note ?? null, images: u.gallery.images },
    face: u.face,
    cta: u.cta,
    signup: u.signup,
    published: true,
    sortOrder: comicOrder(u),
  });

  const data = {
    ...rest,
    direction: direction ?? { type: '', motion: '', cursor: '', reveal: '', gallery: '' },
    /* Prisma wants DbNull, not null, for an empty JSON column */
    face: face ?? Prisma.DbNull,
    signupLine: signup.line,
    galleryTitle: gallery.title,
    galleryNote: gallery.note ?? null,
  };
  const images = (gallery.images ?? []).map((image, sortOrder) => ({ ...image, sortOrder }));

  const existed = await prisma.comic.findUnique({ where: { slug: u.slug }, select: { id: true } });
  await prisma.comic.upsert({
    where: { slug: u.slug },
    create: { ...data, galleryImages: { create: images } },
    update: { ...data, galleryImages: { deleteMany: {}, create: images } },
  });
  return !existed;
}

/* ---------- Characters ---------- */

type MergedCharacter = Universe['characters'][number] & { comics: string[]; sortOrder: number };

/** One entry per character name, listing every comic it appears in. The first appearance supplies the details. */
const mergeCharacters = () => {
  const byName = new Map<string, MergedCharacter>();
  for (const u of universes) {
    u.characters.forEach((c, i) => {
      const seen = byName.get(c.name);
      if (seen) {
        seen.comics.push(u.slug);
        /* Fill gaps from the later appearance, e.g. Kat's "Cargo #07" alias from The Silk Sting */
        seen.alias ??= c.alias;
        seen.power ??= c.power;
        /* Keep every picture of them, first appearance's first */
        seen.images = [...new Set([...seen.images, ...c.images])];
      } else {
        byName.set(c.name, { ...c, images: [...c.images], comics: [u.slug], sortOrder: i });
      }
    });
  }
  return [...byName.values()];
};

/** Creates the character, or updates the one with the same name. Returns true when it was new. */
async function seedCharacter(c: MergedCharacter) {
  const data = {
    name: c.name,
    alias: c.alias ?? null,
    copy: c.copy,
    power: c.power ?? null,
    role: c.role,
    images: c.images,
    sortOrder: c.sortOrder,
  };
  const links = c.comics.map((comicSlug) => ({ comicSlug }));

  const existing = await prisma.character.findFirst({ where: { name: c.name }, select: { id: true } });
  if (existing) {
    await prisma.character.update({
      where: { id: existing.id },
      data: { ...data, comics: { deleteMany: {}, create: links } },
    });
    return false;
  }

  await prisma.character.create({ data: { ...data, comics: { create: links } } });
  return true;
}

/* ---------- Campaigns ---------- */

/** '$10,895' → 10895, undefined → 0 */
const money = (value?: string) => (value ? Number(value.replace(/[^0-9.]/g, '')) : 0);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** 'Mon D' + year → UTC date */
const day = (text: string, year: number) => {
  const [mon, d] = text.trim().split(/\s+/);
  return new Date(Date.UTC(year, MONTHS.indexOf(mon.slice(0, 3).toLowerCase()), Number(d)));
};

/** 'Aug 14 – Sep 14, 2026' → start and end dates. A start month after the end month is the year before. */
const parseRan = (ran?: string) => {
  const match = ran?.match(/^(.+?)\s*[–-]\s*(.+?),\s*(\d{4})$/);
  if (!match) return { startsAt: null, endsAt: null };
  const year = Number(match[3]);
  const endsAt = day(match[2], year);
  let startsAt = day(match[1], year);
  if (startsAt > endsAt) startsAt = day(match[1], year - 1);
  return { startsAt, endsAt };
};

/** Creates the issue's campaign, or updates the one with the same title in the same comic. Returns true when it was new. */
async function seedCampaign(u: Universe, issue: Issue, sortOrder: number) {
  const { startsAt, endsAt } = parseRan(issue.ran);
  const raised = money(issue.raised);
  const status: CampaignStatus = raised > 0 ? (endsAt && endsAt > new Date() ? 'LIVE' : 'FUNDED') : 'UPCOMING';
  const button = u.cta.buttons[0] ?? { label: 'Follow on Kickstarter', href: '#' };

  const data = {
    title: issue.title,
    /* Issues have no blurb of their own: upcoming ones use their status line, funded ones the comic's hook */
    description: issue.status ?? u.hook,
    image: u.hero.poster,
    status,
    raised,
    /* Upcoming issues have no goal yet; 0 shows as 0% funded until one is set in the admin */
    goal: money(issue.goal),
    backers: issue.backers ?? 0,
    startsAt,
    endsAt,
    buttonLabel: button.label,
    buttonHref: button.href,
    universeSlug: u.slug,
    sortOrder,
  };

  const existing = await prisma.campaign.findFirst({
    where: { title: issue.title, universeSlug: u.slug },
    select: { id: true },
  });
  if (existing) {
    await prisma.campaign.update({ where: { id: existing.id }, data });
    return false;
  }

  await prisma.campaign.create({ data });
  return true;
}

/** Every universe's issues. Comics missing from the database are skipped, since a campaign links to one. */
async function seedCampaigns() {
  const seeded = new Set(
    (await prisma.comic.findMany({ where: { slug: { in: universes.map((u) => u.slug) } }, select: { slug: true } })).map(
      (c) => c.slug,
    ),
  );

  let created = 0;
  let updated = 0;
  const skipped: string[] = [];
  for (const u of universes) {
    if (!seeded.has(u.slug)) {
      if (u.campaign.length) skipped.push(u.slug);
      continue;
    }
    for (const [i, issue] of u.campaign.entries()) {
      if (await seedCampaign(u, issue, i)) created++;
      else updated++;
    }
  }

  console.log(`Campaigns: ${created} created, ${updated} updated`);
  if (skipped.length) console.log(`Skipped campaigns for comics not in the database yet: ${skipped.join(', ')}`);
}

/* ---------- Run ---------- */

const PARTS = ['comics', 'characters', 'campaigns'] as const;
type Part = (typeof PARTS)[number];

/** Parts named on the command line, or all of them */
const pickParts = (args: string[]): Part[] => {
  const unknown = args.filter((a) => !PARTS.includes(a as Part));
  if (unknown.length) throw new Error(`Unknown part(s): ${unknown.join(', ')}. Use any of: ${PARTS.join(', ')}`);
  return args.length ? PARTS.filter((p) => args.includes(p)) : [...PARTS];
};

async function main() {
  const parts = pickParts(process.argv.slice(2));

  /* Open the connection up front: a hosted database can take a few seconds to wake up */
  await prisma.$connect();
  console.log(`Seeding: ${parts.join(', ')}`);

  /* Comics first: characters and campaigns link to them by slug */
  if (parts.includes('comics')) {
    let newComics = 0;
    for (const u of universes) if (await seedComic(u)) newComics++;
    console.log(`Comics: ${newComics} created, ${universes.length - newComics} updated`);

    const unplaced = universes.filter((u) => !worldOf(u.slug)).map((u) => u.slug);
    if (unplaced.length) console.log(`Not in a world (config/worlds): ${unplaced.join(', ')}`);
  }

  if (parts.includes('characters')) {
    const merged = mergeCharacters();
    let newCharacters = 0;
    for (const c of merged) if (await seedCharacter(c)) newCharacters++;
    console.log(`Characters: ${newCharacters} created, ${merged.length - newCharacters} updated`);

    const shared = merged.filter((c) => c.comics.length > 1).map((c) => `${c.name} (${c.comics.join(', ')})`);
    if (shared.length) console.log(`In more than one comic: ${shared.join('; ')}`);
  }

  if (parts.includes('campaigns')) await seedCampaigns();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
