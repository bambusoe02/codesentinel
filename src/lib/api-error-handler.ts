import { NextResponse } from 'next/server';
import { logger } from './logger';
import { parseDbError } from './error-parser';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle API errors consistently across all routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error with full context
  logger.error('API Error occurred', error);

  // Handle known AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || 'APP_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      { status: error.statusCode }
    );
  }

  // Handle database errors
  if (error && typeof error === 'object') {
    const parsedError = parseDbError(error);
    
    // Unique constraint violation
    if (parsedError.code === '23505') {
      return NextResponse.json(
        { 
          error: 'Duplicate entry', 
          code: 'DUPLICATE_ENTRY',
          details: process.env.NODE_ENV === 'development' ? parsedError.detail : undefined,
        },
        { status: 409 }
      );
    }

    // Foreign key constraint violation
    if (parsedError.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Related data not found', 
          code: 'FOREIGN_KEY_VIOLATION',
          details: process.env.NODE_ENV === 'development' ? parsedError.detail : undefined,
        },
        { status: 400 }
      );
    }

    // Column not found
    if (parsedError.code === '42703') {
      return NextResponse.json(
        { 
          error: 'Database schema mismatch', 
          code: 'SCHEMA_ERROR',
          details: process.env.NODE_ENV === 'development' ? parsedError.detail : undefined,
        },
        { status: 500 }
      );
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';

    return NextResponse.json(
      {
        error: message,
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack, name: error.name }
          : undefined,
      },
      { status: 500 }
    );
  }

  // Generic fallback for unknown error types
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' 
        ? String(error)
        : undefined,
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with automatic error handling
 * Usage:
 * export const GET = withErrorHandler(async (req, { params }) => { ... });
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}


