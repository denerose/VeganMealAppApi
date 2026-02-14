import { RateLimiterMemory } from 'rate-limiter-flexible';

const getEnv = (key: string, defaultValue?: string): string => {
  const value = Bun.env[key] ?? process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue ?? '';
};

/**
 * Service for rate limiting authentication endpoints.
 * Prevents brute force attacks by limiting attempts per IP address.
 */
export class RateLimiterService {
  private readonly loginLimiter: RateLimiterMemory;
  private readonly passwordResetLimiter: RateLimiterMemory;
  private readonly registrationLimiter: RateLimiterMemory;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = getEnv('RATE_LIMIT_ENABLED', 'true') === 'true';

    // Login: 3 attempts per 10 minutes per IP
    this.loginLimiter = new RateLimiterMemory({
      points: 3,
      duration: 600, // 10 minutes in seconds
    });

    // Password reset: 3 attempts per 10 minutes per IP
    this.passwordResetLimiter = new RateLimiterMemory({
      points: 3,
      duration: 600, // 10 minutes in seconds
    });

    // Registration: 5 attempts per 15 minutes per IP (less strict)
    this.registrationLimiter = new RateLimiterMemory({
      points: 5,
      duration: 900, // 15 minutes in seconds
    });
  }

  /**
   * Checks if a request from the given IP should be rate limited.
   * @param ip - IP address of the requester
   * @param type - Type of rate limit to check
   * @returns Promise resolving to true if request should be allowed, false if rate limited
   */
  async checkLimit(ip: string, type: 'login' | 'passwordReset' | 'registration'): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    const limiter =
      type === 'login'
        ? this.loginLimiter
        : type === 'passwordReset'
          ? this.passwordResetLimiter
          : this.registrationLimiter;

    try {
      await limiter.consume(ip);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the remaining time until rate limit resets (in seconds).
   * @param ip - IP address of the requester
   * @param type - Type of rate limit to check
   * @returns Promise resolving to seconds until reset, or 0 if not rate limited
   */
  async getTimeUntilReset(
    ip: string,
    type: 'login' | 'passwordReset' | 'registration'
  ): Promise<number> {
    if (!this.enabled) {
      return 0;
    }

    const limiter =
      type === 'login'
        ? this.loginLimiter
        : type === 'passwordReset'
          ? this.passwordResetLimiter
          : this.registrationLimiter;

    const rateLimiterRes = await limiter.get(ip);
    if (!rateLimiterRes) {
      return 0;
    }

    const msBeforeNext = rateLimiterRes.msBeforeNext;
    return msBeforeNext > 0 ? Math.ceil(msBeforeNext / 1000) : 0;
  }
}
