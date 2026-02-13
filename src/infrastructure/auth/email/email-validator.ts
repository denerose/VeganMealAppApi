/**
 * Validates email format.
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates email format.
   * @param email - Email address to validate
   * @returns Object with isValid flag and error message if invalid
   */
  static validate(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (email.length > 255) {
      return {
        isValid: false,
        error: 'Email must be 255 characters or less',
      };
    }

    if (!this.EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }
}
