import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { comicUpdateSchema } from '@/lib/comics/schema';
import { comicInclude, galleryCreate, toComicData, toComicDTO } from '@/lib/comics/serialize';

/* TODO: auth. Every route here is open for now. */

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Comic not found';

/** `:id` can be the comic's id or its slug, e.g. /api/comics/venom-vixens */
const findId = async (idOrSlug: string) =>
  (await prisma.comic.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, select: { id: true } }))?.id;

/** GET /api/comics/:idOrSlug */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const comic = await prisma.comic.findFirst({ where: { OR: [{ id }, { slug: id }] }, include: comicInclude });
    if (!comic) return failure(NOT_FOUND, 404);
    return success(toComicDTO(comic), 'Comic found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** PATCH /api/comics/:idOrSlug with any subset. `gallery.images`, when sent, replaces the whole list. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id: idOrSlug } = await params;
  try {
    const body = comicUpdateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const id = await findId(idOrSlug);
    if (!id) return failure(NOT_FOUND, 404);

    const images = body.data.gallery?.images;
    const comic = await prisma.comic.update({
      where: { id },
      data: {
        ...toComicData(body.data),
        ...(images && { galleryImages: { deleteMany: {}, create: galleryCreate(images) } }),
      },
      include: comicInclude,
    });
    return success(toComicDTO(comic), 'Comic updated');
  } catch (error) {
    return handleError(error, { notFound: NOT_FOUND, conflict: 'A comic with this slug already exists' });
  }
}

/** DELETE /api/comics/:idOrSlug. Its characters lose the link (they aren't deleted); its campaigns are unlinked. */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id: idOrSlug } = await params;
  try {
    const id = await findId(idOrSlug);
    if (!id) return failure(NOT_FOUND, 404);

    const comic = await prisma.comic.delete({ where: { id } });
    return success({ id: comic.id }, 'Comic deleted');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
