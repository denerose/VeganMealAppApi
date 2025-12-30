export class ValidationError extends Error {
  constructor(message: string, public readonly details?: Record<string, unknown> | string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

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
  message = 'Validation failed',
): T => {
  if (!predicate(payload)) {
    throw new ValidationError(message);
  }

  return payload;
};
