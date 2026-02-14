import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { RequestPasswordResetUseCase } from '@/application/auth/request-password-reset.use-case';
import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import { EmailService } from '@/infrastructure/auth/email/email.service';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let mockUserRepository: UserRepository;
  let mockAuthRepository: AuthRepository;
  let mockEmailService: EmailService;
  let mockFindByEmailWithPassword: ReturnType<typeof mock>;
  let mockCreatePasswordResetToken: ReturnType<typeof mock>;
  let mockSendPasswordResetEmail: ReturnType<typeof mock>;

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
    mockCreatePasswordResetToken = mock(() =>
      Promise.resolve({
        id: 'token-id-123',
        token: 'reset-token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        createdAt: new Date(),
      })
    );
    mockSendPasswordResetEmail = mock(() => Promise.resolve({}));

    // Mock UserRepository
    mockUserRepository = {
      findByEmailWithPassword: mockFindByEmailWithPassword,
    } as unknown as UserRepository;

    // Mock AuthRepository
    mockAuthRepository = {
      createPasswordResetToken: mockCreatePasswordResetToken,
    } as unknown as AuthRepository;

    // Mock EmailService
    mockEmailService = {
      sendPasswordResetEmail: mockSendPasswordResetEmail,
    } as unknown as EmailService;

    useCase = new RequestPasswordResetUseCase(
      mockUserRepository,
      mockAuthRepository,
      mockEmailService
    );
  });

  it('should generate reset token and send email for existing user', async () => {
    const request = {
      email: 'test@example.com',
      resetUrl: 'https://app.example.com/reset-password',
    };

    const result = await useCase.execute(request);

    expect(result.message).toBe('If the email exists, a password reset link has been sent');

    // Verify user was looked up
    expect(mockFindByEmailWithPassword).toHaveBeenCalledTimes(1);
    expect(mockFindByEmailWithPassword).toHaveBeenCalledWith('test@example.com');

    // Verify token was created (with 1 hour expiration)
    expect(mockCreatePasswordResetToken).toHaveBeenCalledTimes(1);
    expect(mockCreatePasswordResetToken).toHaveBeenCalledWith(
      'user-123',
      expect.any(String), // Token is generated randomly
      expect.any(Date) // ExpiresAt is calculated
    );

    // Verify email was sent
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String), // Token
      expect.stringContaining('https://app.example.com/reset-password?token=')
    );
  });

  it('should return generic success message for non-existent email', async () => {
    mockFindByEmailWithPassword.mockResolvedValueOnce(null);

    const request = {
      email: 'nonexistent@example.com',
      resetUrl: 'https://app.example.com/reset-password',
    };

    const result = await useCase.execute(request);

    expect(result.message).toBe('If the email exists, a password reset link has been sent');

    // Verify user was looked up
    expect(mockFindByEmailWithPassword).toHaveBeenCalledTimes(1);

    // Verify token was NOT created
    expect(mockCreatePasswordResetToken).toHaveBeenCalledTimes(0);

    // Verify email was NOT sent
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(0);
  });

  it('should generate cryptographically random token (32+ bytes)', async () => {
    const request = {
      email: 'test@example.com',
      resetUrl: 'https://app.example.com/reset-password',
    };

    await useCase.execute(request);

    // Verify token was created
    expect(mockCreatePasswordResetToken).toHaveBeenCalledTimes(1);
    const callArgs = mockCreatePasswordResetToken.mock.calls[0];
    const token = callArgs[1] as string; // Second argument is the token

    // Token should be hex string (64 characters for 32 bytes)
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token.length).toBe(64); // 32 bytes = 64 hex characters
  });

  it('should create token with 1 hour expiration', async () => {
    const request = {
      email: 'test@example.com',
      resetUrl: 'https://app.example.com/reset-password',
    };

    const beforeExecution = Date.now();
    await useCase.execute(request);
    const afterExecution = Date.now();

    // Verify token expiration
    expect(mockCreatePasswordResetToken).toHaveBeenCalledTimes(1);
    const callArgs = mockCreatePasswordResetToken.mock.calls[0];
    const expiresAt = callArgs[2] as Date; // Third argument is expiresAt

    const expectedExpiration = beforeExecution + 3600000; // 1 hour in ms
    const actualExpiration = expiresAt.getTime();

    // Allow 1 second tolerance for execution time
    expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - 1000);
    expect(actualExpiration).toBeLessThanOrEqual(afterExecution + 3600000 + 1000);
  });
});
