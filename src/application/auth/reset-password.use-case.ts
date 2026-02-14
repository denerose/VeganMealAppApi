import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { PasswordValidator } from '@/infrastructure/auth/password/password-validator';

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  message: string;
};

/**
 * Use case for resetting a password using a reset token.
 * Validates the token, checks expiration, and updates the password.
 */
export class ResetPasswordUseCase {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
    private passwordHasher: BcryptPasswordHasher
  ) {}

  /**
   * Resets a user's password using a valid reset token.
   * @param request - Reset password request containing token and new password
   * @returns Success message
   * @throws Error if token is invalid, expired, or already used
   */
  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    // Validate new password
    const passwordValidation = PasswordValidator.validate(request.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    // T067: Find valid, unused, non-expired token
    const resetToken = await this.authRepository.findPasswordResetTokenByToken(request.token);

    // T080: Error handling for expired/invalid reset tokens (401 Unauthorized)
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const newPasswordHash = await this.passwordHasher.hash(request.newPassword);

    // Update user's password
    await this.userRepository.updatePasswordHash(resetToken.userId, newPasswordHash);

    // T068: Mark token as used (mark usedAt timestamp)
    await this.authRepository.markPasswordResetTokenAsUsed(resetToken.id, new Date());

    return {
      message: 'Password reset successfully',
    };
  }
}
