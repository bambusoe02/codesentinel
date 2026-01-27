// Safe logger import - won't break if logger fails
let logger: {
  error: (message: string, context?: unknown) => void;
  info: (message: string, context?: unknown) => void;
  warn: (message: string, context?: unknown) => void;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loggerModule = require('./logger');
  logger = loggerModule.logger || null;
} catch {
  // Logger not available - use console as fallback
  logger = {
    error: (message: string, context?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(message, context);
      }
    },
    info: (message: string, context?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.info(message, context);
      }
    },
    warn: (message: string, context?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(message, context);
      }
    },
  };
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const;

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'ENCRYPTION_KEY',
  'ANTHROPIC_API_KEY',
  'GITHUB_TOKEN',
] as const;

/**
 * Patterns that indicate hardcoded secrets (should not appear in code)
 */
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/, // API keys
  /pk_[a-zA-Z0-9]{32,}/, // Publishable keys
  /ghp_[a-zA-Z0-9]{36}/, // GitHub tokens
  /['"](sk-|pk_|ghp_)[a-zA-Z0-9]+['"]/, // Quoted secrets
] as const;

/**
 * Validate environment variables at startup
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(`Recommended environment variable not set: ${envVar}`);
    }
  }

  // Log warnings (non-blocking)
  if (warnings.length > 0 && logger) {
    try {
      logger.warn('Environment validation warnings', { warnings });
    } catch {
      // Logger might not be available, ignore
    }
  }

  // Log errors (blocking)
  if (errors.length > 0 && logger) {
    try {
      logger.error('Environment validation failed', { errors });
    } catch {
      // Logger might not be available, ignore
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for hardcoded secrets in environment variables (development only)
 * This is a safety check - should not find any in production
 */
export function checkForHardcodedSecrets(): { found: boolean; matches: string[] } {
  if (process.env.NODE_ENV === 'production') {
    // Skip in production for performance
    return { found: false, matches: [] };
  }

  const matches: string[] = [];

  // Check all environment variables
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        matches.push(`Potential hardcoded secret in ${key} (first 10 chars: ${value.substring(0, 10)}...)`);
        if (logger) {
          try {
            logger.warn('Potential hardcoded secret detected', {
              variable: key,
              preview: value.substring(0, 20) + '...',
            });
          } catch {
            // Logger might not be available, ignore
          }
        }
      }
    }
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Initialize environment validation
 * Call this at application startup
 * Safe to call - never throws errors, only logs warnings
 */
export function initEnvValidation(): void {
  try {
    const validation = validateEnv();
    
    if (!validation.valid) {
      // Use console instead of logger to avoid circular dependencies
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Environment validation failed:', validation.errors);
      }
      // In production, silently log but don't break app
      if (logger) {
        try {
          logger.error('Environment validation failed - application may not work correctly', {
            errors: validation.errors,
          });
        } catch {
          // Logger might not be available, ignore
        }
      }
    } else {
      // Only log in development to reduce noise
      if (process.env.NODE_ENV === 'development') {
        if (logger) {
          try {
            logger.info('Environment validation passed', {
              warnings: validation.warnings,
            });
          } catch {
            // Logger might not be available, ignore
          }
        }
      }
    }

    // Check for hardcoded secrets (development only)
    if (process.env.NODE_ENV === 'development') {
      try {
        const secretCheck = checkForHardcodedSecrets();
        if (secretCheck.found) {
          console.warn('⚠️ Potential hardcoded secrets detected:', secretCheck.matches);
          if (logger) {
            try {
              logger.warn('Potential hardcoded secrets detected', {
                matches: secretCheck.matches,
              });
            } catch {
              // Logger might not be available, ignore
            }
          }
        }
      } catch (error) {
        // Silently fail - secret check is non-critical
        if (process.env.NODE_ENV === 'development') {
          console.warn('Secret check failed (non-critical):', error);
        }
      }
    }
  } catch (error) {
    // Never throw - validation is non-critical
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Environment validation initialization error (non-critical):', error);
    }
  }
}

