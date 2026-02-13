import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';

export const authMiddleware: HttpMiddleware = (context: HttpContext): Promise<HttpContext> => {
  // TODO: Replace placeholder with JWT validation and user lookup logic.
  return Promise.resolve(context);
};
