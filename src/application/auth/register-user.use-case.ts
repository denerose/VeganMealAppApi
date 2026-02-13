import type { PrismaClient } from '@prisma/client';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';
import { PasswordValidator } from '@/infrastructure/auth/password/password-validator';
import { EmailValidator } from '@/infrastructure/auth/email/email-validator';
import { NicknameValidator } from '@/infrastructure/auth/profile/nickname-validator';

export type RegisterUserRequest = {
  email: string;
  password: string;
  nickname: string;
  tenantName: string;
};

export type RegisterUserResponse = {
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
 * Use case for registering a new user account.
 * Creates a new user, tenant, and assigns the user as tenant admin.
 * Returns JWT token and user information upon successful registration.
 */
export class RegisterUserUseCase {
  constructor(
    private prisma: PrismaClient,
    private passwordHasher: BcryptPasswordHasher,
    private jwtGenerator: JWTGenerator
  ) {}

  /**
   * Registers a new user with email, password, nickname, and tenant name.
   * @param request - Registration request containing email, password, nickname, and tenantName
   * @returns Registration response with JWT token and user information
   * @throws Error if validation fails, email already exists, or tenant creation fails
   */

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // T025-T027: Validate input
    const emailValidation = EmailValidator.validate(request.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    const passwordValidation = PasswordValidator.validate(request.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    const nicknameValidation = NicknameValidator.validate(request.nickname);
    if (!nicknameValidation.isValid) {
      throw new Error(nicknameValidation.error);
    }

    if (!request.tenantName || request.tenantName.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (request.tenantName.length > 100) {
      throw new Error('Tenant name must be 100 characters or less');
    }

    // Check for duplicate email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: request.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // T028: Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: request.tenantName,
      },
    });

    // T029: Implement password hashing using BcryptPasswordHasher
    const passwordHash = await this.passwordHasher.hash(request.password);

    // Create user with hashed password and assign as tenant admin
    const user = await this.prisma.user.create({
      data: {
        email: request.email,
        nickname: request.nickname,
        passwordHash,
        tenantId: tenant.id,
        isTenantAdmin: true,
      },
    });

    // T030: Implement JWT token generation using JWTGenerator (include userId, tenantId, email)
    const token = await this.jwtGenerator.generate({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        tenantId: tenant.id,
        tenantName: tenant.name,
        isTenantAdmin: user.isTenantAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
