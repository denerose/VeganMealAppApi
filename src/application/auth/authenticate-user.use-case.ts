import type { UserRepository } from '@/domain/user/user.repository';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';
import type { PrismaClient } from '@prisma/client';

export type AuthenticateUserRequest = {
  email: string;
  password: string;
};

export type AuthenticateUserResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    tenantId: string;
    tenantName: string;
    isTenantAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

/**
 * Use case for authenticating users with email and password.
 * Returns JWT token and user information upon successful authentication.
 */
export class AuthenticateUserUseCase {
  constructor(
    private prisma: PrismaClient,
    private userRepository: UserRepository,
    private passwordHasher: BcryptPasswordHasher,
    private jwtGenerator: JWTGenerator
  ) {}

  /**
   * Authenticates a user with email and password.
   * @param request - Authentication request containing email and password
   * @returns Authentication response with JWT token and user information
   * @throws Error with generic message if authentication fails (don't reveal if email exists)
   */
  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // Find user by email with password hash
    const userWithPassword = await this.userRepository.findByEmailWithPassword(request.email);

    // Generic error message to prevent user enumeration (don't reveal if email exists)
    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // T043: Verify password using BcryptPasswordHasher.compare()
    const isValidPassword = await this.passwordHasher.compare(
      request.password,
      userWithPassword.passwordHash
    );

    // T044: Generic error message (don't reveal if email exists per FR-014)
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Get tenant information
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: userWithPassword.user.tenantId },
    });

    if (!tenant) {
      throw new Error('Invalid credentials');
    }

    // T045: Generate JWT token using JWTGenerator (24h expiration)
    const token = await this.jwtGenerator.generate({
      userId: userWithPassword.user.id,
      tenantId: userWithPassword.user.tenantId,
      email: userWithPassword.user.email,
    });

    return {
      token,
      user: {
        id: userWithPassword.user.id,
        email: userWithPassword.user.email,
        nickname: userWithPassword.user.nickname,
        tenantId: userWithPassword.user.tenantId,
        tenantName: tenant.name,
        isTenantAdmin: userWithPassword.user.isTenantAdmin,
        createdAt: userWithPassword.user.createdAt,
        updatedAt: userWithPassword.user.updatedAt,
      },
    };
  }
}
