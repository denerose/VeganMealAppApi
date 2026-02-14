import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { AuthenticateUserUseCase } from '@/application/auth/authenticate-user.use-case';
import type { UserRepository } from '@/domain/user/user.repository';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let mockPrisma: PrismaClient;
  let mockUserRepository: UserRepository;
  let mockPasswordHasher: BcryptPasswordHasher;
  let mockJwtGenerator: JWTGenerator;
  let mockFindByEmailWithPassword: ReturnType<typeof mock>;
  let mockCompare: ReturnType<typeof mock>;
  let mockGenerate: ReturnType<typeof mock>;
  let mockTenantFindUnique: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create mock functions
    mockFindByEmailWithPassword = mock(() =>
      Promise.resolve({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          nickname: 'Test User',
          tenantId: 'tenant-123',
          isTenantAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        passwordHash: 'hashed-password',
      })
    );
    mockCompare = mock(() => Promise.resolve(true));
    mockGenerate = mock(() => Promise.resolve('jwt-token-123'));
    mockTenantFindUnique = mock(() =>
      Promise.resolve({
        id: 'tenant-123',
        name: 'Test Tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    // Mock PrismaClient
    mockPrisma = {
      tenant: {
        findUnique: mockTenantFindUnique,
      },
    } as unknown as PrismaClient;

    // Mock UserRepository
    mockUserRepository = {
      findByEmailWithPassword: mockFindByEmailWithPassword,
    } as unknown as UserRepository;

    // Mock BcryptPasswordHasher
    mockPasswordHasher = {
      compare: mockCompare,
    } as unknown as BcryptPasswordHasher;

    // Mock JWTGenerator
    mockJwtGenerator = {
      generate: mockGenerate,
    } as unknown as JWTGenerator;

    useCase = new AuthenticateUserUseCase(
      mockPrisma,
      mockUserRepository,
      mockPasswordHasher,
      mockJwtGenerator
    );
  });

  it('should authenticate user with valid credentials', async () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = await useCase.execute(request);

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.nickname).toBe('Test User');
    expect(result.user.tenantId).toBe('tenant-123');
    expect(result.user.tenantName).toBe('Test Tenant');
    expect(result.user.isTenantAdmin).toBe(true);

    // Verify user was looked up by email
    expect(mockFindByEmailWithPassword).toHaveBeenCalledTimes(1);
    expect(mockFindByEmailWithPassword).toHaveBeenCalledWith('test@example.com');

    // Verify password was compared
    expect(mockCompare).toHaveBeenCalledTimes(1);
    expect(mockCompare).toHaveBeenCalledWith('password123', 'hashed-password');

    // Verify tenant was looked up
    expect(mockTenantFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTenantFindUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-123' },
    });

    // Verify JWT token was generated
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      userId: 'user-123',
      tenantId: 'tenant-123',
      email: 'test@example.com',
    });
  });

  it('should throw generic error for non-existent email', () => {
    mockFindByEmailWithPassword.mockResolvedValueOnce(null);

    const request = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid credentials');
  });

  it('should throw generic error for user without password hash', () => {
    mockFindByEmailWithPassword.mockResolvedValueOnce({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        nickname: 'Test User',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      passwordHash: null,
    });

    const request = {
      email: 'test@example.com',
      password: 'password123',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid credentials');
  });

  it('should throw generic error for invalid password', () => {
    mockCompare.mockResolvedValueOnce(false);

    const request = {
      email: 'test@example.com',
      password: 'wrong-password',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid credentials');
  });

  it('should throw generic error when tenant not found', () => {
    mockTenantFindUnique.mockResolvedValueOnce(null);

    const request = {
      email: 'test@example.com',
      password: 'password123',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid credentials');
  });
});
