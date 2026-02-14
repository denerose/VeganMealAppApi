import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { UserRepository } from '@/domain/user/user.repository';
import { UpdateUserProfileUseCase } from '@/application/auth/update-user-profile.use-case';

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase;
  let mockUserRepository: UserRepository;
  let mockFindById: ReturnType<typeof mock>;
  let mockUpdateNickname: ReturnType<typeof mock>;
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

    mockUpdateNickname = mock(() =>
      Promise.resolve({
        id: 'user-123',
        email: 'vegan-chef@example.com',
        nickname: 'Updated Nickname',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-02-13'),
      })
    );

    mockFindTenantById = mock(() => Promise.resolve({ id: 'tenant-123', name: 'Smith Family' }));

    mockUserRepository = {
      findById: mockFindById,
      findTenantById: mockFindTenantById,
      updateNickname: mockUpdateNickname,
      findByEmail: mock(() => Promise.resolve(null)),
      findAdminsByTenant: mock(() => Promise.resolve([])),
      isUserAdmin: mock(() => Promise.resolve(true)),
      findByEmailWithPassword: mock(() => Promise.resolve(null)),
      updatePasswordHash: mock(() => Promise.resolve()),
    } as unknown as UserRepository;

    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  it('should update user nickname successfully', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      tenantId: 'tenant-123',
      nickname: 'Updated Nickname',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
    expect(result.email).toBe('vegan-chef@example.com');
    expect(result.nickname).toBe('Updated Nickname');
    expect(result.tenantId).toBe('tenant-123');
    expect(result.tenantName).toBe('Smith Family');
    expect(result.isTenantAdmin).toBe(true);

    // Verify repository was called correctly
    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockFindById).toHaveBeenCalledWith('user-123', 'tenant-123');

    // Verify repository updateNickname was called
    expect(mockUpdateNickname).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).toHaveBeenCalledWith('user-123', 'tenant-123', 'Updated Nickname');

    // Verify tenant lookup was called
    expect(mockFindTenantById).toHaveBeenCalledTimes(1);
  });

  it('should throw error if user not found', () => {
    mockFindById.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'non-existent',
        tenantId: 'tenant-123',
        nickname: 'New Nickname',
      })
    ).rejects.toThrow('User not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it('should throw error if tenant not found', () => {
    mockFindTenantById.mockResolvedValueOnce(null);

    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'non-existent',
        nickname: 'New Nickname',
      })
    ).rejects.toThrow('Tenant not found');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it('should throw error for invalid nickname (empty)', () => {
    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'tenant-123',
        nickname: '',
      })
    ).rejects.toThrow('Nickname is required');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it('should throw error for invalid nickname (too long)', () => {
    const longNickname = 'a'.repeat(51);

    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'tenant-123',
        nickname: longNickname,
      })
    ).rejects.toThrow('Nickname must be 50 characters or less');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it('should prevent email changes (T087: email immutability)', () => {
    return expect(
      useCase.execute({
        userId: 'user-123',
        tenantId: 'tenant-123',
        nickname: 'Updated Nickname',
        email: 'newemail@example.com', // Attempt to change email
      })
    ).rejects.toThrow('Email cannot be changed');

    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it('should allow nickname update without email field', async () => {
    const result = await useCase.execute({
      userId: 'user-123',
      tenantId: 'tenant-123',
      nickname: 'Updated Nickname',
      // No email field - should work fine
    });

    expect(result.nickname).toBe('Updated Nickname');
    expect(result.email).toBe('vegan-chef@example.com'); // Original email preserved
    expect(mockUpdateNickname).toHaveBeenCalledTimes(1);
    expect(mockUpdateNickname).toHaveBeenCalledWith('user-123', 'tenant-123', 'Updated Nickname');
  });
});
