import { describe, it, expect } from 'vitest';
import { hashString, verifyString } from "./hash";

describe('Hash functions', () => {
  it('should hash and verify a password', async () => {
    const password = "test123";
    const hash = await hashString(password);
    const isValid = await verifyString(password, hash);
    expect(isValid).toBe(true);
  });
});
