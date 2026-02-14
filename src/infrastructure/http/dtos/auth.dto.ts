import type { RegisterUserResponse } from '@/application/auth/register-user.use-case';
import type { AuthenticateUserResponse } from '@/application/auth/authenticate-user.use-case';
import type { GetUserProfileResponse } from '@/application/auth/get-user-profile.use-case';
import type { UpdateUserProfileResponse } from '@/application/auth/update-user-profile.use-case';

export type RegisterRequest = {
  email: string;
  password: string;
  nickname: string;
  tenantName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    tenantId: string;
    tenantName: string;
    isTenantAdmin: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export const toAuthResponse = (
  response: RegisterUserResponse | AuthenticateUserResponse
): AuthResponse => ({
  token: response.token,
  user: {
    id: response.user.id,
    email: response.user.email,
    nickname: response.user.nickname,
    tenantId: response.user.tenantId,
    tenantName: response.user.tenantName,
    isTenantAdmin: response.user.isTenantAdmin,
    createdAt: response.user.createdAt.toISOString(),
    updatedAt: response.user.updatedAt.toISOString(),
  },
});

export type UserProfile = {
  id: string;
  email: string;
  nickname: string;
  tenantId: string;
  tenantName: string;
  isTenantAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileRequest = {
  nickname: string;
  email?: string; // Optional; if provided, should be rejected (email is immutable)
};

export const toUserProfile = (
  response: GetUserProfileResponse | UpdateUserProfileResponse
): UserProfile => ({
  id: response.id,
  email: response.email,
  nickname: response.nickname,
  tenantId: response.tenantId,
  tenantName: response.tenantName,
  isTenantAdmin: response.isTenantAdmin,
  createdAt: response.createdAt.toISOString(),
  updatedAt: response.updatedAt.toISOString(),
});
