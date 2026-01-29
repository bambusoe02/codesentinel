import {
  validateString,
  validateEmail,
  validateGitHubToken,
  validateArray,
  validateNumber,
  sanitizeString,
} from '@/lib/input-validation';

describe('Input Validation', () => {
  describe('validateString', () => {
    it('should validate a valid string', () => {
      const result = validateString('hello');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should reject empty string when required', () => {
      const result = validateString('', { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should validate minLength', () => {
      const result = validateString('hi', { minLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should validate maxLength', () => {
      const result = validateString('a'.repeat(10001), { maxLength: 10000 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not exceed');
    });

    it('should validate pattern', () => {
      const result = validateString('hello', { pattern: /^[A-Z]+$/ });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format is invalid');
    });
  });

  describe('validateEmail', () => {
    it('should validate a valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const result = validateEmail('not-an-email');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGitHubToken', () => {
    it('should validate a valid GitHub token', () => {
      const result = validateGitHubToken('ghp_' + 'a'.repeat(36));
      expect(result.valid).toBe(true);
    });

    it('should reject invalid token format', () => {
      const result = validateGitHubToken('invalid-token');
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const result = sanitizeString('hello\x00world');
      expect(result).toBe('helloworld');
    });

    it('should trim and limit length', () => {
      const result = sanitizeString('  ' + 'a'.repeat(20000), 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });
});

