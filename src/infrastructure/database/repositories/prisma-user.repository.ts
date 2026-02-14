import type { PrismaClient, User as PrismaUser } from '@prisma/client';
import type { Tenant, User, UserId, UserRepository } from '@/domain/user/user.repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findTenantById(tenantId: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });
    return tenant;
  }

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

  async findByEmailWithPassword(
    email: string
  ): Promise<{ user: User; passwordHash: string | null } | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nickname: true,
        passwordHash: true,
        isTenantAdmin: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return null;
    }

    return {
      user: this.mapToUser(dbUser),
      passwordHash: dbUser.passwordHash,
    };
  }

  async updatePasswordHash(userId: UserId, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateNickname(userId: UserId, tenantId: string, nickname: string): Promise<User> {
    const user = await this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { nickname },
    });
    if (user.count === 0) {
      throw new Error('User not found');
    }
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!updated) {
      throw new Error('User not found');
    }
    return this.mapToUser(updated);
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
