import jwt from 'jsonwebtoken';

const getEnv = (key: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export type JwtPayload = {
  userId: string;
  tenantId: string;
  email: string;
};

/**
 * Service for generating JWT authentication tokens.
 * Tokens expire after 24 hours and include userId, tenantId, and email.
 */
export class JWTGenerator {
  private readonly secret: string;
  private readonly expiresIn = '24h'; // 24 hours per specification

  constructor() {
    this.secret = getEnv('JWT_SECRET');
  }

  /**
   * Generates a JWT token with user information.
   * @param payload - User information to include in token (userId, tenantId, email)
   * @returns Promise resolving to the signed JWT token
   */
  generate(payload: JwtPayload): Promise<string> {
    return Promise.resolve(
      jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
      })
    );
  }
}
