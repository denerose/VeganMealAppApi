import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';
import { RateLimiterService } from '@/infrastructure/auth/rate-limiting/rate-limiter.service';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

const rateLimiterService = new RateLimiterService();

/**
 * Extracts IP address from request headers or connection.
 * @param request - HTTP request object
 * @returns IP address string
 */
const extractIpAddress = (request: Request): string => {
  // Try to get IP from X-Forwarded-For header (for proxies)
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Try to get IP from X-Real-IP header
  const realIp = request.headers.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in production, this should be handled by reverse proxy)
  return 'unknown';
};

/**
 * Rate limiting middleware using RateLimiterService.
 * Enforces rate limits (3 attempts per 10 minutes per IP) for authentication endpoints.
 */
export const createRateLimitMiddleware = (
  type: 'login' | 'passwordReset' | 'registration'
): HttpMiddleware => {
  return async (context: HttpContext): Promise<HttpContext> => {
    const ip = extractIpAddress(context.request);

    // Check rate limit
    const allowed = await rateLimiterService.checkLimit(ip, type);

    if (!allowed) {
      const timeUntilReset = await rateLimiterService.getTimeUntilReset(ip, type);
      throw new Response(
        JSON.stringify(
          createErrorBody(
            `Too many attempts. Please try again in ${Math.ceil(timeUntilReset / 60)} minutes.`
          )
        ),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': timeUntilReset.toString(),
          },
        }
      );
    }

    return context;
  };
};
