import type { RegisterUserUseCase } from '@/application/auth/register-user.use-case';
import type { AuthenticateUserUseCase } from '@/application/auth/authenticate-user.use-case';
import type { ChangePasswordUseCase } from '@/application/auth/change-password.use-case';
import type { RequestPasswordResetUseCase } from '@/application/auth/request-password-reset.use-case';
import type { ResetPasswordUseCase } from '@/application/auth/reset-password.use-case';
import type { GetUserProfileUseCase } from '@/application/auth/get-user-profile.use-case';
import type { UpdateUserProfileUseCase } from '@/application/auth/update-user-profile.use-case';
import type {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  PasswordResetRequest,
  ResetPasswordRequest,
  AuthResponse,
  UpdateProfileRequest,
  UserProfile,
} from '../dtos/auth.dto';
import { toAuthResponse, toUserProfile } from '../dtos/auth.dto';
import { createErrorBody } from '../dtos/common.dto';
import type { RouteContext } from '../routes';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private authenticateUserUseCase: AuthenticateUserUseCase,
    private changePasswordUseCase: ChangePasswordUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase
  ) {}

  async register(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const registerRequest = body as RegisterRequest;

      // Basic validation
      if (
        !registerRequest.email ||
        !registerRequest.password ||
        !registerRequest.nickname ||
        !registerRequest.tenantName
      ) {
        return new Response(
          JSON.stringify(
            createErrorBody('Missing required fields: email, password, nickname, tenantName')
          ),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await this.registerUserUseCase.execute(registerRequest);
      const authResponse: AuthResponse = toAuthResponse(result);

      return new Response(JSON.stringify(authResponse), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error registering user:', error);

      if (error instanceof Error) {
        // T035: Add error handling for duplicate email (409 Conflict)
        if (error.message.includes('Unique constraint') || error.message.includes('email')) {
          return new Response(JSON.stringify(createErrorBody('Email already registered')), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // T036: Add error handling for validation errors (400 Bad Request)
        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('required')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T049: Login method for authenticating users.
   * Authenticates user with email and password, returns JWT token.
   */
  async login(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const loginRequest = body as LoginRequest;

      // Basic validation
      if (!loginRequest.email || !loginRequest.password) {
        return new Response(
          JSON.stringify(createErrorBody('Missing required fields: email, password')),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await this.authenticateUserUseCase.execute(loginRequest);
      const authResponse: AuthResponse = toAuthResponse(result);

      return new Response(JSON.stringify(authResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error authenticating user:', error);

      if (error instanceof Error) {
        // T044: Generic error message (don't reveal if email exists)
        if (error.message === 'Invalid credentials') {
          return new Response(JSON.stringify(createErrorBody('Invalid credentials')), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Validation errors
        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('required')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T071: Password change method for authenticated users.
   * Changes password after verifying current password.
   */
  async changePassword(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId) {
        return new Response(JSON.stringify(createErrorBody('Authentication required')), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = (await context.request.json()) as unknown;
      const changePasswordRequest = body as ChangePasswordRequest;

      // Basic validation
      if (!changePasswordRequest.currentPassword || !changePasswordRequest.newPassword) {
        return new Response(
          JSON.stringify(createErrorBody('Missing required fields: currentPassword, newPassword')),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await this.changePasswordUseCase.execute({
        userId: context.userId,
        currentPassword: changePasswordRequest.currentPassword,
        newPassword: changePasswordRequest.newPassword,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error changing password:', error);

      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('required')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T072: Password reset request method.
   * Generates reset token and sends email.
   */
  async requestPasswordReset(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const passwordResetRequest = body as PasswordResetRequest;

      // Basic validation
      if (!passwordResetRequest.email) {
        return new Response(JSON.stringify(createErrorBody('Missing required field: email')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get reset URL from environment or use default
      const resetUrl = process.env.PASSWORD_RESET_URL ?? 'http://localhost:5173/reset-password';

      const result = await this.requestPasswordResetUseCase.execute({
        email: passwordResetRequest.email,
        resetUrl,
      });

      // T079: Generic success message (don't reveal if email exists)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T073: Password reset completion method.
   * Resets password using reset token.
   */
  async resetPassword(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const resetPasswordRequest = body as ResetPasswordRequest;

      // Basic validation
      if (!resetPasswordRequest.token || !resetPasswordRequest.newPassword) {
        return new Response(
          JSON.stringify(createErrorBody('Missing required fields: token, newPassword')),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await this.resetPasswordUseCase.execute(resetPasswordRequest);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error resetting password:', error);

      if (error instanceof Error) {
        // T080: Error handling for expired/invalid reset tokens (401 Unauthorized)
        if (
          error.message === 'Invalid or expired reset token' ||
          error.message.includes('Invalid or expired')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('required')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T088: Get user profile method.
   * Retrieves the authenticated user's profile information.
   */
  async getProfile(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId || !context.tenantId) {
        return new Response(JSON.stringify(createErrorBody('Authentication required')), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await this.getUserProfileUseCase.execute({
        userId: context.userId,
        tenantId: context.tenantId,
      });

      const profile: UserProfile = toUserProfile(result);

      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error getting user profile:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found' || error.message === 'Tenant not found') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * T089: Update user profile method.
   * Updates the authenticated user's profile (nickname only, email is immutable).
   * T094: Error handling for email update attempts (400 Bad Request).
   */
  async updateProfile(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId || !context.tenantId) {
        return new Response(JSON.stringify(createErrorBody('Authentication required')), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = (await context.request.json()) as unknown;
      const updateProfileRequest = body as UpdateProfileRequest;

      // Basic validation
      if (!updateProfileRequest.nickname) {
        return new Response(JSON.stringify(createErrorBody('Missing required field: nickname')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // T094: Error handling for email update attempts (400 Bad Request)
      if (updateProfileRequest.email !== undefined) {
        return new Response(JSON.stringify(createErrorBody('Email cannot be changed')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await this.updateUserProfileUseCase.execute({
        userId: context.userId,
        tenantId: context.tenantId,
        nickname: updateProfileRequest.nickname,
        email: updateProfileRequest.email,
      });

      const profile: UserProfile = toUserProfile(result);

      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating user profile:', error);

      if (error instanceof Error) {
        // T094: Error handling for email update attempts (400 Bad Request)
        if (error.message === 'Email cannot be changed') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (error.message === 'User not found' || error.message === 'Tenant not found') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Validation errors
        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('required')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
