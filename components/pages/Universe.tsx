'use client';

import { UniverseTheme } from '../universes/UniverseTheme';
import { AboutStory, CampaignCta, CampaignStats, EmailSignup, FaceOfTheComic, Gallery, IntroVideo, JumpMenu, MeetCharacters, ProductionNotes } from '../universe';
import { PageError, PageLoader } from '@/components/shared/PageStatus';
import { useUniverse } from '@/hooks/useUniverses';
import { ApiError } from '@/lib/api/client';

/** The 8-block universe template from specification section 5, in order. Data comes from /api/universes/:slug. */
export default function Universe({ slug }: { slug: string }) {
  const { universe, error, isLoading, refresh } = useUniverse(slug);

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <PageError title="Universe not found" message="This comic isn't on the site, or has been taken down." />
    ) : (
      <PageError title="Couldn't load this universe" message={error.message} onRetry={() => refresh()} />
    );
  }

  if (isLoading || !universe) return <PageLoader label="Loading universe" />;

  return (
    <UniverseTheme universe={universe}>
      <IntroVideo universe={universe} />
      <div className='grid gap-8 md:gap-20'>
      <JumpMenu universe={universe} />
      <AboutStory universe={universe} />
      <MeetCharacters universe={universe} />
      <Gallery universe={universe} />
      <CampaignStats universe={universe} />
      <FaceOfTheComic universe={universe} />
      <CampaignCta universe={universe} />
      <EmailSignup universe={universe} />
      <ProductionNotes universe={universe} />
      </div>
    </UniverseTheme>
  );
}
