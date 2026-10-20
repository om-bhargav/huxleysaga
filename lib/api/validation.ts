import type { z } from 'zod';

/** "title: Title is required" style summary of the first problem */
export const firstIssue = (error: z.ZodError) => {
  const issue = error.issues[0];
  return issue ? `${issue.path.join('.') || 'Body'}: ${issue.message}` : 'Invalid request';
};
