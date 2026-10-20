import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { testimonialCreateSchema, testimonialQuerySchema } from '@/lib/testimonials/schema';
import { toTestimonialDTO } from '@/lib/testimonials/serialize';

/* TODO: auth. Every route here is open for now. */

/** GET /api/backer-testimonials?published=true&limit=4 */
export async function GET(request: NextRequest) {
  const query = testimonialQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return failure(firstIssue(query.error), 400, z.flattenError(query.error).fieldErrors);

  const { published, limit } = query.data;

  try {
    const testimonials = await prisma.backerTestimonial.findMany({
      where: published === undefined ? {} : { published },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return success(testimonials.map(toTestimonialDTO), `${testimonials.length} testimonial(s) found`);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/backer-testimonials */
export async function POST(request: NextRequest) {
  try {
    const body = testimonialCreateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const testimonial = await prisma.backerTestimonial.create({ data: body.data });
    return success(toTestimonialDTO(testimonial), 'Testimonial created', 201);
  } catch (error) {
    return handleError(error);
  }
}
