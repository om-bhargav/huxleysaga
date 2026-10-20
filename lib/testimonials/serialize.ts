import type { BackerTestimonial } from '@/lib/generated/prisma/client';
import type { TestimonialDTO } from './types';

export const toTestimonialDTO = (testimonial: BackerTestimonial): TestimonialDTO => ({
  ...testimonial,
  createdAt: testimonial.createdAt.toISOString(),
  updatedAt: testimonial.updatedAt.toISOString(),
});
