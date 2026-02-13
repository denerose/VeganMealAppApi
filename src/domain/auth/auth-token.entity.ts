/**
 * Domain entity representing a JWT authentication token.
 * Contains user identification and tenant information.
 */
export type AuthToken = {
  userId: string;
  tenantId: string;
  email: string;
  issuedAt: number; // Unix timestamp (iat)
  expiresAt: number; // Unix timestamp (exp)
};

/**
 * Creates an AuthToken domain entity from JWT payload.
 */
export const createAuthToken = (
  userId: string,
  tenantId: string,
  email: string,
  issuedAt: number,
  expiresAt: number
): AuthToken => ({
  userId,
  tenantId,
  email,
  issuedAt,
  expiresAt,
});
