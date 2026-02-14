import type { PrismaClient } from '@prisma/client';
import type { AuthRepository, CreateTenantAndUserParams } from '@/domain/auth/auth.repository';
import type { User } from '@/domain/user/user.repository';
import type { PasswordResetToken } from '@/domain/auth/password-reset-token.entity';
import { createPasswordResetToken, isTokenValid } from '@/domain/auth/password-reset-token.entity';

/**
 * Prisma implementation of AuthRepository.
 * Handles password reset token operations.
 */
export class PrismaAuthRepository implements AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async createTenantAndUser(
    params: CreateTenantAndUserParams
  ): Promise<{ tenant: { id: string; name: string }; user: User }> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: params.tenantName },
      });
      const user = await tx.user.create({
        data: {
          email: params.email,
          nickname: params.nickname,
          passwordHash: params.passwordHash,
          tenantId: tenant.id,
          isTenantAdmin: true,
        },
      });
      return {
        tenant: { id: tenant.id, name: tenant.name },
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          isTenantAdmin: user.isTenantAdmin,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    });
  }

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
