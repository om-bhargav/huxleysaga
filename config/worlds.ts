import { universes, type Universe } from '@/config/universes'; // adjust path

/**
 * The worlds the comics live in. Each comic (a Universe in config/universes)
 * belongs to one world, and each world has one display face from fonts/universes.
 * `slug` is the anchor on /universes, e.g. /universes#spy-files.
 */
export type World = {
  slug: string;
  label: string;
  /** One line under the world's name. Drafted from the story copy; edit freely. */
  line: string;
  display: Universe['display'];
  /** Cover art for the world, from /public */
  image: string;
  /** Universe slugs, in the order they should appear */
  comics: string[];
};

export const worlds: World[] = [
  {
    slug: 'spy-files',
    label: 'Spy Files',
    line: 'Undercover agents, secret facilities and missions where nothing is ever quite what it seems.',
    display: 'stencil',
    image: '/characters/agent-scarlett/1.png',
    comics: ['agent-scarlett', 'silk-sting'],
  },
  {
    slug: 'wild-west',
    label: 'Wild West',
    line: 'Five outlaws, a cursed bottle and the lawless town of Dusthaven.',
    display: 'western',
    image: '/characters/vipress/1.png',
    comics: ['venom-vixens'],
  },
  {
    slug: 'game-world',
    label: 'Game World',
    line: 'A digital labyrinth that learns from every move, where death is never the end.',
    display: 'astroz',
    image: '/characters/kat/4.png', // TODO: swap for Game World art
    comics: ['boundless-loop'],
  },
  {
    slug: 'fantasy-land',
    label: 'Fantasy Land',
    line: "Heroes of legend, chained into a witch duo's tournament.",
    display: 'morris',
    image: '/characters/Dracona/1.png', // TODO: swap for Fantasy Land art
    comics: ['chains-of-fate'],
  },
];

/** Each world's image by slug, e.g. worldImages['spy-files'] */
export const worldImages: Record<string, string> = Object.fromEntries(
  worlds.map((world) => [world.slug, world.image]),
);

/** The world for a /universes/[world] path, or undefined */
export const getWorld = (slug: string): World | undefined => worlds.find((world) => world.slug === slug);

/** The comics in a world, in the world's order */
export const comicsIn = (world: World): Universe[] =>
  world.comics.flatMap((slug) => universes.find((u) => u.slug === slug) ?? []);

/** Comics not placed in any world yet (e.g. The Living Library) */
export const unassignedComics: Universe[] = universes.filter(
  (u) => !worlds.some((world) => world.comics.includes(u.slug)),
);
export const displayFontClass: Record<string, string> = {
  stencil: 'font-[family-name:var(--font-u-stencil),var(--font-nb-architekt),sans-serif]',
  western: 'font-[family-name:var(--font-u-western),var(--font-nb-architekt),sans-serif]',
  astroz: 'font-[family-name:var(--font-u-astroz),var(--font-nb-architekt),sans-serif]',
  morris: 'font-[family-name:var(--font-u-morris),var(--font-nb-architekt),serif]',
  garamond: 'font-[family-name:var(--font-u-garamond),serif]',
};