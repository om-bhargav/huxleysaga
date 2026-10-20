import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { comicCreateSchema, comicQuerySchema } from '@/lib/comics/schema';
import { Prisma } from '@/lib/generated/prisma/client';
import { comicInclude, galleryCreate, toComicDTO } from '@/lib/comics/serialize';

/* TODO: auth. Every route here is open for now. */

const EMPTY_DIRECTION = { type: '', motion: '', cursor: '', reveal: '', gallery: '' };

/** GET /api/comics?world=spy-files&published=true&q=kat (world=none → comics not in a world) */
export async function GET(request: NextRequest) {
  const query = comicQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return failure(firstIssue(query.error), 400, z.flattenError(query.error).fieldErrors);

  const { world, published, q } = query.data;

  try {
    const comics = await prisma.comic.findMany({
      where: {
        ...(world && { worldSlug: world === 'none' ? null : world }),
        ...(published !== undefined && { published }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { shortName: { contains: q, mode: 'insensitive' } },
            { genre: { contains: q, mode: 'insensitive' } },
            { hook: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      include: comicInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return success(comics.map(toComicDTO), `${comics.length} comic(s) found`);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/comics */
export async function POST(request: NextRequest) {
  try {
    const body = comicCreateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const { direction, gallery, face, signup, ...rest } = body.data;
    const comic = await prisma.comic.create({
      data: {
        ...rest,
        direction: direction ?? EMPTY_DIRECTION,
        /* Prisma wants DbNull, not null, for an empty JSON column */
        face: face ?? Prisma.DbNull,
        signupLine: signup.line,
        galleryTitle: gallery.title,
        galleryNote: gallery.note ?? null,
        galleryImages: { create: galleryCreate(gallery.images ?? []) },
      },
      include: comicInclude,
    });
    return success(toComicDTO(comic), 'Comic created', 201);
  } catch (error) {
    return handleError(error, { conflict: 'A comic with this slug already exists' });
  }
}
