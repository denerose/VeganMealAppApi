/**
 * Domain entity representing a password reset token.
 * Temporary, single-use credential for password recovery.
 */
export type PasswordResetToken = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

/**
 * Creates a PasswordResetToken domain entity.
 */
export const createPasswordResetToken = (
  id: string,
  token: string,
  userId: string,
  expiresAt: Date,
  usedAt: Date | null,
  createdAt: Date
): PasswordResetToken => ({
  id,
  token,
  userId,
  expiresAt,
  usedAt,
  createdAt,
});

/**
 * Checks if a password reset token is valid (not expired and not used).
 */
export const isTokenValid = (resetToken: PasswordResetToken): boolean => {
  const now = new Date();
  return resetToken.expiresAt > now && resetToken.usedAt === null;
};
