import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';

export const authMiddleware: HttpMiddleware = async (context: HttpContext) => {
  // TODO: Replace placeholder with JWT validation and user lookup logic.
  return context;
};
