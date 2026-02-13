/**
 * Interface for authentication providers.
 * Enables extensible authentication strategy pattern supporting
 * email/password, OAuth, social auth, and passkeys.
 */
export interface AuthProvider {
  /**
   * Authenticates user with provided credentials.
   * @param credentials - Authentication credentials (provider-specific)
   * @returns Authentication result with user information and token
   */
  authenticate(credentials: unknown): Promise<AuthResult>;

  /**
   * Registers a new user with provided registration data.
   * @param data - Registration data (provider-specific)
   * @returns Authentication result with user information and token
   */
  register(data: unknown): Promise<AuthResult>;
}

export type AuthResult = {
  userId: string;
  tenantId: string;
  email: string;
  token: string;
};
