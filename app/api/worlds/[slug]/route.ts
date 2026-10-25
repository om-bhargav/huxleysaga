import type { NextRequest } from 'next/server';
import { getWorld } from '@/config/worlds';
import { failure, handleError, success } from '@/lib/api/response';
import { getWorldUniverses } from '@/lib/universes/queries';

type Context = { params: Promise<{ slug: string }> };

/**
 * GET /api/worlds/:slug: public. The world's published comics, each with its characters and campaigns,
 * shaped like config/universes. The worlds themselves (name, line, face) live in config/worlds.
 */
export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!getWorld(slug)) return failure('World not found', 404);

  try {
    const comics = await getWorldUniverses(slug);
    return success(comics, `${comics.length} comic(s) found`);
  } catch (error) {
    return handleError(error);
  }
}
