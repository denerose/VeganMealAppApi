/**
 * Validates password strength requirements.
 * Requirements: Minimum 8 characters, at least one letter and one number.
 */
export class PasswordValidator {
  /**
   * Validates password meets security requirements.
   * @param password - Password to validate
   * @returns Object with isValid flag and error message if invalid
   */
  static validate(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long',
      };
    }

    // Check for at least one letter
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasLetter) {
      return {
        isValid: false,
        error: 'Password must contain at least one letter',
      };
    }

    // Check for at least one number
    const hasNumber = /[0-9]/.test(password);
    if (!hasNumber) {
      return {
        isValid: false,
        error: 'Password must contain at least one number',
      };
    }

    return { isValid: true };
  }
}
