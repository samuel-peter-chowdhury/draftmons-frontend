/**
 * Validation utilities for API responses
 */

/**
 * Validates that a value is not null or undefined
 */
export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validates that a response has expected fields
 */
export function validateResponse<T extends object>(
  data: unknown,
  requiredFields: (keyof T)[]
): data is T {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return requiredFields.every((field) => {
    const fieldName = String(field);
    return fieldName in obj && obj[fieldName] !== undefined;
  });
}

/**
 * Type guard for checking if an error is an ApiError
 */
export function isApiError(error: unknown): error is { message: string; status?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Safely extracts error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Validates that a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Validates pagination response structure
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function validatePaginationResponse<T>(
  data: unknown
): data is { data: T[]; page: number; pageSize: number; total: number; totalPages: number } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    'data' in obj &&
    isArray(obj.data) &&
    'page' in obj &&
    typeof obj.page === 'number' &&
    'pageSize' in obj &&
    typeof obj.pageSize === 'number' &&
    'total' in obj &&
    typeof obj.total === 'number' &&
    'totalPages' in obj &&
    typeof obj.totalPages === 'number'
  );
}
