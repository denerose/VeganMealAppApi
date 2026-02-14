import type { UserRepository } from '@/domain/user/user.repository';
import { NicknameValidator } from '@/infrastructure/auth/profile/nickname-validator';

export type UpdateUserProfileRequest = {
  userId: string;
  tenantId: string;
  nickname: string;
  email?: string;
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
 * UpdateUserProfileUseCase for nickname updates only.
 * Email immutability check - prevents email changes per FR-027.
 */
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    if (request.email !== undefined) {
      throw new Error('Email cannot be changed');
    }

    const nicknameValidation = NicknameValidator.validate(request.nickname);
    if (!nicknameValidation.isValid) {
      throw new Error(nicknameValidation.error);
    }

    const user = await this.userRepository.findById(request.userId, request.tenantId);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.userRepository.updateNickname(
      request.userId,
      request.tenantId,
      request.nickname
    );

    const tenant = await this.userRepository.findTenantById(request.tenantId);

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
