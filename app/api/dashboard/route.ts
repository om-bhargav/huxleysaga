import { handleError, success } from '@/lib/api/response';
import { getDashboard } from '@/lib/stats/queries';

/* TODO: auth. Admin only once login lands. */

/** GET /api/dashboard: the admin overview in one call */
export async function GET() {
  try {
    return success(await getDashboard(), 'Dashboard');
  } catch (error) {
    return handleError(error);
  }
}
