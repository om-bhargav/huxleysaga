import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { contactQuerySchema } from '@/lib/contact/schema';
import { toContactRequestDTO } from '@/lib/contact/serialize';

/* TODO: auth. Admin only once login lands. (Visitors submit through POST /api/contact.) */

/** GET /api/contact-requests?status=NEW,READ&topic=PRESS&q=film, newest first */
export async function GET(request: NextRequest) {
  const query = contactQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return failure(firstIssue(query.error), 400, z.flattenError(query.error).fieldErrors);

  const { status, topic, q } = query.data;

  try {
    const requests = await prisma.contactRequest.findMany({
      where: {
        ...(status && { status: { in: status } }),
        ...(topic && { topic }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(requests.map(toContactRequestDTO), `${requests.length} contact request(s) found`);
  } catch (error) {
    return handleError(error);
  }
}
