import bcrypt from 'bcrypt';

/**
 * Service for hashing and comparing passwords using bcrypt.
 * Uses cost factor 10 for balance between security and performance.
 */
export class BcryptPasswordHasher {
  private readonly saltRounds = 10;

  /**
   * Hashes a plaintext password using bcrypt.
   * @param password - Plaintext password to hash
   * @returns Promise resolving to the hashed password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares a plaintext password with a hashed password.
   * @param password - Plaintext password to compare
   * @param hash - Hashed password to compare against
   * @returns Promise resolving to true if passwords match, false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
