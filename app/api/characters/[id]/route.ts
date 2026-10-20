import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { characterUpdateSchema } from '@/lib/characters/schema';
import { characterInclude, toCharacterDTO } from '@/lib/characters/serialize';

/* TODO: auth. Every route here is open for now. */

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Character not found';

/** GET /api/characters/:id */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const character = await prisma.character.findUnique({ where: { id }, include: characterInclude });
    if (!character) return failure(NOT_FOUND, 404);
    return success(toCharacterDTO(character), 'Character found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** PATCH /api/characters/:id with any subset. `comics`, when sent, replaces the whole list. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const body = characterUpdateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const { comics, ...data } = body.data;
    const character = await prisma.character.update({
      where: { id },
      data: {
        ...data,
        ...(comics && { comics: { deleteMany: {}, create: comics.map((comicSlug) => ({ comicSlug })) } }),
      },
      include: characterInclude,
    });
    return success(toCharacterDTO(character), 'Character updated');
  } catch (error) {
    return handleError(error, { notFound: NOT_FOUND, badReference: "One of the picked comics doesn't exist" });
  }
}

/** DELETE /api/characters/:id (its comic links go with it) */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const character = await prisma.character.delete({ where: { id } });
    return success({ id: character.id }, 'Character deleted');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
