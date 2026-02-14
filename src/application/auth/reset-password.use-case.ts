import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { PasswordHasher } from '@/domain/auth/password-hasher.interface';
import type { UserRepository } from '@/domain/user/user.repository';
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
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
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

    const resetToken = await this.authRepository.findPasswordResetTokenByToken(request.token);

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const newPasswordHash = await this.passwordHasher.hash(request.newPassword);

    // Update user's password
    await this.userRepository.updatePasswordHash(resetToken.userId, newPasswordHash);

    await this.authRepository.markPasswordResetTokenAsUsed(resetToken.id, new Date());

    return {
      message: 'Password reset successfully',
    };
  }
}
