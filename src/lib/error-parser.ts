/**
 * Utility functions for parsing database errors, especially NeonDbError
 * NeonDbError has a nested structure where error.cause contains the actual error details
 */

export interface ParsedDbError {
  code?: string;
  detail?: string;
  constraint?: string;
  message?: string;
  hint?: string;
  name?: string;
}

/**
 * Parse a database error (especially NeonDbError) to extract useful information
 * NeonDbError structure: error.cause contains the actual error details
 */
export function parseDbError(error: unknown): ParsedDbError {
  const errorObj = error as {
    message?: string;
    code?: string;
    constraint?: string;
    detail?: string;
    hint?: string;
    name?: string;
    cause?: ParsedDbError | {
      code?: string;
      detail?: string;
      constraint?: string;
      message?: string;
      hint?: string;
      name?: string;
    };
  };

  // Extract from nested cause (NeonDbError structure)
  const cause = errorObj.cause;
  
  return {
    code: errorObj.code || (cause && typeof cause === 'object' ? cause.code : undefined),
    detail: errorObj.detail || (cause && typeof cause === 'object' ? cause.detail : undefined),
    constraint: errorObj.constraint || (cause && typeof cause === 'object' ? cause.constraint : undefined),
    message: errorObj.message || (cause && typeof cause === 'object' ? cause.message : undefined),
    hint: errorObj.hint || (cause && typeof cause === 'object' ? cause.hint : undefined),
    name: errorObj.name || (cause && typeof cause === 'object' ? cause.name : undefined),
  };
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: unknown): boolean {
  const parsed = parseDbError(error);
  return parsed.code === '23505' || !!parsed.constraint?.includes('unique') || !!parsed.constraint?.includes('_key');
}

/**
 * Check if error is a foreign key constraint violation
 */
export function isForeignKeyError(error: unknown): boolean {
  const parsed = parseDbError(error);
  return parsed.code === '23503' || !!parsed.constraint?.includes('foreign');
}

/**
 * Check if error is a not null constraint violation
 */
export function isNotNullError(error: unknown): boolean {
  const parsed = parseDbError(error);
  return parsed.code === '23502';
}

/**
 * Get a user-friendly error message from a database error
 */
export function getDbErrorMessage(error: unknown): string {
  const parsed = parseDbError(error);
  
  if (parsed.code === '23505') {
    return `Duplicate entry: ${parsed.detail || 'Unique constraint violation'}`;
  }
  
  if (parsed.code === '23503') {
    return `Foreign key violation: ${parsed.detail || 'Referenced record does not exist'}`;
  }
  
  if (parsed.code === '23502') {
    return `Required field missing: ${parsed.detail || 'Not null constraint violation'}`;
  }
  
  return parsed.message || parsed.detail || 'Database error occurred';
}

