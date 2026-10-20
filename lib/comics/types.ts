/* Comic shapes shared by the API and the browser. Mirrors Comic in prisma/schema.prisma,
   and follows `Universe` in config/universes so the public pages can swap over without remapping. */

export const COMIC_DISPLAYS = ['stencil', 'western', 'astroz', 'morris', 'garamond'] as const;
export type ComicDisplay = (typeof COMIC_DISPLAYS)[number];

export type ComicPalette = { ink: string; paper: string; accent: string; accentSoft: string };
export type ComicDirection = { type: string; motion: string; cursor: string; reveal: string; gallery: string };
export type ComicHero = { poster: string; videoNote: string; video?: string };
export type ComicStory = { headline: string; text: string; more?: string; image?: string };
export type ComicFace = { name: string; tag: string; bio: string; href: string; image: string };
export type ComicCta = { headline: string; buttons: { label: string; href: string }[] };
export type ComicGalleryImage = { src: string; caption: string };

/** A comic as the API returns it */
export type ComicDTO = {
  id: string;
  slug: string;
  name: string;
  overline: string | null;
  shortName: string;
  genre: string;
  hook: string;
  /** Slug of a world in config/worlds, or null when unassigned */
  worldSlug: string | null;
  display: ComicDisplay;
  palette: ComicPalette;
  direction: ComicDirection;
  hero: ComicHero;
  story: ComicStory;
  gallery: { title: string; note: string | null; images: ComicGalleryImage[] };
  face: ComicFace | null;
  cta: ComicCta;
  signup: { line: string };
  published: boolean;
  sortOrder: number;
  /** How many characters and campaigns link to this comic */
  counts: { characters: number; campaigns: number };
  createdAt: string;
  updatedAt: string;
};

/** Body for POST /api/comics. PATCH takes any subset; `gallery.images` there replaces the whole list. */
export type ComicInput = {
  slug: string;
  name: string;
  overline?: string | null;
  shortName: string;
  genre: string;
  hook: string;
  worldSlug?: string | null;
  display?: ComicDisplay;
  palette: ComicPalette;
  direction?: Partial<ComicDirection>;
  hero: ComicHero;
  story: ComicStory;
  gallery: { title: string; note?: string | null; images?: ComicGalleryImage[] };
  face?: ComicFace | null;
  cta: ComicCta;
  signup: { line: string };
  published?: boolean;
  sortOrder?: number;
};
