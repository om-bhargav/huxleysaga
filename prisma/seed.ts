/**
 * Seeds the database from config/universes.ts and config/worlds.ts.
 *
 *   pnpm db:seed    (or: npx prisma db seed --config prisma7.config.ts)
 *
 * Every run starts clean: existing comics, characters, campaigns and backer testimonials
 * are removed first, then everything below is created again.
 *
 * What goes where:
 *   Universe            → Comic (+ ComicGalleryImage), placed in its world from config/worlds
 *   Universe.characters → Character + CharacterComic. Same name in two comics = one character in both (Kat).
 *   Universe.campaign   → Campaign. Issues with figures are FUNDED (LIVE if still running), the rest UPCOMING.
 *   SAMPLE_TESTIMONIALS → BackerTestimonial, two for each funded campaign.
 */
import 'dotenv/config';
import { universes, type Issue, type Universe } from '@/config/universes';
import { worlds } from '@/config/worlds';
import { comicCreateSchema } from '@/lib/comics/schema';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

/* ---------- Helpers ---------- */

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

const worldOf = (slug: string) => worlds.find((w) => w.comics.includes(slug));

/** Order within its world (config/worlds order), unassigned comics after */
const comicOrder = (u: Universe) => {
  const world = worldOf(u.slug);
  return world ? world.comics.indexOf(u.slug) : universes.indexOf(u);
};

/* ---------- Comics ---------- */

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

  await prisma.comic.create({
    data: {
      ...rest,
      direction: direction ?? { type: '', motion: '', cursor: '', reveal: '', gallery: '' },
      face: face ?? Prisma.DbNull,
      signupLine: signup.line,
      galleryTitle: gallery.title,
      galleryNote: gallery.note ?? null,
      galleryImages: { create: (gallery.images ?? []).map((image, sortOrder) => ({ ...image, sortOrder })) },
    },
  });
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
      } else {
        byName.set(c.name, { ...c, comics: [u.slug], sortOrder: i });
      }
    });
  }
  return [...byName.values()];
};

async function seedCharacter(c: MergedCharacter) {
  await prisma.character.create({
    data: {
      name: c.name,
      alias: c.alias ?? null,
      copy: c.copy,
      power: c.power ?? null,
      role: c.role,
      image: c.images[0],
      sortOrder: c.sortOrder,
      comics: { create: c.comics.map((comicSlug) => ({ comicSlug })) },
    },
  });
}

/* ---------- Campaigns ---------- */

async function seedCampaign(u: Universe, issue: Issue, sortOrder: number) {
  const { startsAt, endsAt } = parseRan(issue.ran);
  const raised = money(issue.raised);
  const status = raised > 0 ? (endsAt && endsAt > new Date() ? 'LIVE' : 'FUNDED') : 'UPCOMING';
  const button = u.cta.buttons[0] ?? { label: 'Follow on Kickstarter', href: '#' };

  await prisma.campaign.create({
    data: {
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
    },
  });
}

/* ---------- Backer testimonials ---------- */

/*
 * SAMPLE CONTENT so the "Our backers" section and the admin have something to show.
 * These are not real backers: swap them for real comments (with permission) before launch.
 * Keyed by comic slug; each is credited to that comic's first funded campaign.
 */
const SAMPLE_TESTIMONIALS: Record<string, { quote: string; name: string }[]> = {
  'venom-vixens': [
    { quote: 'The wanted-poster art alone was worth the pledge. Frankie is my new favourite chaos gremlin.', name: 'Sample backer A.' },
    { quote: 'Five outlaws and a cursed bottle. I read it twice the night it arrived.', name: 'Sample backer B.' },
  ],
  'agent-scarlett': [
    { quote: 'Proper spy-thriller pacing. Every page feels like a case file you are not meant to see.', name: 'Sample backer C.' },
    { quote: 'Smooth campaign, clear updates and the print quality is gorgeous.', name: 'Sample backer D.' },
  ],
  'boundless-loop': [
    { quote: 'A game that learns from every move is such a good hook. Already in for Issue #2.', name: 'Sample backer E.' },
    { quote: 'Elara and Luna carry this. The HUD-style panels are a great touch.', name: 'Sample backer F.' },
  ],
  'chains-of-fate': [
    { quote: 'Bold outlines, halftone everything, and Vex steals every scene she is in.', name: 'Sample backer G.' },
    { quote: 'Backed on day one and the tournament set-up kept me hooked to the last page.', name: 'Sample backer H.' },
  ],
};

async function seedTestimonials() {
  let sortOrder = 0;
  for (const u of universes) {
    /* Only an issue that actually ran can have backers */
    const backed = u.campaign.find((issue) => money(issue.raised) > 0);
    const samples = SAMPLE_TESTIMONIALS[u.slug];
    if (!backed || !samples) continue;

    await prisma.backerTestimonial.createMany({
      data: samples.map((t) => ({ ...t, campaign: backed.title, published: true, sortOrder: sortOrder++ })),
    });
  }
  return sortOrder;
}

/* ---------- Run ---------- */

async function main() {
  /* Open the connection up front: a hosted database can take a few seconds to wake up */
  await prisma.$connect();

  /* Start clean. Campaigns and characters go before comics because they point at them.
     Plain deletes in order rather than a transaction, which can time out while a remote database is waking. */
  const testimonials = await prisma.backerTestimonial.deleteMany();
  const campaigns = await prisma.campaign.deleteMany();
  const characters = await prisma.character.deleteMany();
  const comics = await prisma.comic.deleteMany();
  console.log(
    `Removed ${comics.count} comics, ${characters.count} characters, ${campaigns.count} campaigns, ${testimonials.count} testimonials`,
  );

  for (const u of universes) await seedComic(u);

  const merged = mergeCharacters();
  for (const c of merged) await seedCharacter(c);

  let campaignCount = 0;
  for (const u of universes) {
    for (const [i, issue] of u.campaign.entries()) {
      await seedCampaign(u, issue, i);
      campaignCount++;
    }
  }

  const testimonialCount = await seedTestimonials();

  const shared = merged.filter((c) => c.comics.length > 1).map((c) => `${c.name} (${c.comics.join(', ')})`);
  console.log(`Seeded ${universes.length} comics, ${merged.length} characters, ${campaignCount} campaigns, ${testimonialCount} testimonials`);
  if (shared.length) console.log(`In more than one comic: ${shared.join('; ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
