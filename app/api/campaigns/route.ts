import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { campaignCreateSchema, campaignQuerySchema } from '@/lib/campaigns/schema';
import { toCampaignDTO } from '@/lib/campaigns/serialize';

/* TODO: auth. Every route here is open for now. */

/** GET /api/campaigns?status=LIVE,UPCOMING&universe=venom-vixens&limit=6 */
export async function GET(request: NextRequest) {
  const query = campaignQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return failure(firstIssue(query.error), 400, z.flattenError(query.error).fieldErrors);

  const { status, universe, limit } = query.data;

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(status && { status: { in: status } }),
        ...(universe && { universeSlug: universe }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return success(campaigns.map(toCampaignDTO), `${campaigns.length} campaign(s) found`);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/campaigns */
export async function POST(request: NextRequest) {
  try {
    const body = campaignCreateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const campaign = await prisma.campaign.create({ data: body.data });
    return success(toCampaignDTO(campaign), 'Campaign created', 201);
  } catch (error) {
    return handleError(error, { badReference: "That comic doesn't exist" });
  }
}
