import type { Campaign } from '@/lib/generated/prisma/client';
import type { CampaignDTO } from './types';

const DAY = 24 * 60 * 60 * 1000;

export const toCampaignDTO = (campaign: Campaign): CampaignDTO => ({
  ...campaign,
  funded: campaign.goal > 0 ? Math.round((campaign.raised / campaign.goal) * 100) : 0,
  daysLeft: campaign.endsAt ? Math.max(0, Math.ceil((campaign.endsAt.getTime() - Date.now()) / DAY)) : null,
  startsAt: campaign.startsAt?.toISOString() ?? null,
  endsAt: campaign.endsAt?.toISOString() ?? null,
  createdAt: campaign.createdAt.toISOString(),
  updatedAt: campaign.updatedAt.toISOString(),
});
