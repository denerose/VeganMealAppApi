/**
 * Validates nickname requirements.
 * Requirements: Minimum 1 character, maximum 50 characters.
 */
export class NicknameValidator {
  /**
   * Validates nickname meets requirements.
   * @param nickname - Nickname to validate
   * @returns Object with isValid flag and error message if invalid
   */
  static validate(nickname: string): { isValid: boolean; error?: string } {
    if (!nickname) {
      return { isValid: false, error: 'Nickname is required' };
    }

    if (nickname.length < 1) {
      return {
        isValid: false,
        error: 'Nickname must be at least 1 character long',
      };
    }

    if (nickname.length > 50) {
      return {
        isValid: false,
        error: 'Nickname must be 50 characters or less',
      };
    }

    return { isValid: true };
  }
}
