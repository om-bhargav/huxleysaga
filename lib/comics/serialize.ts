import { Prisma, type Comic, type ComicGalleryImage } from '@/lib/generated/prisma/client';
import type { z } from 'zod';
import type { comicCreateSchema } from './schema';
import type { ComicCta, ComicDTO, ComicDirection, ComicFace, ComicHero, ComicPalette, ComicStory } from './types';

/** Pass to findMany/create/update so gallery images and link counts come back with the comic */
export const comicInclude = {
  galleryImages: { orderBy: { sortOrder: 'asc' } },
  _count: { select: { characters: true, campaigns: true } },
} as const satisfies Prisma.ComicInclude;

type ComicWithRelations = Comic & {
  galleryImages: ComicGalleryImage[];
  _count: { characters: number; campaigns: number };
};

/* The JSON columns were validated by lib/comics/schema on the way in */
export const toComicDTO = (comic: ComicWithRelations): ComicDTO => ({
  id: comic.id,
  slug: comic.slug,
  name: comic.name,
  overline: comic.overline,
  shortName: comic.shortName,
  genre: comic.genre,
  hook: comic.hook,
  worldSlug: comic.worldSlug,
  display: comic.display,
  palette: comic.palette as ComicPalette,
  direction: comic.direction as ComicDirection,
  hero: comic.hero as ComicHero,
  story: comic.story as ComicStory,
  gallery: {
    title: comic.galleryTitle,
    note: comic.galleryNote,
    images: comic.galleryImages.map(({ src, caption }) => ({ src, caption })),
  },
  face: (comic.face as ComicFace | null) ?? null,
  cta: comic.cta as ComicCta,
  signup: { line: comic.signupLine },
  published: comic.published,
  sortOrder: comic.sortOrder,
  counts: comic._count,
  createdAt: comic.createdAt.toISOString(),
  updatedAt: comic.updatedAt.toISOString(),
});

type ParsedComic = Partial<z.infer<typeof comicCreateSchema>>;

/** Validated API body → Prisma columns. Only the fields that were sent; gallery images are handled by the caller. */
export const toComicData = (input: ParsedComic) => {
  const { gallery, signup, face, ...rest } = input;
  return {
    ...rest,
    ...(gallery && { galleryTitle: gallery.title, galleryNote: gallery.note ?? null }),
    ...(signup && { signupLine: signup.line }),
    /* Prisma wants DbNull, not null, to clear a JSON column */
    ...(face !== undefined && { face: face ?? Prisma.DbNull }),
  };
};

/** Gallery images in the order sent, ready for a nested create */
export const galleryCreate = (images: { src: string; caption: string }[]) =>
  images.map((image, sortOrder) => ({ ...image, sortOrder }));
