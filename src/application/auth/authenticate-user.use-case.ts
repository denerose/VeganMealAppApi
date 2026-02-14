import type { PasswordHasher } from '@/domain/auth/password-hasher.interface';
import type { TokenGenerator } from '@/domain/auth/token-generator.interface';
import type { UserRepository } from '@/domain/user/user.repository';

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
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    const userWithPassword = await this.userRepository.findByEmailWithPassword(request.email);

    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.passwordHasher.compare(
      request.password,
      userWithPassword.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tenant = await this.userRepository.findTenantById(userWithPassword.user.tenantId);

    if (!tenant) {
      throw new Error('Invalid credentials');
    }

    const token = await this.tokenGenerator.generate({
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
