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
import { createErrorBody, errorMessage } from '../dtos/common.dto';
import { jsonResponse } from '../response.utils';
import type { RouteContext } from '../routes';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase
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
        return jsonResponse(
          createErrorBody('Missing required fields: email, password, nickname, tenantName'),
          400
        );
      }

      const result = await this.registerUserUseCase.execute(registerRequest);
      const authResponse: AuthResponse = toAuthResponse(result);

      return jsonResponse(authResponse, 201);
    } catch (error) {
      console.error('Error registering user:', error);

      const msg = errorMessage(error);
      if (msg.includes('Unique constraint') || msg.includes('email')) {
        return jsonResponse(createErrorBody('Email already registered'), 409);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('required')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async login(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const loginRequest = body as LoginRequest;

      // Basic validation
      if (!loginRequest.email || !loginRequest.password) {
        return jsonResponse(createErrorBody('Missing required fields: email, password'), 400);
      }

      const result = await this.authenticateUserUseCase.execute(loginRequest);
      const authResponse: AuthResponse = toAuthResponse(result);

      return jsonResponse(authResponse);
    } catch (error) {
      console.error('Error authenticating user:', error);

      const msg = errorMessage(error);
      if (msg === 'Invalid credentials') {
        return jsonResponse(createErrorBody('Invalid credentials'), 401);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('required')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async changePassword(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId) {
        return jsonResponse(createErrorBody('Authentication required'), 401);
      }

      const body = (await context.request.json()) as unknown;
      const changePasswordRequest = body as ChangePasswordRequest;

      // Basic validation
      if (!changePasswordRequest.currentPassword || !changePasswordRequest.newPassword) {
        return jsonResponse(
          createErrorBody('Missing required fields: currentPassword, newPassword'),
          400
        );
      }

      const result = await this.changePasswordUseCase.execute({
        userId: context.userId,
        tenantId: context.tenantId,
        currentPassword: changePasswordRequest.currentPassword,
        newPassword: changePasswordRequest.newPassword,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error('Error changing password:', error);

      const msg = errorMessage(error);
      if (msg === 'Current password is incorrect') {
        return jsonResponse(createErrorBody(msg), 400);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('required')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async requestPasswordReset(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const passwordResetRequest = body as PasswordResetRequest;

      // Basic validation
      if (!passwordResetRequest.email) {
        return jsonResponse(createErrorBody('Missing required field: email'), 400);
      }

      // Get reset URL from environment or use default
      const resetUrl = process.env.PASSWORD_RESET_URL ?? 'http://localhost:5173/reset-password';

      const result = await this.requestPasswordResetUseCase.execute({
        email: passwordResetRequest.email,
        resetUrl,
      });

      return jsonResponse(result);
    } catch (error) {
      console.error('Error requesting password reset:', error);

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async resetPassword(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const resetPasswordRequest = body as ResetPasswordRequest;

      // Basic validation
      if (!resetPasswordRequest.token || !resetPasswordRequest.newPassword) {
        return jsonResponse(createErrorBody('Missing required fields: token, newPassword'), 400);
      }

      const result = await this.resetPasswordUseCase.execute(resetPasswordRequest);

      return jsonResponse(result);
    } catch (error) {
      console.error('Error resetting password:', error);

      const msg = errorMessage(error);
      if (msg === 'Invalid or expired reset token' || msg.includes('Invalid or expired')) {
        return jsonResponse(createErrorBody(msg), 401);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('required')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async getProfile(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId || !context.tenantId) {
        return jsonResponse(createErrorBody('Authentication required'), 401);
      }

      const result = await this.getUserProfileUseCase.execute({
        userId: context.userId,
        tenantId: context.tenantId,
      });

      const profile: UserProfile = toUserProfile(result);

      return jsonResponse(profile);
    } catch (error) {
      console.error('Error getting user profile:', error);

      const msg = errorMessage(error);
      if (msg === 'User not found' || msg === 'Tenant not found') {
        return jsonResponse(createErrorBody(msg), 404);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async updateProfile(context: RouteContext): Promise<Response> {
    try {
      if (!context.userId || !context.tenantId) {
        return jsonResponse(createErrorBody('Authentication required'), 401);
      }

      const body = (await context.request.json()) as unknown;
      const updateProfileRequest = body as UpdateProfileRequest;

      // Basic validation
      if (!updateProfileRequest.nickname) {
        return jsonResponse(createErrorBody('Missing required field: nickname'), 400);
      }

      if (updateProfileRequest.email !== undefined) {
        return jsonResponse(createErrorBody('Email cannot be changed'), 400);
      }

      const result = await this.updateUserProfileUseCase.execute({
        userId: context.userId,
        tenantId: context.tenantId,
        nickname: updateProfileRequest.nickname,
        email: updateProfileRequest.email,
      });

      const profile: UserProfile = toUserProfile(result);

      return jsonResponse(profile);
    } catch (error) {
      console.error('Error updating user profile:', error);

      const msg = errorMessage(error);
      if (msg === 'Email cannot be changed') {
        return jsonResponse(createErrorBody(msg), 400);
      }
      if (msg === 'User not found' || msg === 'Tenant not found') {
        return jsonResponse(createErrorBody(msg), 404);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('required')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }
}
