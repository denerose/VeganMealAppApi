export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown> | string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Security-focused validation schemas
export const VALIDATION_RULES = {
  // String length limits
  STRING_MAX_LENGTH: 1000,
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 5000,
  EMAIL_MAX_LENGTH: 255,

  // Numeric limits
  PAGINATION_MAX_LIMIT: 1000,
  PAGINATION_DEFAULT_LIMIT: 50,

  // Pattern validation
  UUID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
};

// Rate limiting configuration (can be integrated with middleware)
export const RATE_LIMIT_CONFIG = {
  // 100 requests per minute per IP/user
  WINDOW_MS: 60000,
  MAX_REQUESTS_PER_WINDOW: 100,

  // Stricter limits for mutations
  MUTATION_WINDOW_MS: 60000,
  MUTATION_MAX_REQUESTS: 30,
};

export const parseJson = async <T = unknown>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }
};

export const ensureValid = <T>(
  payload: unknown,
  predicate: (candidate: unknown) => candidate is T,
  message = 'Validation failed'
): T => {
  if (!predicate(payload)) {
    throw new ValidationError(message);
  }

  return payload;
};

// Input sanitization helpers
export const sanitizeString = (
  input: string,
  maxLength = VALIDATION_RULES.STRING_MAX_LENGTH
): string => {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }

  if (input.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`);
  }

  // Remove leading/trailing whitespace
  return input.trim();
};

export const validateUUID = (input: string): boolean => {
  return VALIDATION_RULES.UUID_PATTERN.test(input);
};

export const validateDate = (input: string): boolean => {
  if (!VALIDATION_RULES.DATE_PATTERN.test(input)) {
    return false;
  }

  // Additional validation to check if date is valid
  const date = new Date(input);
  return !isNaN(date.getTime());
};

export const validateEmail = (input: string): boolean => {
  return (
    VALIDATION_RULES.EMAIL_PATTERN.test(input) && input.length <= VALIDATION_RULES.EMAIL_MAX_LENGTH
  );
};

export const validatePagination = (
  limit?: string,
  offset?: string
): { limit: number; offset: number } => {
  let parsedLimit = VALIDATION_RULES.PAGINATION_DEFAULT_LIMIT;
  let parsedOffset = 0;

  if (limit) {
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 1) {
      throw new ValidationError('Limit must be a positive integer');
    }
    parsedLimit = Math.min(num, VALIDATION_RULES.PAGINATION_MAX_LIMIT);
  }

  if (offset) {
    const num = parseInt(offset, 10);
    if (isNaN(num) || num < 0) {
      throw new ValidationError('Offset must be a non-negative integer');
    }
    parsedOffset = num;
  }

  return { limit: parsedLimit, offset: parsedOffset };
};

// Input validation middleware factory
export const createValidationMiddleware = () => {
  return async (
    request: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> => {
    try {
      // Check Content-Type for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          return new Response(
            JSON.stringify({
              error: 'Invalid Content-Type. Expected application/json',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return await handler(request);
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(
          JSON.stringify({
            error: error.message,
            details: error.details,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  };
};
