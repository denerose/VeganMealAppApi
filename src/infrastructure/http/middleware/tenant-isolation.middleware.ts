import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';

/**
 * Tenant isolation middleware.
 * T054: Uses tenantId from authenticated context (set by authMiddleware).
 * Ensures tenantId is present in context for multi-tenant data isolation.
 */
export const tenantIsolationMiddleware: HttpMiddleware = (
  context: HttpContext
): Promise<HttpContext> => {
  // T054: TenantId is already set by authMiddleware from JWT token
  // This middleware ensures tenantId is present (authMiddleware must run first)
  if (!context.tenantId) {
    throw new Response(
      JSON.stringify({
        error: {
          message: 'Tenant context required',
        },
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return Promise.resolve(context);
};
