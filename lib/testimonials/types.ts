/* Backer testimonial shapes shared by the API and the browser. Mirrors BackerTestimonial in prisma/schema.prisma. */

export type TestimonialDTO = {
  id: string;
  quote: string;
  name: string;
  /** Shown as "Backed <campaign>" */
  campaign: string;
  image: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Body for POST /api/backer-testimonials. PATCH takes any subset. */
export type TestimonialInput = {
  quote: string;
  name: string;
  campaign: string;
  image?: string | null;
  published?: boolean;
  sortOrder?: number;
};
