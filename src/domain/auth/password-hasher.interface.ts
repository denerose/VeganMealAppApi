/**
 * Port for password hashing and verification.
 * Use cases depend on this interface; infrastructure provides the implementation (e.g. bcrypt).
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
