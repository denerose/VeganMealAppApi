import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import { EmailService } from '@/infrastructure/auth/email/email.service';
import { randomBytes } from 'crypto';

export type RequestPasswordResetRequest = {
  email: string;
  resetUrl: string; // Base URL for password reset (e.g., "https://app.example.com/reset-password")
};

export type RequestPasswordResetResponse = {
  message: string;
};

/**
 * Use case for requesting a password reset.
 * Generates a reset token and sends it via email.
 * Returns generic success message even if email doesn't exist (security best practice).
 */
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly emailService: EmailService
  ) {}

  /**
   * Requests a password reset by generating a token and sending an email.
   * @param request - Request containing email and reset URL base
   * @returns Generic success message (don't reveal if email exists)
   */
  async execute(request: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
    // Find user by email
    const userWithPassword = await this.userRepository.findByEmailWithPassword(request.email);

    // Always return success to prevent user enumeration
    if (!userWithPassword) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.authRepository.createPasswordResetToken(userWithPassword.user.id, token, expiresAt);

    const resetUrl = `${request.resetUrl}?token=${token}`;
    await this.emailService.sendPasswordResetEmail(request.email, token, resetUrl);

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }
}
