import FeatureSection from '@/components/shared/FeatureSection'; // adjust path

export default function BooksSection() {
  return (
    <FeatureSection
      image="https://picsum.photos/seed/huxley-books/1920/1080"
      title="Books"
      /* Placeholder copy: swap in your real text */
      description="Long after humanity's fall, ancient machines, renegade AI and the last survivors of civilization clash over lost technology. The books are built on deep lore, mythic history and bold, cinematic art."
      button={{ label: 'Shop all', href: '/shop' }}
    />
  );
}