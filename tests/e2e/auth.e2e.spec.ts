import { beforeEach, describe, expect, test, beforeAll } from 'bun:test';
import { resetDatabase } from '../setup';
import type { AuthResponse } from '@/infrastructure/http/dtos/auth.dto';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

let serverAvailable = false;

beforeAll(async () => {
  // Check if server is available
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
      signal: AbortSignal.timeout(1000),
    }).catch(() => null);
    serverAvailable = response !== null;
  } catch {
    serverAvailable = false;
  }

  if (!serverAvailable) {
    console.warn(
      `⚠️  E2E tests skipped: Server not available at ${API_BASE_URL}. Start server with 'bun run dev' to run E2E tests.`
    );
  }
});

beforeEach(async () => {
  if (serverAvailable) {
    await resetDatabase();
  }
});

describe('POST /auth/register', () => {
  test.skipIf(!serverAvailable)('should register a new user successfully', async () => {
    const requestBody = {
      email: 'newuser@example.com',
      password: 'password123',
      nickname: 'New User',
      tenantName: 'New Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(201);

    const data = (await response.json()) as AuthResponse;

    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.nickname).toBe('New User');
    expect(data.user.tenantId).toBeDefined();
    expect(data.user.tenantName).toBe('New Tenant');
    expect(data.user.isTenantAdmin).toBe(true);
    expect(data.user.createdAt).toBeDefined();
    expect(data.user.updatedAt).toBeDefined();
  });

  test.skipIf(!serverAvailable)('should return 400 for missing required fields', async () => {
    const requestBody = {
      email: 'test@example.com',
      // Missing password, nickname, tenantName
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Missing required fields');
  });

  test.skipIf(!serverAvailable)('should return 400 for invalid email format', async () => {
    const requestBody = {
      email: 'invalid-email',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Invalid email format');
  });

  test.skipIf(!serverAvailable)('should return 400 for password too short', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'short',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Password must be at least 8 characters long');
  });

  test.skipIf(!serverAvailable)('should return 400 for password without letter', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: '12345678',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Password must contain at least one letter');
  });

  test.skipIf(!serverAvailable)('should return 400 for password without number', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Password must contain at least one number');
  });

  test.skipIf(!serverAvailable)('should return 400 for empty nickname', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      nickname: '',
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Nickname is required');
  });

  test.skipIf(!serverAvailable)('should return 400 for nickname too long', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'a'.repeat(51),
      tenantName: 'Test Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Nickname must be 50 characters or less');
  });

  test.skipIf(!serverAvailable)('should return 400 for empty tenant name', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: '',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Tenant name is required');
  });

  test.skipIf(!serverAvailable)('should return 409 for duplicate email', async () => {
    // Register first user
    const firstUser = {
      email: 'duplicate@example.com',
      password: 'password123',
      nickname: 'First User',
      tenantName: 'First Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firstUser),
    });

    // Try to register with same email
    const secondUser = {
      email: 'duplicate@example.com',
      password: 'password456',
      nickname: 'Second User',
      tenantName: 'Second Tenant',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(secondUser),
    });

    expect(response.status).toBe(409);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Email already registered');
  });

  test.skipIf(!serverAvailable)(
    'should create tenant and assign user as tenant admin',
    async () => {
      const requestBody = {
        email: 'admin@example.com',
        password: 'password123',
        nickname: 'Admin User',
        tenantName: 'Admin Tenant',
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as AuthResponse;
      expect(data.user.isTenantAdmin).toBe(true);
      expect(data.user.tenantName).toBe('Admin Tenant');
    }
  );
});

describe('POST /auth/login', () => {
  test.skipIf(!serverAvailable)('should login user with valid credentials', async () => {
    // First register a user
    const registerBody = {
      email: 'loginuser@example.com',
      password: 'password123',
      nickname: 'Login User',
      tenantName: 'Login Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    // Now login
    const loginBody = {
      email: 'loginuser@example.com',
      password: 'password123',
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(response.status).toBe(200);

    const data = (await response.json()) as AuthResponse;

    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.email).toBe('loginuser@example.com');
    expect(data.user.nickname).toBe('Login User');
    expect(data.user.tenantId).toBeDefined();
    expect(data.user.tenantName).toBe('Login Tenant');
  });

  test.skipIf(!serverAvailable)('should return 400 for missing required fields', async () => {
    const loginBody = {
      email: 'test@example.com',
      // Missing password
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Missing required fields');
  });

  test.skipIf(!serverAvailable)('should return 401 for invalid credentials', async () => {
    // Register a user first
    const registerBody = {
      email: 'invalidcreds@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    // Try to login with wrong password
    const loginBody = {
      email: 'invalidcreds@example.com',
      password: 'wrong-password',
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(response.status).toBe(401);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Invalid credentials');
  });

  test.skipIf(!serverAvailable)('should return 401 for non-existent email', async () => {
    const loginBody = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(response.status).toBe(401);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Invalid credentials');
  });
});

describe('Protected endpoint access', () => {
  test.skipIf(!serverAvailable)(
    'should allow access to protected endpoint with valid token',
    async () => {
      // Register and login to get a token
      const registerBody = {
        email: 'protected@example.com',
        password: 'password123',
        nickname: 'Protected User',
        tenantName: 'Protected Tenant',
      };

      await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerBody),
      });

      const loginBody = {
        email: 'protected@example.com',
        password: 'password123',
      };

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginBody),
      });

      expect(loginResponse.status).toBe(200);
      const loginData = (await loginResponse.json()) as AuthResponse;
      const token = loginData.token;

      // Access protected endpoint with valid token
      const protectedResponse = await fetch(`${API_BASE_URL}/user-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      expect(protectedResponse.status).toBe(200);
    }
  );

  test.skipIf(!serverAvailable)(
    'should reject access to protected endpoint without token',
    async () => {
      const response = await fetch(`${API_BASE_URL}/user-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      const data = (await response.json()) as { error: { message: string } };
      expect(data.error).toBeDefined();
      expect(data.error.message).toBe('Authentication required');
    }
  );

  test.skipIf(!serverAvailable)(
    'should reject access to protected endpoint with invalid token',
    async () => {
      const response = await fetch(`${API_BASE_URL}/user-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-123',
        },
      });

      expect(response.status).toBe(401);

      const data = (await response.json()) as { error: { message: string } };
      expect(data.error).toBeDefined();
    }
  );

  test.skipIf(!serverAvailable)(
    'should reject access to protected endpoint with malformed Authorization header',
    async () => {
      const response = await fetch(`${API_BASE_URL}/user-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidFormat token',
        },
      });

      expect(response.status).toBe(401);
    }
  );
});

describe('POST /auth/password/change', () => {
  test.skipIf(!serverAvailable)(
    'should change password successfully with valid current password',
    async () => {
      // Register and login to get a token
      const registerBody = {
        email: 'changepass@example.com',
        password: 'oldPassword123',
        nickname: 'Change Pass User',
        tenantName: 'Change Pass Tenant',
      };

      await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerBody),
      });

      const loginBody = {
        email: 'changepass@example.com',
        password: 'oldPassword123',
      };

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginBody),
      });

      expect(loginResponse.status).toBe(200);
      const loginData = (await loginResponse.json()) as AuthResponse;
      const token = loginData.token;

      // Change password
      const changePasswordBody = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changePasswordBody),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { message: string };
      expect(data.message).toBe('Password changed successfully');

      // Verify new password works
      const newLoginBody = {
        email: 'changepass@example.com',
        password: 'newPassword456',
      };

      const newLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLoginBody),
      });

      expect(newLoginResponse.status).toBe(200);
    }
  );

  test.skipIf(!serverAvailable)('should return 400 for missing required fields', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'changepass2@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'changepass2@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const changePasswordBody = {
      currentPassword: 'password123',
      // Missing newPassword
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changePasswordBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Missing required fields');
  });

  test.skipIf(!serverAvailable)('should return 400 for incorrect current password', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'changepass3@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'changepass3@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const changePasswordBody = {
      currentPassword: 'wrong-password',
      newPassword: 'newPassword456',
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changePasswordBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Current password is incorrect');
  });

  test.skipIf(!serverAvailable)('should return 401 without authentication token', async () => {
    const changePasswordBody = {
      currentPassword: 'password123',
      newPassword: 'newPassword456',
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changePasswordBody),
    });

    expect(response.status).toBe(401);
  });

  test.skipIf(!serverAvailable)('should return 400 for invalid new password', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'changepass4@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'changepass4@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const changePasswordBody = {
      currentPassword: 'password123',
      newPassword: 'short', // Too short
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changePasswordBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Password must be at least 8 characters long');
  });
});

describe('POST /auth/password/reset/request', () => {
  test.skipIf(!serverAvailable)('should return success message for existing email', async () => {
    // Register a user first
    const registerBody = {
      email: 'resetrequest@example.com',
      password: 'password123',
      nickname: 'Reset User',
      tenantName: 'Reset Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const requestBody = {
      email: 'resetrequest@example.com',
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(200);

    const data = (await response.json()) as { message: string };
    expect(data.message).toBe('If the email exists, a password reset link has been sent');
  });

  test.skipIf(!serverAvailable)(
    'should return generic success message for non-existent email',
    async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
      };

      const response = await fetch(`${API_BASE_URL}/auth/password/reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { message: string };
      // T079: Generic success message (don't reveal if email exists)
      expect(data.message).toBe('If the email exists, a password reset link has been sent');
    }
  );

  test.skipIf(!serverAvailable)('should return 400 for missing email', async () => {
    const requestBody = {};

    const response = await fetch(`${API_BASE_URL}/auth/password/reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Missing required field');
  });
});

describe('POST /auth/password/reset', () => {
  test.skipIf(!serverAvailable)('should return 401 for invalid token', async () => {
    const resetBody = {
      token: 'invalid-token-123',
      newPassword: 'newPassword456',
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetBody),
    });

    // Should fail with invalid token
    expect(response.status).toBe(401);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Invalid or expired reset token');
  });

  test.skipIf(!serverAvailable)('should return 400 for missing required fields', async () => {
    const resetBody = {
      token: 'some-token',
      // Missing newPassword
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Missing required fields');
  });

  test.skipIf(!serverAvailable)('should return 400 for invalid new password', async () => {
    const resetBody = {
      token: 'some-token',
      newPassword: 'short', // Too short
    };

    const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Password must be at least 8 characters long');
  });
});

describe('GET /auth/profile', () => {
  test.skipIf(!serverAvailable)('should retrieve user profile successfully', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'profile@example.com',
      password: 'password123',
      nickname: 'Profile User',
      tenantName: 'Profile Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginBody = {
      email: 'profile@example.com',
      password: 'password123',
    };

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(loginResponse.status).toBe(200);
    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    // Get profile
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      id: string;
      email: string;
      nickname: string;
      tenantId: string;
      tenantName: string;
      isTenantAdmin: boolean;
      createdAt: string;
      updatedAt: string;
    };

    expect(data.id).toBeDefined();
    expect(data.email).toBe('profile@example.com');
    expect(data.nickname).toBe('Profile User');
    expect(data.tenantId).toBeDefined();
    expect(data.tenantName).toBe('Profile Tenant');
    expect(data.isTenantAdmin).toBe(true);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  test.skipIf(!serverAvailable)('should return 401 without authentication token', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(401);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Authentication required');
  });

  test.skipIf(!serverAvailable)('should return 401 with invalid token', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-123',
      },
    });

    expect(response.status).toBe(401);
  });
});

describe('PATCH /auth/profile', () => {
  test.skipIf(!serverAvailable)('should update user nickname successfully', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'updateprofile@example.com',
      password: 'password123',
      nickname: 'Original Nickname',
      tenantName: 'Update Profile Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginBody = {
      email: 'updateprofile@example.com',
      password: 'password123',
    };

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginBody),
    });

    expect(loginResponse.status).toBe(200);
    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    // Update profile
    const updateBody = {
      nickname: 'Updated Nickname',
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateBody),
    });

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      id: string;
      email: string;
      nickname: string;
      tenantId: string;
      tenantName: string;
      isTenantAdmin: boolean;
      createdAt: string;
      updatedAt: string;
    };

    expect(data.nickname).toBe('Updated Nickname');
    expect(data.email).toBe('updateprofile@example.com'); // Email unchanged
  });

  test.skipIf(!serverAvailable)('should return 400 for empty nickname', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'updateprofile2@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'updateprofile2@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const updateBody = {
      nickname: '',
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Nickname is required');
  });

  test.skipIf(!serverAvailable)('should return 400 for nickname too long', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'updateprofile3@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'updateprofile3@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const updateBody = {
      nickname: 'a'.repeat(51),
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('Nickname must be 50 characters or less');
  });

  test.skipIf(!serverAvailable)('should return 400 for email update attempt (T094)', async () => {
    // Register and login to get a token
    const registerBody = {
      email: 'updateprofile4@example.com',
      password: 'password123',
      nickname: 'Test User',
      tenantName: 'Test Tenant',
    };

    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'updateprofile4@example.com',
        password: 'password123',
      }),
    });

    const loginData = (await loginResponse.json()) as AuthResponse;
    const token = loginData.token;

    const updateBody = {
      nickname: 'Updated Nickname',
      email: 'newemail@example.com', // Attempt to change email
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateBody),
    });

    expect(response.status).toBe(400);

    const data = (await response.json()) as { error: { message: string } };
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Email cannot be changed');
  });

  test.skipIf(!serverAvailable)('should return 401 without authentication token', async () => {
    const updateBody = {
      nickname: 'Updated Nickname',
    };

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    expect(response.status).toBe(401);
  });
});
