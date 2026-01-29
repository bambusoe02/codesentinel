import { logger } from './logger';

/**
 * Result type for safe async operations
 */
export type SafeAsyncResult<T> = {
  data: T | null;
  error: Error | null;
  success: boolean;
};

/**
 * Safely execute async function with error handling
 * Returns { data, error, success } instead of throwing
 * 
 * @example
 * const { data, error, success } = await safeAsync(
 *   () => fetchData(),
 *   'Failed to fetch data'
 * );
 * 
 * if (!success || !data) {
 *   // Handle error
 *   return;
 * }
 * 
 * // Use data
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<SafeAsyncResult<T>> {
  try {
    const data = await fn();
    return { data, error: null, success: true };
  } catch (error) {
    logger.error(errorMessage, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Safely execute async function with default value on error
 * Returns default value instead of null on error
 * 
 * @example
 * const data = await safeAsyncWithDefault(
 *   () => fetchData(),
 *   [],
 *   'Failed to fetch data'
 * );
 */
export async function safeAsyncWithDefault<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  errorMessage: string = 'Operation failed'
): Promise<T> {
  const result = await safeAsync(fn, errorMessage);
  return result.success && result.data !== null ? result.data : defaultValue;
}


