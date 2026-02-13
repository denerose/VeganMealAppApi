import type { PrismaClient } from '@prisma/client';
import type { UserRepository } from '@/domain/user/user.repository';
import { NicknameValidator } from '@/infrastructure/auth/profile/nickname-validator';

export type UpdateUserProfileRequest = {
  userId: string;
  tenantId: string;
  nickname: string;
  email?: string; // Optional, but if provided, should be rejected (T087: email immutability)
};

export type UpdateUserProfileResponse = {
  id: string;
  email: string;
  nickname: string;
  tenantId: string;
  tenantName: string;
  isTenantAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * T086: UpdateUserProfileUseCase for nickname updates only.
 * T087: Email immutability check - prevents email changes per FR-027.
 */
export class UpdateUserProfileUseCase {
  constructor(
    private prisma: PrismaClient,
    private userRepository: UserRepository
  ) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    // T087: Implement email immutability check (prevent email changes per FR-027)
    if (request.email !== undefined) {
      throw new Error('Email cannot be changed');
    }

    // Validate nickname
    const nicknameValidation = NicknameValidator.validate(request.nickname);
    if (!nicknameValidation.isValid) {
      throw new Error(nicknameValidation.error);
    }

    // Find user by ID and tenant ID (ensures tenant isolation)
    const user = await this.userRepository.findById(request.userId, request.tenantId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update user nickname
    const updatedUser = await this.prisma.user.update({
      where: { id: request.userId },
      data: { nickname: request.nickname },
    });

    // Get tenant information
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: request.tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      tenantId: updatedUser.tenantId,
      tenantName: tenant.name,
      isTenantAdmin: updatedUser.isTenantAdmin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
