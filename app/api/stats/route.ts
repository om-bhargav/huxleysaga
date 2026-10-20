import { handleError, success } from '@/lib/api/response';
import { getStudioStats } from '@/lib/stats/queries';

/** GET /api/stats: public studio totals (raised, backers, funded/upcoming/live issues) */
export async function GET() {
  try {
    return success(await getStudioStats(), 'Studio stats');
  } catch (error) {
    return handleError(error);
  }
}
