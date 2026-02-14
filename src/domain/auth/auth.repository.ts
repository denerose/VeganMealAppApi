import type { User, Tenant } from '@/domain/user/user.repository';
import type { PasswordResetToken } from './password-reset-token.entity';

export type CreateTenantAndUserParams = {
  tenantName: string;
  email: string;
  nickname: string;
  passwordHash: string;
};

/**
 * Repository interface for authentication-related data operations.
 * Abstracts database access for authentication domain.
 */
export interface AuthRepository {
  createTenantAndUser(params: CreateTenantAndUserParams): Promise<{ tenant: Tenant; user: User }>;

  /**
   * Creates a password reset token for a user.
   * @param userId - User ID to create token for
   * @param token - Cryptographically random token string
   * @param expiresAt - Expiration timestamp (1 hour from creation)
   * @returns Created PasswordResetToken
   */
  createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<PasswordResetToken>;

  /**
   * Finds a valid password reset token by token string.
   * @param token - Token string to lookup
   * @returns PasswordResetToken if found and valid, null otherwise
   */
  findPasswordResetTokenByToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Marks a password reset token as used.
   * @param tokenId - ID of the token to mark as used
   * @param usedAt - Timestamp when token was used
   */
  markPasswordResetTokenAsUsed(tokenId: string, usedAt: Date): Promise<void>;
}
