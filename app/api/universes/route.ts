import { handleError, success } from '@/lib/api/response';
import { listUniverses } from '@/lib/universes/queries';

/** GET /api/universes: public. One card per published comic, in config/worlds order. */
export async function GET() {
  try {
    const universes = await listUniverses();
    return success(universes, `${universes.length} universe(s) found`);
  } catch (error) {
    return handleError(error);
  }
}
