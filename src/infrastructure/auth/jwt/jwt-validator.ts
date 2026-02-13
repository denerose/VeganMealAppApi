import jwt from 'jsonwebtoken';
import type { JwtPayload } from './jwt-generator';

const getEnv = (key: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export type ValidatedToken = {
  userId: string;
  tenantId: string;
  email: string;
  iat: number;
  exp: number;
};

export class JWTValidator {
  private readonly secret: string;

  constructor() {
    this.secret = getEnv('JWT_SECRET');
  }

  /**
   * Validates and decodes a JWT token.
   * @param token - JWT token string to validate
   * @returns Decoded token payload if valid
   * @throws Error if token is invalid, expired, or malformed
   */
  validate(token: string): ValidatedToken {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload & JwtPayload;

      if (!decoded.userId || !decoded.tenantId || !decoded.email) {
        throw new Error('Invalid token: missing required claims');
      }

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        iat: decoded.iat ?? Math.floor(Date.now() / 1000),
        exp: decoded.exp ?? Math.floor(Date.now() / 1000) + 86400, // Default 24h
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }
}
