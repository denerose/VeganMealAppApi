import type { PrismaClient } from '@prisma/client';
import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { PasswordResetToken } from '@/domain/auth/password-reset-token.entity';
import { createPasswordResetToken, isTokenValid } from '@/domain/auth/password-reset-token.entity';

/**
 * Prisma implementation of AuthRepository.
 * Handles password reset token operations.
 */
export class PrismaAuthRepository implements AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<PasswordResetToken> {
    const dbToken = await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return createPasswordResetToken(
      dbToken.id,
      dbToken.token,
      dbToken.userId,
      dbToken.expiresAt,
      dbToken.usedAt,
      dbToken.createdAt
    );
  }

  async findPasswordResetTokenByToken(token: string): Promise<PasswordResetToken | null> {
    const dbToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken) {
      return null;
    }

    const resetToken = createPasswordResetToken(
      dbToken.id,
      dbToken.token,
      dbToken.userId,
      dbToken.expiresAt,
      dbToken.usedAt,
      dbToken.createdAt
    );

    // Only return token if it's valid (not expired and not used)
    return isTokenValid(resetToken) ? resetToken : null;
  }

  async markPasswordResetTokenAsUsed(tokenId: string, usedAt: Date): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt },
    });
  }
}
