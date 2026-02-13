export type PaginationDto = {
  total: number;
  limit: number;
  offset: number;
};

export type ErrorResponseDto = {
  message: string;
  details?: Record<string, unknown> | string[];
};

export type ApiResponse<T> = {
  data: T;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationDto;
};

export const createErrorBody = (
  message: string,
  details?: ErrorResponseDto['details']
): { error: ErrorResponseDto } => ({
  error: {
    message,
    details,
  },
});
