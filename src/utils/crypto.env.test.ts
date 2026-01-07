import { describe, it, expect } from 'vitest';

describe('ENCRYPTION_KEY env validation', () => {
  it('should throw if ENCRYPTION_KEY is missing', async () => {
    delete process.env.ENCRYPTION_KEY;

    await expect(async () => {
      await import('./crypto');
    }).rejects.toThrow('ENCRYPTION_KEY environment variable is required');
  });
});
