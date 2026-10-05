import { UniverseTheme } from '../universes/UniverseTheme';
import { AboutStory, CampaignCta, CampaignStats, EmailSignup, FaceOfTheComic, Gallery, IntroVideo, JumpMenu, MeetCharacters, ProductionNotes } from '../universe';
import type { Universe as UniverseData } from '@/config/universes';

/** The 8-block universe template from specification section 5, in order. */
export default function Universe({ universe }: { universe: UniverseData }) {
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
