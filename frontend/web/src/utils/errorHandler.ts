import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly status: number;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;
    return new ApiError(
      response?.message || error.message,
      response?.code || 'UNKNOWN_ERROR',
      error.response?.status || 500,
      response?.details
    );
  }

  if (error instanceof Error) {
    return new ApiError(
      error.message,
      'UNKNOWN_ERROR',
      500
    );
  }

  return new ApiError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  );
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof AxiosError && !error.response;
};

export const formatErrorMessage = (error: unknown): string => {
  const apiError = handleApiError(error);
  
  switch (apiError.code) {
    case 'UNAUTHORIZED':
      return 'Please log in to continue';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action';
    case 'NOT_FOUND':
      return 'The requested resource was not found';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again';
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection';
    default:
      return apiError.message;
  }
}; 