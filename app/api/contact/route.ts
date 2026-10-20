import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { failure, handleError, success } from '@/lib/api/response';
import { firstIssue } from '@/lib/api/validation';
import { contactFormSchema } from '@/lib/contact/schema';

/** POST /api/contact: public, the contact page's form. Lands in the admin under Contact Requests. */
export async function POST(request: NextRequest) {
  try {
    const body = contactFormSchema.safeParse(await request.json());
    if (!body.success) return failure(firstIssue(body.error), 422, z.flattenError(body.error).fieldErrors);

    const { website, ...data } = body.data;

    /* Honeypot filled in: a bot. Answer like it worked so it doesn't try again, but keep nothing. */
    if (website) return success({ id: null }, 'Message received', 201);

    const saved = await prisma.contactRequest.create({ data, select: { id: true } });
    return success({ id: saved.id }, 'Message received', 201);
  } catch (error) {
    return handleError(error);
  }
}
