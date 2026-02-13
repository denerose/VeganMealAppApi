import nodemailer from 'nodemailer';

const getEnv = (key: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvOptional = (key: string, defaultValue: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  return value ?? defaultValue;
};

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Service for sending emails via SMTP.
 * Used for password reset emails and other transactional emails.
 */
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    const smtpHost = getEnv('SMTP_HOST');
    const smtpPort = parseInt(getEnvOptional('SMTP_PORT', '587'), 10);
    const smtpSecure = getEnvOptional('SMTP_SECURE', 'false') === 'true';
    const smtpUser = getEnv('SMTP_USER');
    const smtpPass = getEnv('SMTP_PASS');
    this.from = getEnv('SMTP_FROM');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  /**
   * Sends an email.
   * @param options - Email options (to, subject, html, text)
   * @returns Promise resolving to message info if successful
   * @throws Error if email delivery fails
   */
  async sendEmail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return info;
    } catch (error) {
      // Log error but don't expose internal details
      console.error('Email delivery failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Sends a password reset email with reset link.
   * @param email - Recipient email address
   * @param resetToken - Password reset token to include in link
   * @param resetUrl - Base URL for password reset (e.g., https://app.example.com/reset-password)
   * @returns Promise resolving to message info if successful
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    resetUrl: string
  ): Promise<nodemailer.SentMessageInfo> {
    const resetLink = `${resetUrl}?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
        </head>
        <body>
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </body>
      </html>
    `;

    const text = `Password Reset Request\n\nYou requested to reset your password. Visit the following link to reset it:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
      text,
    });
  }
}
