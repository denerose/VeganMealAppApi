import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { PasswordHasher } from '@/domain/auth/password-hasher.interface';
import type { TokenGenerator } from '@/domain/auth/token-generator.interface';
import type { UserRepository } from '@/domain/user/user.repository';
import { EmailValidator } from '@/infrastructure/auth/email/email-validator';
import { NicknameValidator } from '@/infrastructure/auth/profile/nickname-validator';
import { PasswordValidator } from '@/infrastructure/auth/password/password-validator';

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
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
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

    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const { tenant, user } = await this.authRepository.createTenantAndUser({
      tenantName: request.tenantName,
      email: request.email,
      nickname: request.nickname,
      passwordHash,
    });

    const token = await this.tokenGenerator.generate({
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
