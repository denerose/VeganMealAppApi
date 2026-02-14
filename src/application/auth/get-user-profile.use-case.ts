import type { PrismaClient } from '@prisma/client';
import type { UserRepository } from '@/domain/user/user.repository';

export type GetUserProfileRequest = {
  userId: string;
  tenantId: string;
};

export type GetUserProfileResponse = {
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
 * T085: GetUserProfileUseCase to retrieve user profile information.
 * Retrieves the authenticated user's profile including tenant information.
 */
export class GetUserProfileUseCase {
  constructor(
    private prisma: PrismaClient,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    // Find user by ID and tenant ID (ensures tenant isolation)
    const user = await this.userRepository.findById(request.userId, request.tenantId);

    if (!user) {
      throw new Error('User not found');
    }

    // Get tenant information
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: request.tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      tenantId: user.tenantId,
      tenantName: tenant.name,
      isTenantAdmin: user.isTenantAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
