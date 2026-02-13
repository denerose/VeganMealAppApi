/**
 * Domain entity representing user credentials for email/password authentication.
 */
export type UserCredentials = {
  email: string;
  password: string;
};

/**
 * Creates UserCredentials from email and password.
 */
export const createUserCredentials = (email: string, password: string): UserCredentials => ({
  email,
  password,
});
