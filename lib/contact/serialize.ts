import type { ContactRequest } from '@/lib/generated/prisma/client';
import type { ContactRequestDTO } from './types';

export const toContactRequestDTO = (request: ContactRequest): ContactRequestDTO => ({
  ...request,
  createdAt: request.createdAt.toISOString(),
  updatedAt: request.updatedAt.toISOString(),
});
