/* Studio and dashboard shapes shared by the API and the browser */

import type { CampaignStatus } from '@/lib/campaigns/types';
import type { ComicDisplay, ComicPalette } from '@/lib/comics/types';

/** GET /api/stats: public studio totals, worked out from the campaigns table */
export type StudioStats = {
  /** Whole dollars across every campaign */
  raised: number;
  backers: number;
  /** Campaigns that reached their goal */
  fundedIssues: number;
  /** Campaigns marked Upcoming */
  upcomingIssues: number;
  liveIssues: number;
};

type ComicRef = { id: string; slug: string; name: string; shortName: string; palette: ComicPalette };

/** GET /api/dashboard: everything the admin overview shows */
export type DashboardDTO = {
  stats: StudioStats;
  totals: {
    comics: number;
    publishedComics: number;
    characters: number;
    campaigns: number;
    testimonials: number;
    publishedTestimonials: number;
    /** Contact requests nobody has opened yet */
    newContactRequests: number;
  };
  /** Biggest campaigns by amount raised */
  topCampaigns: {
    id: string;
    title: string;
    status: CampaignStatus;
    raised: number;
    goal: number;
    backers: number;
    funded: number;
    comic: ComicRef | null;
  }[];
  /** Comics grouped by world slug (config/worlds); "none" holds the unassigned ones */
  comicsByWorld: Record<
    string,
    { id: string; slug: string; name: string; poster: string; display: ComicDisplay; characters: number; published: boolean }[]
  >;
  /** Comics with [PLACEHOLDER] text still in them, most first */
  contentGaps: { comic: ComicRef & { genre: string }; placeholders: number }[];
  recentCharacters: { id: string; name: string; alias: string | null; image: string; comic: ComicRef | null }[];
  recentTestimonials: { id: string; quote: string; name: string; campaign: string; published: boolean }[];
};
