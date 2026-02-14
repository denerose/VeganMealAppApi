import { describe, test } from 'bun:test';

/**
 * Unit tests for EmailPasswordAuthProvider.
 *
 * NOTE: This test file is created before the implementation (T024).
 * The tests will fail until EmailPasswordAuthProvider is implemented.
 *
 * Expected implementation location:
 * src/infrastructure/auth/providers/email-password-auth.provider.ts
 */

describe('EmailPasswordAuthProvider', () => {
  test.todo('should implement AuthProvider interface');

  test.todo('should authenticate user with valid email and password', async () => {
    // Given: Valid email and password credentials
    // When: authenticate() is called
    // Then: Returns AuthResult with userId, tenantId, email, and token
  });

  test.todo('should throw error for invalid credentials', async () => {
    // Given: Invalid email or password
    // When: authenticate() is called
    // Then: Throws error with generic message (don't reveal if email exists)
  });

  test.todo('should register new user with valid data', async () => {
    // Given: Valid registration data (email, password, nickname, tenantName)
    // When: register() is called
    // Then: Returns AuthResult with new user information and token
  });

  test.todo('should throw error for duplicate email during registration', async () => {
    // Given: Registration data with existing email
    // When: register() is called
    // Then: Throws error indicating email already registered
  });

  test.todo('should validate password requirements during registration', async () => {
    // Given: Registration data with invalid password (too short, no letter, no number)
    // When: register() is called
    // Then: Throws validation error
  });

  test.todo('should hash password before storing', async () => {
    // Given: Valid registration data
    // When: register() is called
    // Then: Password is hashed using BcryptPasswordHasher before storage
  });

  test.todo('should create tenant and assign user as admin during registration', async () => {
    // Given: Valid registration data with tenantName
    // When: register() is called
    // Then: New tenant is created and user is assigned as tenant admin
  });
});
