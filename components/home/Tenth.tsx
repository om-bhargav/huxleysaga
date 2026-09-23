'use client';

import { motion } from 'framer-motion';
import { ProductCard, type Product } from '@/components/products/ProductCard'; // adjust path

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/600/750`;

/* Placeholder copy: replace with your real product descriptions */
const products: Product[] = [
  {
    title: 'Huxley Graphic Novel',
    description:
      'All six issues of the original saga collected in one volume. Two scavengers dig up an ancient atomic machine and are pulled into a fight for survival on a world run by AI, with sketches, storyboards and creator commentary at the back.',
    editions: [
      { name: 'Hardcover', image: cover('huxley-hardcover'), pages: 240, href: '/shop/huxley-hardcover' },
      { name: 'Softcover', image: cover('huxley-softcover'), pages: 240, href: '/shop/huxley-softcover' },
    ],
  },
  {
    title: 'Huxley Deluxe Edition',
    description:
      'A numbered run of 500 copies in a printed slipcase with red foil details, packaged with a signed art print from the creator.',
    editions: [
      { name: 'Deluxe', image: cover('huxley-deluxe'), pages: 240, href: '/shop/huxley-deluxe', soldOut: true },
    ],
  },
  {
    title: 'The Oracle',
    description:
      'The next chapter of the saga returns to a scorched planet ruled by machine emperors and their cloned enforcers, where one soldier uncovers a conspiracy that could bring the empire down.',
    editions: [
      { name: 'Hardcover', image: cover('oracle-hardcover'), pages: 160, href: '/shop/oracle-hardcover' },
      { name: 'Deluxe', image: cover('oracle-deluxe'), pages: 160, href: '/shop/oracle-deluxe' },
      { name: 'Softcover', image: cover('oracle-softcover'), pages: 160, href: '/shop/oracle-softcover' },
    ],
  },
];

export default function ProductsSection() {
  return (
    <section className="bg-black px-3 py-3">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        {products.map((product) => (
          <ProductCard key={product.title} product={product} />
        ))}
      </motion.div>
    </section>
  );
}