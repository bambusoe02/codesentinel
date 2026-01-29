import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Maximum allowed input sizes
 */
const MAX_INPUT_SIZES = {
  JSON_BODY: 1024 * 1024, // 1MB
  STRING_FIELD: 10000, // 10KB
  ARRAY_LENGTH: 1000,
  OBJECT_KEYS: 100,
} as const;

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input: string, maxLength: number = MAX_INPUT_SIZES.STRING_FIELD): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and sanitize string input
 */
export function validateString(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    name?: string;
  } = {}
): { valid: boolean; value: string | null; error?: string } {
  const {
    required = false,
    minLength = 0,
    maxLength = MAX_INPUT_SIZES.STRING_FIELD,
    pattern,
    name = 'field',
  } = options;

  // Check if required
  if (required && (!input || (typeof input === 'string' && input.trim().length === 0))) {
    return { valid: false, value: null, error: `${name} is required` };
  }

  // Allow null/undefined if not required
  if (!input && !required) {
    return { valid: true, value: null };
  }

  // Must be string
  if (typeof input !== 'string') {
    return { valid: false, value: null, error: `${name} must be a string` };
  }

  // Sanitize
  const sanitized = sanitizeString(input, maxLength);

  // Check length
  if (sanitized.length < minLength) {
    return {
      valid: false,
      value: null,
      error: `${name} must be at least ${minLength} characters`,
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      value: null,
      error: `${name} must not exceed ${maxLength} characters`,
    };
  }

  // Check pattern
  if (pattern && !pattern.test(sanitized)) {
    return { valid: false, value: null, error: `${name} format is invalid` };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): { valid: boolean; value: string | null; error?: string } {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(email, {
    required: true,
    maxLength: 255,
    pattern: emailPattern,
    name: 'email',
  });
}

/**
 * Validate GitHub token format
 */
export function validateGitHubToken(token: unknown): { valid: boolean; value: string | null; error?: string } {
  // GitHub tokens: ghp_ for personal access tokens, ghs_ for fine-grained tokens
  const tokenPattern = /^(ghp_|ghs_)[a-zA-Z0-9]{36,}$/;
  return validateString(token, {
    required: true,
    minLength: 40,
    maxLength: 200,
    pattern: tokenPattern,
    name: 'GitHub token',
  });
}

/**
 * Validate array input
 */
export function validateArray<T>(
  input: unknown,
  options: {
    required?: boolean;
    maxLength?: number;
    itemValidator?: (item: unknown) => { valid: boolean; value: T | null; error?: string };
    name?: string;
  } = {}
): { valid: boolean; value: T[] | null; error?: string } {
  const { required = false, maxLength = MAX_INPUT_SIZES.ARRAY_LENGTH, itemValidator, name = 'array' } = options;

  if (required && (!input || !Array.isArray(input))) {
    return { valid: false, value: null, error: `${name} is required and must be an array` };
  }

  if (!input && !required) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(input)) {
    return { valid: false, value: null, error: `${name} must be an array` };
  }

  if (input.length > maxLength) {
    return { valid: false, value: null, error: `${name} must not exceed ${maxLength} items` };
  }

  // Validate items if validator provided
  if (itemValidator) {
    const validatedItems: T[] = [];
    for (let i = 0; i < input.length; i++) {
      const result = itemValidator(input[i]);
      if (!result.valid) {
        return { valid: false, value: null, error: `${name}[${i}]: ${result.error}` };
      }
      if (result.value !== null) {
        validatedItems.push(result.value);
      }
    }
    return { valid: true, value: validatedItems };
  }

  return { valid: true, value: input as T[] };
}

/**
 * Validate number input
 */
export function validateNumber(
  input: unknown,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    name?: string;
  } = {}
): { valid: boolean; value: number | null; error?: string } {
  const { required = false, min, max, integer = false, name = 'number' } = options;

  if (required && (input === null || input === undefined)) {
    return { valid: false, value: null, error: `${name} is required` };
  }

  if (!required && (input === null || input === undefined)) {
    return { valid: true, value: null };
  }

  const num = typeof input === 'string' ? parseFloat(input) : Number(input);

  if (isNaN(num)) {
    return { valid: false, value: null, error: `${name} must be a valid number` };
  }

  if (integer && !Number.isInteger(num)) {
    return { valid: false, value: null, error: `${name} must be an integer` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, value: null, error: `${name} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, value: null, error: `${name} must not exceed ${max}` };
  }

  return { valid: true, value: num };
}

/**
 * Validate and parse JSON body with size limits
 */
export async function validateJsonBody(
  request: Request,
  maxSize: number = MAX_INPUT_SIZES.JSON_BODY
): Promise<{ valid: boolean; data: unknown; error?: string; response?: NextResponse }> {
  try {
    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        valid: false,
        data: null,
        error: 'Content-Type must be application/json',
        response: NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 }),
      };
    }

    // Check Content-Length
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return {
          valid: false,
          data: null,
          error: `Request body too large (max ${maxSize} bytes)`,
          response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }),
        };
      }
    }

    // Parse JSON with size limit
    const text = await request.text();
    if (text.length > maxSize) {
      return {
        valid: false,
        data: null,
        error: `Request body too large (max ${maxSize} bytes)`,
        response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }),
      };
    }

    const data = JSON.parse(text);

    // Validate object structure (prevent prototype pollution)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      if (keys.length > MAX_INPUT_SIZES.OBJECT_KEYS) {
        return {
          valid: false,
          data: null,
          error: `Too many object keys (max ${MAX_INPUT_SIZES.OBJECT_KEYS})`,
          response: NextResponse.json({ error: 'Invalid request structure' }, { status: 400 }),
        };
      }

      // Check for prototype pollution attempts
      if (keys.some((key) => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
        logger.warn('Prototype pollution attempt detected', { keys });
        return {
          valid: false,
          data: null,
          error: 'Invalid object keys',
          response: NextResponse.json({ error: 'Invalid request' }, { status: 400 }),
        };
      }
    }

    return { valid: true, data };
  } catch (error) {
    logger.error('JSON body validation failed', error);
    return {
      valid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }),
    };
  }
}

/**
 * Validate URL parameter
 */
export function validateUrlParam(
  param: string | string[] | undefined,
  name: string = 'parameter'
): { valid: boolean; value: string | null; error?: string } {
  if (!param) {
    return { valid: false, value: null, error: `${name} is required` };
  }

  const value = Array.isArray(param) ? param[0] : param;
  return validateString(value, {
    required: true,
    maxLength: 500,
    name,
  });
}


