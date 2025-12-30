import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';

export const tenantIsolationMiddleware: HttpMiddleware = async (
  context: HttpContext,
) => {
  // TODO: Inject tenantId from authenticated user metadata once auth is implemented.
  return context;
};
