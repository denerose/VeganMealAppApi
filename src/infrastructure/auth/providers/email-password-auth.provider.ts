import type { AuthProvider, AuthResult } from '@/domain/auth/auth-provider.interface';
import type { UserCredentials } from '@/domain/auth/user-credentials.entity';
import type { UserRepository } from '@/domain/user/user.repository';
import type { PrismaClient } from '@prisma/client';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';
import { PasswordValidator } from '@/infrastructure/auth/password/password-validator';
import { EmailValidator } from '@/infrastructure/auth/email/email-validator';
import { NicknameValidator } from '@/infrastructure/auth/profile/nickname-validator';

export type EmailPasswordRegistrationData = {
  email: string;
  password: string;
  nickname: string;
  tenantName: string;
};

/**
 * Email/password authentication provider implementing AuthProvider interface.
 * Handles user authentication and registration using email and password credentials.
 */
export class EmailPasswordAuthProvider implements AuthProvider {
  constructor(
    private prisma: PrismaClient,
    private userRepository: UserRepository,
    private passwordHasher: BcryptPasswordHasher,
    private jwtGenerator: JWTGenerator
  ) {}

  /**
   * Authenticates a user with email and password credentials.
   * @param credentials - UserCredentials containing email and password
   * @returns AuthResult with user information and JWT token
   * @throws Error with generic message if authentication fails (don't reveal if email exists)
   */
  async authenticate(credentials: unknown): Promise<AuthResult> {
    const userCredentials = credentials as UserCredentials;

    if (!userCredentials.email || !userCredentials.password) {
      throw new Error('Invalid credentials');
    }

    // Find user by email with password hash
    const userWithPassword = await this.userRepository.findByEmailWithPassword(
      userCredentials.email
    );

    // Generic error message to prevent user enumeration (don't reveal if email exists)
    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.passwordHasher.compare(
      userCredentials.password,
      userWithPassword.passwordHash
    );

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

    // Generate JWT token
    const token = await this.jwtGenerator.generate({
      userId: userWithPassword.user.id,
      tenantId: userWithPassword.user.tenantId,
      email: userWithPassword.user.email,
    });

    return {
      userId: userWithPassword.user.id,
      tenantId: userWithPassword.user.tenantId,
      email: userWithPassword.user.email,
      token,
    };
  }

  /**
   * Registers a new user with email, password, nickname, and tenant name.
   * @param data - Registration data (email, password, nickname, tenantName)
   * @returns AuthResult with user information and JWT token
   * @throws Error if validation fails or email already exists
   */
  async register(data: unknown): Promise<AuthResult> {
    const registrationData = data as EmailPasswordRegistrationData;

    // Validate input
    const emailValidation = EmailValidator.validate(registrationData.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    const passwordValidation = PasswordValidator.validate(registrationData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    const nicknameValidation = NicknameValidator.validate(registrationData.nickname);
    if (!nicknameValidation.isValid) {
      throw new Error(nicknameValidation.error);
    }

    if (!registrationData.tenantName || registrationData.tenantName.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (registrationData.tenantName.length > 100) {
      throw new Error('Tenant name must be 100 characters or less');
    }

    // Check for duplicate email
    const existingUser = await this.userRepository.findByEmail(registrationData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: registrationData.tenantName,
      },
    });

    // Hash password
    const passwordHash = await this.passwordHasher.hash(registrationData.password);

    // Create user with hashed password and assign as tenant admin
    const user = await this.prisma.user.create({
      data: {
        email: registrationData.email,
        nickname: registrationData.nickname,
        passwordHash,
        tenantId: tenant.id,
        isTenantAdmin: true,
      },
    });

    // Generate JWT token
    const token = await this.jwtGenerator.generate({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
    });

    return {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      token,
    };
  }
}
