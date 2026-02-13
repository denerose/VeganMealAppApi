import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { UserRepository } from '@/domain/user/user.repository';
import type { PrismaClient } from '@prisma/client';
import { GetUserProfileUseCase } from '@/application/auth/get-user-profile.use-case';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: UserRepository;
  let mockPrisma: PrismaClient;
  let mockFindById: ReturnType<typeof mock>;
  let mockTenantFindUnique: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create mock functions
    mockFindById = mock(() =>
      Promise.resolve({
        id: 'user-123',
        email: 'vegan-chef@example.com',
        nickname: 'Vegan Chef',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      })
    );

    mockTenantFindUnique = mock(() =>
      Promise.resolve({
        id: 'tenant-123',
        name: 'Smith Family',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      })
    );

    // Mock UserRepository
    mockUserRepository = {
      findById: mockFindById,
      findByEmail: mock(() => Promise.resolve(null)),
      findAdminsByTenant: mock(() => Promise.resolve([])),
      isUserAdmin: mock(() => Promise.resolve(true)),
      findByEmailWithPassword: mock(() => Promise.resolve(null)),
      updatePasswordHash: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

    // Mock PrismaClient
    mockPrisma = {
      tenant: {
        findUnique: mockTenantFindUnique,
      },
    } as unknown as PrismaClient;

    useCase = new GetUserProfileUseCase(mockPrisma, mockUserRepository);
  });

  it('should retrieve user profile successfully', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      tenantId: 'tenant-123',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
    expect(result.email).toBe('vegan-chef@example.com');
    expect(result.nickname).toBe('Vegan Chef');
    expect(result.tenantId).toBe('tenant-123');
    expect(result.tenantName).toBe('Smith Family');
    expect(result.isTenantAdmin).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);

    // Verify repository was called correctly
    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockFindById).toHaveBeenCalledWith('user-123', 'tenant-123');

    // Verify tenant lookup was called
    expect(mockTenantFindUnique).toHaveBeenCalledTimes(1);
    expect(mockTenantFindUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-123' },
    });
  });

  it('should throw error if user not found', () => {
    mockFindById.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'non-existent',
        tenantId: 'tenant-123',
      })
    ).rejects.toThrow('User not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockTenantFindUnique).not.toHaveBeenCalled();
  });

  it('should throw error if tenant not found', () => {
    mockTenantFindUnique.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'non-existent',
      })
    ).rejects.toThrow('Tenant not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockTenantFindUnique).toHaveBeenCalledTimes(1);
  });

  it('should throw error if user does not belong to tenant', () => {
    mockFindById.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'different-tenant',
      })
    ).rejects.toThrow('User not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockFindById).toHaveBeenCalledWith('user-123', 'different-tenant');
  });
});
