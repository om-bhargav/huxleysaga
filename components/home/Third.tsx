import FeatureSection from '@/components/shared/FeatureSection'; // adjust path

export default function StorySection() {
  return (
    <FeatureSection
      image="https://picsum.photos/seed/huxley-story/1920/1080"
      title="Story"
      /* Placeholder copy: swap in your real text */
      description="A thousand years of nuclear war burned a once-living planet to ash. Those who could escaped to the stars and tore down the space elevators and stargates behind them, leaving everyone else, and their endless wars, trapped below..."
      button={{ label: 'Discover more', href: '/story' }}
    />
  );
}