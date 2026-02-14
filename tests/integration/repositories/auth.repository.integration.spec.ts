import { beforeEach, describe, expect, test } from 'bun:test';
import { PrismaAuthRepository } from '@/infrastructure/database/repositories/prisma-auth.repository';
import { resetDatabase, getTestPrisma } from '../../setup';

const prisma = getTestPrisma();
const repository = new PrismaAuthRepository(prisma);

const TEST_TENANT_ID = crypto.randomUUID();
const TEST_USER_ID = crypto.randomUUID();

beforeEach(async () => {
  await resetDatabase();

  // Create test tenant and user
  await prisma.tenant.create({
    data: {
      id: TEST_TENANT_ID,
      name: 'Test Tenant',
      users: {
        create: {
          id: TEST_USER_ID,
          email: 'test@example.com',
          nickname: 'Test User',
          isTenantAdmin: true,
        },
      },
    },
  });
});

describe('PrismaAuthRepository - Registration Flow Integration', () => {
  describe('createPasswordResetToken', () => {
    test('should create a password reset token for a user', async () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const token = 'test-reset-token-123';

      const resetToken = await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      expect(resetToken.id).toBeDefined();
      expect(resetToken.token).toBe(token);
      expect(resetToken.userId).toBe(TEST_USER_ID);
      expect(resetToken.expiresAt).toEqual(expiresAt);
      expect(resetToken.usedAt).toBeNull();
      expect(resetToken.createdAt).toBeInstanceOf(Date);

      // Verify token was persisted
      const dbToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      });
      expect(dbToken).not.toBeNull();
      expect(dbToken?.userId).toBe(TEST_USER_ID);
    });

    test('should create unique tokens for the same user', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token1 = 'token-1';
      const token2 = 'token-2';

      const resetToken1 = await repository.createPasswordResetToken(
        TEST_USER_ID,
        token1,
        expiresAt
      );
      const resetToken2 = await repository.createPasswordResetToken(
        TEST_USER_ID,
        token2,
        expiresAt
      );

      expect(resetToken1.token).not.toBe(resetToken2.token);
      expect(resetToken1.userId).toBe(resetToken2.userId);

      // Verify both tokens exist
      const dbTokens = await prisma.passwordResetToken.findMany({
        where: { userId: TEST_USER_ID },
      });
      expect(dbTokens).toHaveLength(2);
    });
  });

  describe('findPasswordResetTokenByToken', () => {
    test('should find valid reset token by token string', async () => {
      const expiresAt = new Date(Date.now() + 3600000); // Valid (not expired)
      const token = 'valid-token-123';

      await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      const foundToken = await repository.findPasswordResetTokenByToken(token);

      expect(foundToken).not.toBeNull();
      expect(foundToken?.token).toBe(token);
      expect(foundToken?.userId).toBe(TEST_USER_ID);
      expect(foundToken?.usedAt).toBeNull();
    });

    test('should return null for non-existent token', async () => {
      const foundToken = await repository.findPasswordResetTokenByToken('non-existent-token');

      expect(foundToken).toBeNull();
    });

    test('should return null for expired token', async () => {
      const expiresAt = new Date(Date.now() - 3600000); // Expired (1 hour ago)
      const token = 'expired-token-123';

      await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      const foundToken = await repository.findPasswordResetTokenByToken(token);

      expect(foundToken).toBeNull();
    });

    test('should return null for already used token', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token = 'used-token-123';

      const resetToken = await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      // Mark token as used
      await repository.markPasswordResetTokenAsUsed(resetToken.id, new Date());

      const foundToken = await repository.findPasswordResetTokenByToken(token);

      expect(foundToken).toBeNull();
    });
  });

  describe('markPasswordResetTokenAsUsed', () => {
    test('should mark token as used', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token = 'token-to-use-123';

      const resetToken = await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      const usedAt = new Date();
      await repository.markPasswordResetTokenAsUsed(resetToken.id, usedAt);

      // Verify token is marked as used
      const dbToken = await prisma.passwordResetToken.findUnique({
        where: { id: resetToken.id },
      });
      expect(dbToken?.usedAt).not.toBeNull();
      expect(dbToken?.usedAt).toEqual(usedAt);
    });

    test('should prevent token reuse after marking as used', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token = 'single-use-token-123';

      const resetToken = await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

      await repository.markPasswordResetTokenAsUsed(resetToken.id, new Date());

      // Token should not be found (already used)
      const foundToken = await repository.findPasswordResetTokenByToken(token);
      expect(foundToken).toBeNull();
    });
  });
});

describe('PrismaAuthRepository - Password Reset Flow Integration', () => {
  test('should complete full password reset flow', async () => {
    // Step 1: Create password reset token
    const expiresAt = new Date(Date.now() + 3600000);
    const token = 'integration-test-token-123';

    const resetToken = await repository.createPasswordResetToken(TEST_USER_ID, token, expiresAt);

    expect(resetToken).not.toBeNull();
    expect(resetToken.token).toBe(token);
    expect(resetToken.usedAt).toBeNull();

    // Step 2: Find token (simulating reset request)
    const foundToken = await repository.findPasswordResetTokenByToken(token);
    expect(foundToken).not.toBeNull();
    expect(foundToken?.token).toBe(token);
    expect(foundToken?.userId).toBe(TEST_USER_ID);

    // Step 3: Mark token as used (simulating password reset completion)
    await repository.markPasswordResetTokenAsUsed(resetToken.id, new Date());

    // Step 4: Verify token cannot be reused
    const reusedToken = await repository.findPasswordResetTokenByToken(token);
    expect(reusedToken).toBeNull();

    // Step 5: Verify token is marked as used in database
    const dbToken = await prisma.passwordResetToken.findUnique({
      where: { id: resetToken.id },
    });
    expect(dbToken?.usedAt).not.toBeNull();
  });

  test('should handle multiple reset requests for same user', async () => {
    const expiresAt = new Date(Date.now() + 3600000);
    const token1 = 'token-1';
    const token2 = 'token-2';
    const token3 = 'token-3';

    // Create multiple tokens
    const resetToken1 = await repository.createPasswordResetToken(TEST_USER_ID, token1, expiresAt);
    await repository.createPasswordResetToken(TEST_USER_ID, token2, expiresAt);
    await repository.createPasswordResetToken(TEST_USER_ID, token3, expiresAt);

    // All tokens should be valid
    expect(await repository.findPasswordResetTokenByToken(token1)).not.toBeNull();
    expect(await repository.findPasswordResetTokenByToken(token2)).not.toBeNull();
    expect(await repository.findPasswordResetTokenByToken(token3)).not.toBeNull();

    // Use first token
    await repository.markPasswordResetTokenAsUsed(resetToken1.id, new Date());

    // First token should be invalid, others still valid
    expect(await repository.findPasswordResetTokenByToken(token1)).toBeNull();
    expect(await repository.findPasswordResetTokenByToken(token2)).not.toBeNull();
    expect(await repository.findPasswordResetTokenByToken(token3)).not.toBeNull();
  });
});
