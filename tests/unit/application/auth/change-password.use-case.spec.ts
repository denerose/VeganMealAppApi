import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ChangePasswordUseCase } from '@/application/auth/change-password.use-case';
import type { PasswordHasher } from '@/domain/auth/password-hasher.interface';
import type { UserRepository } from '@/domain/user/user.repository';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockUserRepository: UserRepository;
  let mockPasswordHasher: PasswordHasher;
  let mockFindById: ReturnType<typeof mock>;
  let mockFindByEmailWithPassword: ReturnType<typeof mock>;
  let mockCompare: ReturnType<typeof mock>;
  let mockHash: ReturnType<typeof mock>;
  let mockUpdatePasswordHash: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create mock functions
    mockFindById = mock(() =>
      Promise.resolve({
        id: 'user-123',
        email: 'test@example.com',
        nickname: 'Test User',
        tenantId: 'tenant-123',
        isTenantAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
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
        passwordHash: 'current-hashed-password',
      })
    );
    mockCompare = mock(() => Promise.resolve(true));
    mockHash = mock(() => Promise.resolve('new-hashed-password'));
    mockUpdatePasswordHash = mock(() => Promise.resolve());

    // Mock UserRepository
    mockUserRepository = {
      findById: mockFindById,
      findByEmailWithPassword: mockFindByEmailWithPassword,
      updatePasswordHash: mockUpdatePasswordHash,
    } as unknown as UserRepository;

    // Mock BcryptPasswordHasher
    mockPasswordHasher = {
      compare: mockCompare,
      hash: mockHash,
    } as unknown as PasswordHasher;

    useCase = new ChangePasswordUseCase(mockUserRepository, mockPasswordHasher);
  });

  it('should change password successfully with valid current password', async () => {
    const request = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword456',
    };

    const result = await useCase.execute(request);

    expect(result.message).toBe('Password changed successfully');

    // Verify user was looked up
    expect(mockFindById).toHaveBeenCalledTimes(1);
    expect(mockFindById).toHaveBeenCalledWith('user-123', 'tenant-123');

    // Verify password hash was retrieved
    expect(mockFindByEmailWithPassword).toHaveBeenCalledTimes(1);
    expect(mockFindByEmailWithPassword).toHaveBeenCalledWith('test@example.com');

    // Verify current password was compared
    expect(mockCompare).toHaveBeenCalledTimes(1);
    expect(mockCompare).toHaveBeenCalledWith('currentPassword123', 'current-hashed-password');

    // Verify new password was hashed
    expect(mockHash).toHaveBeenCalledTimes(1);
    expect(mockHash).toHaveBeenCalledWith('newPassword456');

    // Verify password hash was updated
    expect(mockUpdatePasswordHash).toHaveBeenCalledTimes(1);
    expect(mockUpdatePasswordHash).toHaveBeenCalledWith('user-123', 'new-hashed-password');
  });

  it('should throw error for invalid new password (too short)', () => {
    const request = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: 'short',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });

  it('should throw error for invalid new password (no letter)', () => {
    const request = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: '12345678',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one letter'
    );
  });

  it('should throw error for invalid new password (no number)', () => {
    const request = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: 'password',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one number'
    );
  });

  it('should throw error when user not found', () => {
    mockFindById.mockResolvedValueOnce(null);

    const request = {
      userId: 'nonexistent-user',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('User not found');
  });

  it('should throw error when user does not have password set', () => {
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
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('User does not have a password set');
  });

  it('should throw error for incorrect current password', () => {
    mockCompare.mockResolvedValueOnce(false);

    const request = {
      userId: 'user-123',
      tenantId: 'tenant-123',
      currentPassword: 'wrong-password',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Current password is incorrect');
  });
});
