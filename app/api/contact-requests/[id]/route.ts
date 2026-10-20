import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { contactUpdateSchema } from '@/lib/contact/schema';
import { toContactRequestDTO } from '@/lib/contact/serialize';

/* TODO: auth. Admin only once login lands. */

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = 'Contact request not found';

/** GET /api/contact-requests/:id */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const found = await prisma.contactRequest.findUnique({ where: { id } });
    if (!found) return failure(NOT_FOUND, 404);
    return success(toContactRequestDTO(found), 'Contact request found');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** PATCH /api/contact-requests/:id with { status }. What visitors wrote isn't editable. */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const body = contactUpdateSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const updated = await prisma.contactRequest.update({ where: { id }, data: body.data });
    return success(toContactRequestDTO(updated), `Marked as ${body.data.status.toLowerCase()}`);
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}

/** DELETE /api/contact-requests/:id */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const deleted = await prisma.contactRequest.delete({ where: { id } });
    return success({ id: deleted.id }, 'Contact request deleted');
  } catch (error) {
    return handleError(error, NOT_FOUND);
  }
}
