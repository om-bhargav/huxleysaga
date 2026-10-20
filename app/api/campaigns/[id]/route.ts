import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { campaignUpdateSchema } from '@/lib/campaigns/schema';
import { toCampaignDTO } from '@/lib/campaigns/serialize';

/* TODO: auth. Every route here is open for now. */

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Campaign not found';

/** GET /api/campaigns/:id */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return failure(NOT_FOUND, 404);
    return success(toCampaignDTO(campaign), 'Campaign found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** PATCH /api/campaigns/:id with any subset of the fields */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const body = campaignUpdateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const campaign = await prisma.campaign.update({ where: { id }, data: body.data });
    return success(toCampaignDTO(campaign), 'Campaign updated');
  } catch (error) {
    return handleError(error, { notFound: NOT_FOUND, badReference: "That comic doesn't exist" });
  }
}

/** DELETE /api/campaigns/:id */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const campaign = await prisma.campaign.delete({ where: { id } });
    return success({ id: campaign.id }, 'Campaign deleted');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
