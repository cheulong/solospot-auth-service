import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateOtp, otpExpiresIn } from './otp';

describe('generateOtp', () => {
  it('should return a 6-digit numeric string', () => {
    const otp = generateOtp();

    expect(typeof otp).toBe('string');
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate values within range', () => {
    // Run multiple times to reduce false positives
    for (let i = 0; i < 100; i++) {
      const otp = Number(generateOtp());
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThan(999999);
    }
  });
});

describe('otpExpiresIn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a Date object', () => {
    const expiresAt = otpExpiresIn();
    expect(expiresAt).toBeInstanceOf(Date);
  });

  it('should default to 15 minutes', () => {
    const expiresAt = otpExpiresIn();
    const expected = new Date('2025-01-01T00:15:00Z');

    expect(expiresAt.getTime()).toBe(expected.getTime());
  });

  it('should respect custom minutes', () => {
    const expiresAt = otpExpiresIn(30);
    const expected = new Date('2025-01-01T00:30:00Z');

    expect(expiresAt.getTime()).toBe(expected.getTime());
  });
});
