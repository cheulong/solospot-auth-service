import { describe, it, expect, beforeAll } from 'vitest';

let jwtUtils: typeof import('./jwt');

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

  // IMPORTANT: dynamic import AFTER env is set
  jwtUtils = await import('./jwt');
});

describe('JWT utils', () => {
  const payload = {
    userId: '123',
    email: 'test@example.com',
  };

  it('should generate and verify access token', () => {
    const token = jwtUtils.generateToken(payload);
    expect(token).toBeTypeOf('string');

    const decoded = jwtUtils.verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should generate and verify refresh token', () => {
    const token = jwtUtils.generateRefreshToken({
      ...payload,
      refreshTokenId: 'refresh-123',
    });

    const decoded = jwtUtils.verifyRefreshToken(token);
    expect(decoded.refreshTokenId).toBe('refresh-123');
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should decode token without verifying', () => {
    const token = jwtUtils.generateToken(payload);
    const decoded = jwtUtils.decodeToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
  });

  it('should throw error for invalid token', () => {
    expect(() => {
      jwtUtils.verifyToken('invalid.token.here');
    }).toThrow();
  });
});
