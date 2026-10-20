/* Shared between the API routes and the browser, so nothing server-only goes in here */

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string;
};
