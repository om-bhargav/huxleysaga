import type { ApiResponse } from './types';

/** Thrown for any `success: false` answer, carrying the API's message and data (e.g. field errors) */
export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public status: number,
    public data: T | null = null,
  ) {
    super(message);
  }
}

/**
 * Calls one of our API routes and unwraps `{ success, data, message }`.
 * Resolves with `data` and `message`, throws an ApiError otherwise.
 */
export async function request<T>(url: string, init?: RequestInit): Promise<{ data: T; message: string }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Unexpected response from ${url}`, res.status);
  }

  if (!res.ok || !body.success) throw new ApiError(body.message, res.status, body.data);
  return { data: body.data as T, message: body.message };
}

/** SWR fetcher: the key is the URL, the value is `data` */
export const fetcher = async <T>(url: string) => (await request<T>(url)).data;

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
