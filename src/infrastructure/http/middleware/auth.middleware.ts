import { HttpContext, HttpMiddleware } from '@/infrastructure/http/middleware/types';
import { JWTValidator } from '@/infrastructure/auth/jwt/jwt-validator';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

const jwtValidator = new JWTValidator();

/**
 * Extracts JWT token from Authorization header.
 * @param request - HTTP request object
 * @returns Token string if found, null otherwise
 */
const extractTokenFromHeader = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Authentication middleware that validates JWT tokens and extracts user information.
 * Validates JWT tokens using JWTValidator and extracts userId and tenantId.
 */
export const authMiddleware: HttpMiddleware = (context: HttpContext): Promise<HttpContext> => {
  const token = extractTokenFromHeader(context.request);

  if (!token) {
    return Promise.reject(
      new Response(JSON.stringify(createErrorBody('Authentication required')), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  try {
    const validatedToken = jwtValidator.validate(token);

    return Promise.resolve({
      ...context,
      userId: validatedToken.userId,
      tenantId: validatedToken.tenantId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid token';
    return Promise.reject(
      new Response(JSON.stringify(createErrorBody(errorMessage)), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
};
