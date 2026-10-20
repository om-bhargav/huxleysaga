/* Campaign shapes shared by the API and the browser. Mirrors the Campaign model in prisma/schema.prisma. */

export const CAMPAIGN_STATUSES = ['DRAFT', 'UPCOMING', 'LIVE', 'FUNDED', 'ENDED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** A campaign as the API returns it: dates as ISO strings, plus worked-out `funded` and `daysLeft` */
export type CampaignDTO = {
  id: string;
  title: string;
  description: string;
  image: string;
  status: CampaignStatus;
  raised: number;
  goal: number;
  backers: number;
  /** Percent of the goal reached, e.g. 545 */
  funded: number;
  /** Whole days until `endsAt`, 0 once it has passed, null when there is no end date */
  daysLeft: number | null;
  startsAt: string | null;
  endsAt: string | null;
  buttonLabel: string;
  buttonHref: string;
  universeSlug: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Body for POST /api/campaigns. PATCH takes any subset of it. */
export type CampaignInput = {
  title: string;
  description: string;
  image: string;
  status?: CampaignStatus;
  raised?: number;
  goal: number;
  backers?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  buttonLabel: string;
  buttonHref: string;
  universeSlug?: string | null;
  sortOrder?: number;
};
