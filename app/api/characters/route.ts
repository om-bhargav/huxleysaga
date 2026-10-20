import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { characterCreateSchema, characterQuerySchema } from '@/lib/characters/schema';
import { characterInclude, toCharacterDTO } from '@/lib/characters/serialize';

/* TODO: auth. Every route here is open for now. */

/** GET /api/characters?comic=silk-sting&q=kat&limit=20 */
export async function GET(request: NextRequest) {
  const query = characterQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return failure(firstIssue(query.error), 400, z.flattenError(query.error).fieldErrors);

  const { comic, q, limit } = query.data;

  try {
    const characters = await prisma.character.findMany({
      where: {
        ...(comic && { comics: { some: { comicSlug: comic } } }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { alias: { contains: q, mode: 'insensitive' } },
            { role: { contains: q, mode: 'insensitive' } },
            { power: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      include: characterInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });
    return success(characters.map(toCharacterDTO), `${characters.length} character(s) found`);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/characters */
export async function POST(request: NextRequest) {
  try {
    const body = characterCreateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const { comics, ...data } = body.data;
    const character = await prisma.character.create({
      data: { ...data, comics: { create: comics.map((comicSlug) => ({ comicSlug })) } },
      include: characterInclude,
    });
    return success(toCharacterDTO(character), 'Character created', 201);
  } catch (error) {
    return handleError(error, { badReference: "One of the picked comics doesn't exist" });
  }
}
