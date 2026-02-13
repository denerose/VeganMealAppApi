import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ResetPasswordUseCase } from '@/application/auth/reset-password.use-case';
import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockAuthRepository: AuthRepository;
  let mockUserRepository: UserRepository;
  let mockPasswordHasher: BcryptPasswordHasher;
  let mockFindPasswordResetTokenByToken: ReturnType<typeof mock>;
  let mockMarkPasswordResetTokenAsUsed: ReturnType<typeof mock>;
  let mockUpdatePasswordHash: ReturnType<typeof mock>;
  let mockHash: ReturnType<typeof mock>;

  beforeEach(() => {
    // Create mock functions
    mockFindPasswordResetTokenByToken = mock(() =>
      Promise.resolve({
        id: 'token-id-123',
        token: 'valid-reset-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000), // Valid (not expired)
        usedAt: null,
        createdAt: new Date(),
      })
    );
    mockMarkPasswordResetTokenAsUsed = mock(() => Promise.resolve());
    mockUpdatePasswordHash = mock(() => Promise.resolve());
    mockHash = mock(() => Promise.resolve('new-hashed-password'));

    // Mock AuthRepository
    mockAuthRepository = {
      findPasswordResetTokenByToken: mockFindPasswordResetTokenByToken,
      markPasswordResetTokenAsUsed: mockMarkPasswordResetTokenAsUsed,
    } as unknown as AuthRepository;

    // Mock UserRepository
    mockUserRepository = {
      updatePasswordHash: mockUpdatePasswordHash,
    } as unknown as UserRepository;

    // Mock BcryptPasswordHasher
    mockPasswordHasher = {
      hash: mockHash,
    } as unknown as BcryptPasswordHasher;

    useCase = new ResetPasswordUseCase(mockAuthRepository, mockUserRepository, mockPasswordHasher);
  });

  it('should reset password successfully with valid token', async () => {
    const request = {
      token: 'valid-reset-token',
      newPassword: 'newPassword456',
    };

    const result = await useCase.execute(request);

    expect(result.message).toBe('Password reset successfully');

    // Verify token was looked up
    expect(mockFindPasswordResetTokenByToken).toHaveBeenCalledTimes(1);
    expect(mockFindPasswordResetTokenByToken).toHaveBeenCalledWith('valid-reset-token');

    // Verify new password was hashed
    expect(mockHash).toHaveBeenCalledTimes(1);
    expect(mockHash).toHaveBeenCalledWith('newPassword456');

    // Verify password hash was updated
    expect(mockUpdatePasswordHash).toHaveBeenCalledTimes(1);
    expect(mockUpdatePasswordHash).toHaveBeenCalledWith('user-123', 'new-hashed-password');

    // Verify token was marked as used
    expect(mockMarkPasswordResetTokenAsUsed).toHaveBeenCalledTimes(1);
    expect(mockMarkPasswordResetTokenAsUsed).toHaveBeenCalledWith('token-id-123', expect.any(Date));
  });

  it('should throw error for invalid new password (too short)', () => {
    const request = {
      token: 'valid-reset-token',
      newPassword: 'short',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });

  it('should throw error for invalid new password (no letter)', () => {
    const request = {
      token: 'valid-reset-token',
      newPassword: '12345678',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one letter'
    );
  });

  it('should throw error for invalid new password (no number)', () => {
    const request = {
      token: 'valid-reset-token',
      newPassword: 'password',
    };

    return expect(useCase.execute(request)).rejects.toThrow(
      'Password must contain at least one number'
    );
  });

  it('should throw error for invalid token', () => {
    mockFindPasswordResetTokenByToken.mockResolvedValueOnce(null);

    const request = {
      token: 'invalid-token',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw error for expired token', () => {
    // PrismaAuthRepository.findPasswordResetTokenByToken returns null for expired tokens
    mockFindPasswordResetTokenByToken.mockResolvedValueOnce(null);

    const request = {
      token: 'expired-token',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid or expired reset token');
  });

  it('should throw error for already used token', () => {
    // PrismaAuthRepository.findPasswordResetTokenByToken returns null for used tokens
    mockFindPasswordResetTokenByToken.mockResolvedValueOnce(null);

    const request = {
      token: 'used-token',
      newPassword: 'newPassword456',
    };

    return expect(useCase.execute(request)).rejects.toThrow('Invalid or expired reset token');
  });
});
