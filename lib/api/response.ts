import { Prisma } from '@/lib/generated/prisma/client';
import type { ApiResponse } from './types';

/* Every API route answers with the same shape: { success, data, message } */

export const success = <T>(data: T, message = 'OK', status = 200) =>
  Response.json({ success: true, data, message } satisfies ApiResponse<T>, { status });

export const failure = <T = null>(message: string, status = 400, data: T | null = null) =>
  Response.json({ success: false, data, message } satisfies ApiResponse<T>, { status });

type ErrorMessages = {
  /** P2025: the record to update or delete isn't there */
  notFound?: string;
  /** P2002: a unique field (e.g. a slug) is already taken */
  conflict?: string;
  /** P2003: a link points at something that doesn't exist (e.g. an unknown comic slug) */
  badReference?: string;
};

/** Turns anything a handler throws into a failure response. Pass a string as shorthand for `notFound`. */
export const handleError = (error: unknown, messages: string | ErrorMessages = {}) => {
  const { notFound = 'Not found', conflict = 'Already exists', badReference = 'Linked record not found' } =
    typeof messages === 'string' ? { notFound: messages } : messages;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return failure(notFound, 404);
    if (error.code === 'P2002') return failure(conflict, 409);
    if (error.code === 'P2003') return failure(badReference, 422);
  }
  if (error instanceof SyntaxError) return failure('Request body must be valid JSON', 400);

  console.error(error);
  return failure('Something went wrong', 500);
};
