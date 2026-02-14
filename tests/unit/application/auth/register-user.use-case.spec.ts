import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { PrismaClient } from '@prisma/client';
import { RegisterUserUseCase } from '@/application/auth/register-user.use-case';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockPrisma: PrismaClient;
  let mockPasswordHasher: BcryptPasswordHasher;
  let mockJwtGenerator: JWTGenerator;
  let mockFindUnique: ReturnType<typeof mock>;
  let mockUserCreate: ReturnType<typeof mock>;
  let mockTenantCreate: ReturnType<typeof mock>;
  let mockHash: ReturnType<typeof mock>;
  let mockGenerate: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create mock functions
    mockFindUnique = mock(() => Promise.resolve(null));
    mockUserCreate = mock(() =>
      Promise.resolve({
        id: 'user-123',
        email: 'test@example.com',
        nickname: 'Test User',
        passwordHash: 'hashed-password',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    mockTenantCreate = mock(() =>
      Promise.resolve({
        id: 'tenant-123',
        name: 'Test Tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    mockHash = mock(() => Promise.resolve('hashed-password'));
    mockGenerate = mock(() => Promise.resolve('jwt-token-123'));

    // Mock PrismaClient
    mockPrisma = {
      user: {
        findUnique: mockFindUnique,
        create: mockUserCreate,
      },
      tenant: {
        create: mockTenantCreate,
      },
    } as unknown as PrismaClient;

    // Mock BcryptPasswordHasher
    mockPasswordHasher = {
      hash: mockHash,
      compare: mock(() => Promise.resolve(true)),
    } as unknown as BcryptPasswordHasher;

    // Mock JWTGenerator
    mockJwtGenerator = {
      generate: mockGenerate,
    } as unknown as JWTGenerator;

    useCase = new RegisterUserUseCase(mockPrisma, mockPasswordHasher, mockJwtGenerator);
  });

  it('should register a new user successfully', async () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    const result = await useCase.execute(request);

    expect(result.token).toBe('jwt-token-123');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.nickname).toBe('Test User');
    expect(result.user.tenantId).toBe('tenant-123');
    expect(result.user.tenantName).toBe('Test Tenant');
    expect(result.user.isTenantAdmin).toBe(true);

    // Verify tenant was created
    expect(mockTenantCreate).toHaveBeenCalledTimes(1);
    expect(mockTenantCreate).toHaveBeenCalledWith({
      data: { name: 'Test Tenant' },
    });

    // Verify password was hashed
    expect(mockHash).toHaveBeenCalledTimes(1);
    expect(mockHash).toHaveBeenCalledWith('password123');

    // Verify user was created
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        nickname: 'Test User',
        passwordHash: 'hashed-password',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
      },
    });

    // Verify JWT token was generated
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      userId: 'user-123',
      tenantId: 'tenant-123',
      email: 'test@example.com',
    });
  });

  it('should throw error for invalid email', () => {
    const request = {
      email: 'invalid-email',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid email format');
  });

  it('should throw error for password too short', () => {
    const request = {
      email: 'test@example.com',
      password: 'short',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });

  it('should throw error for password without letter', () => {
    const request = {
      email: 'test@example.com',
      password: '12345678',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one letter'
    );
  });

  it('should throw error for password without number', () => {
    const request = {
      email: 'test@example.com',
      password: 'password',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one number'
    );
  });

  it('should throw error for empty nickname', () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: '',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Nickname is required');
  });

  it('should throw error for nickname too long', () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'a'.repeat(51),
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Nickname must be 50 characters or less'
    );
  });

  it('should throw error for empty tenant name', () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: '',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Tenant name is required');
  });

  it('should throw error for tenant name too long', () => {
    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'a'.repeat(101),
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Tenant name must be 100 characters or less'
    );
  });

  it('should throw error for duplicate email', () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'test@example.com',
      nickname: 'Existing User',
      tenantId: 'existing-tenant',
      isTenantAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Email already registered');
  });
});
