import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';

export const tenantIsolationMiddleware: HttpMiddleware = (
  context: HttpContext
): Promise<HttpContext> => {
  // TODO: Inject tenantId from authenticated user metadata once auth is implemented.
  return Promise.resolve(context);
};
