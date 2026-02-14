/**
 * Email template for password reset emails.
 * Password reset email template implementation.
 */

export type PasswordResetEmailData = {
  resetLink: string;
  token: string;
};

/**
 * Generates HTML content for password reset email.
 */
export const generatePasswordResetEmailHtml = (data: PasswordResetEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body>
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${data.resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
    </html>
  `;
};

/**
 * Generates plain text content for password reset email.
 */
export const generatePasswordResetEmailText = (data: PasswordResetEmailData): string => {
  return `Password Reset Request

You requested to reset your password. Visit the following link to reset it:
${data.resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.`;
};
