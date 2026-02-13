import type { PrismaClient, User as PrismaUser } from '@prisma/client';
import type { User, UserId, UserRepository } from '@/domain/user/user.repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId, tenantId: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
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

    return users.map((user: PrismaUser) => this.mapToUser(user));
  }

  async isUserAdmin(userId: UserId, tenantId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: {
        isTenantAdmin: true,
      },
    });

    return user?.isTenantAdmin ?? false;
  }

  private mapToUser(dbUser: PrismaUser): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      nickname: dbUser.nickname,
      isTenantAdmin: dbUser.isTenantAdmin,
      tenantId: dbUser.tenantId,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }
}
