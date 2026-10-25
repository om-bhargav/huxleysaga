import type { NextRequest } from 'next/server';
import { failure, handleError, success } from '@/lib/api/response';
import { getUniverse } from '@/lib/universes/queries';

type Context = { params: Promise<{ slug: string }> };

const NOT_FOUND = 'Universe not found';

/** GET /api/universes/:slug: public. A published comic with its characters and campaigns, shaped like config/universes. */
export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  try {
    const universe = await getUniverse(slug);
    if (!universe) return failure(NOT_FOUND, 404);
    return success(universe, 'Universe found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
