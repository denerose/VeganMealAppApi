import type { PrismaClient } from '@prisma/client';
import type { User, UserId, UserRepository } from '@/domain/user/user.repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId, tenantId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        userId: id,
        tenantId,
      },
    });

    if (!user) {
      return null;
    }

    return this.mapToUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.mapToUser(user);
  }

  async findAdminsByTenant(tenantId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isTenantAdmin: true,
      },
    });

    return users.map(this.mapToUser);
  }

  async isUserAdmin(userId: UserId, tenantId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        userId,
        tenantId,
      },
      select: {
        isTenantAdmin: true,
      },
    });

    return user?.isTenantAdmin ?? false;
  }

  private mapToUser(dbUser: any): User {
    return {
      id: dbUser.userId,
      email: dbUser.email,
      nickname: dbUser.nickname,
      isTenantAdmin: dbUser.isTenantAdmin,
      tenantId: dbUser.tenantId,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }
}
