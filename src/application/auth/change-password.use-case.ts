import type { PasswordHasher } from '@/domain/auth/password-hasher.interface';
import type { UserRepository } from '@/domain/user/user.repository';
import { PasswordValidator } from '@/infrastructure/auth/password/password-validator';

export type ChangePasswordRequest = {
  userId: string;
  tenantId: string;
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

/**
 * Use case for changing a user's password.
 * Requires current password verification before allowing the change.
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  /**
   * Changes a user's password after verifying the current password.
   * @param request - Change password request containing userId, currentPassword, and newPassword
   * @returns Success message
   * @throws Error if current password is incorrect or new password is invalid
   */
  async execute(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    // Validate new password
    const passwordValidation = PasswordValidator.validate(request.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    // Get user with password hash
    const user = await this.userRepository.findById(request.userId, request.tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);
    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new Error('User does not have a password set');
    }

    // Verify current password
    const isValidCurrentPassword = await this.passwordHasher.compare(
      request.currentPassword,
      userWithPassword.passwordHash
    );

    if (!isValidCurrentPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordHasher.hash(request.newPassword);

    // Update password hash
    await this.userRepository.updatePasswordHash(request.userId, newPasswordHash);

    return {
      message: 'Password changed successfully',
    };
  }
}
