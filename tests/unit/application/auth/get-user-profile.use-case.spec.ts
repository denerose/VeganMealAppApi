import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { UserRepository } from '@/domain/user/user.repository';
import { GetUserProfileUseCase } from '@/application/auth/get-user-profile.use-case';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: UserRepository;
  let mockFindById: ReturnType<typeof mock>;
  let mockFindTenantById: ReturnType<typeof mock>;

  beforeEach(() => {
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

    mockFindTenantById = mock(() => Promise.resolve({ id: 'tenant-123', name: 'Smith Family' }));

    mockUserRepository = {
      findById: mockFindById,
      findTenantById: mockFindTenantById,
      findByEmail: mock(() => Promise.resolve(null)),
      findAdminsByTenant: mock(() => Promise.resolve([])),
      isUserAdmin: mock(() => Promise.resolve(true)),
      findByEmailWithPassword: mock(() => Promise.resolve(null)),
      updatePasswordHash: mock(() => Promise.resolve()),
      updateNickname: mock(() =>
        Promise.resolve({} as import('@/domain/user/user.repository').User)
      ),
    } as unknown as UserRepository;

    useCase = new GetUserProfileUseCase(mockUserRepository);
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
    expect(mockFindTenantById).toHaveBeenCalledTimes(1);
    expect(mockFindTenantById).toHaveBeenCalledWith('tenant-123');
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
    expect(mockFindTenantById).not.toHaveBeenCalled();
  });

  it('should throw error if tenant not found', () => {
    mockFindTenantById.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'non-existent',
      })
    ).rejects.toThrow('Tenant not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockFindTenantById).toHaveBeenCalledTimes(1);
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
