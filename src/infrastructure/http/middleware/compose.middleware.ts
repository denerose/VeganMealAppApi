import type { HttpContext, HttpMiddleware } from './types';
import type { RouteHandler, RouteContext } from '../routes';

/**
 * Composes multiple middleware functions and a route handler.
 * Middleware functions are executed in order, each receiving the context from the previous middleware.
 * The final handler receives the processed context.
 */
export const composeMiddleware = (
  ...middlewares: HttpMiddleware[]
): ((handler: RouteHandler) => RouteHandler) => {
  return (handler: RouteHandler) => {
    return async (context: RouteContext): Promise<Response> => {
      let ctx: HttpContext = {
        request: context.request,
        url: context.url,
        params: context.params,
      };

      // Apply all middleware in sequence
      for (const middleware of middlewares) {
        ctx = await middleware(ctx);
      }

      // Call the handler with the processed context (including userId and tenantId from middleware)
      return handler({
        request: ctx.request,
        url: ctx.url,
        params: context.params, // Preserve original params
        userId: ctx.userId,
        tenantId: ctx.tenantId,
      });
    };
  };
};
