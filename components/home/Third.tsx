import FeatureSection from '@/components/shared/FeatureSection'; // adjust path

export default function StorySection() {
  return (
    <FeatureSection
      image="/assets/explore-comics.png"
      title="Explore the comics"
      /* Placeholder copy: swap in your real text */
      description="Six worlds. Hundreds of characters. One universe to explore."
      button={{ label: 'Discover more', href: '/universes' }}
    />
  );
}