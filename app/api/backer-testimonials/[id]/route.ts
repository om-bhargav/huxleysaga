import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { testimonialUpdateSchema } from '@/lib/testimonials/schema';
import { toTestimonialDTO } from '@/lib/testimonials/serialize';

/* TODO: auth. Every route here is open for now. */

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Testimonial not found';

/** GET /api/backer-testimonials/:id */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const testimonial = await prisma.backerTestimonial.findUnique({ where: { id } });
    if (!testimonial) return failure(NOT_FOUND, 404);
    return success(toTestimonialDTO(testimonial), 'Testimonial found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** PATCH /api/backer-testimonials/:id with any subset of the fields */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const body = testimonialUpdateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const testimonial = await prisma.backerTestimonial.update({ where: { id }, data: body.data });
    return success(toTestimonialDTO(testimonial), 'Testimonial updated');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** DELETE /api/backer-testimonials/:id */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const testimonial = await prisma.backerTestimonial.delete({ where: { id } });
    return success({ id: testimonial.id }, 'Testimonial deleted');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
