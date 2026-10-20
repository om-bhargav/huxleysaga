import { z } from 'zod';
import { worlds } from '@/config/worlds';
import { COMIC_DISPLAYS } from './types';

const worldSlugs = worlds.map((w) => w.slug) as [string, ...string[]];

const text = (label: string) => z.string().trim().min(1, `${label} is required`);
/* '' from a cleared input means "not set" */
const blankToUndefined = (v: unknown) => (v === '' ? undefined : v);
const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
const nullableText = z.preprocess((v) => (v === '' ? null : v), z.string().trim().nullable()).optional();
const hex = (label: string) => z.string().regex(/^#[0-9a-f]{6}$/i, `${label} must be a hex colour like #1B1B24`);

/* Comic pages live at /<slug>, so these would clash with real routes in app/ */
const RESERVED_SLUGS = ['about', 'about-us', 'admin', 'api', 'contact', 'universes'];

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only use a-z, 0-9 and single dashes')
  .refine((slug) => !RESERVED_SLUGS.includes(slug), 'That slug is taken by another page on the site');

const paletteSchema = z.object({
  ink: hex('Ink'),
  paper: hex('Paper'),
  accent: hex('Accent'),
  accentSoft: hex('Soft accent'),
});

/* Production notes: all optional, saved as '' when left out */
const directionSchema = z.object({
  type: z.string().trim().default(''),
  motion: z.string().trim().default(''),
  cursor: z.string().trim().default(''),
  reveal: z.string().trim().default(''),
  gallery: z.string().trim().default(''),
});

const heroSchema = z.object({
  poster: text('Hero poster'),
  videoNote: z.string().trim().default(''),
  video: optionalText,
});

const storySchema = z.object({
  headline: text('Story headline'),
  text: text('Story'),
  more: optionalText,
  image: optionalText,
});

const faceSchema = z.object({
  name: text('Collaborator name'),
  tag: text('Collaborator tag'),
  bio: text('Collaborator bio'),
  href: text('Collaborator link'),
  image: text('Collaborator image'),
});

const ctaSchema = z.object({
  headline: text('CTA headline'),
  buttons: z.array(z.object({ label: text('Button label'), href: text('Button link') })).default([]),
});

const gallerySchema = z.object({
  title: text('Gallery title'),
  note: nullableText,
  images: z.array(z.object({ src: text('Image'), caption: z.string().trim().default('') })).optional(),
});

/** POST /api/comics */
export const comicCreateSchema = z.object({
  slug: slugSchema,
  name: text('Name'),
  overline: nullableText,
  shortName: text('Short name'),
  genre: text('Genre'),
  hook: text('Hook'),
  worldSlug: z.enum(worldSlugs, { error: 'Unknown world' }).nullable().optional(),
  display: z.enum(COMIC_DISPLAYS).optional(),
  palette: paletteSchema,
  direction: directionSchema.optional(),
  hero: heroSchema,
  story: storySchema,
  gallery: gallerySchema,
  face: faceSchema.nullable().optional(),
  cta: ctaSchema,
  signup: z.object({ line: text('Signup line') }),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** PATCH /api/comics/[id]: any subset. Groups (palette, hero, …) are replaced whole. */
export const comicUpdateSchema = comicCreateSchema.partial();

/** Query for GET /api/comics, e.g. ?world=spy-files&published=true&q=kat. world=none lists unassigned comics. */
export const comicQuerySchema = z.object({
  world: z.string().optional(),
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  q: z.string().trim().optional(),
});
