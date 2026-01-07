import { describe, it, expect, beforeAll } from 'vitest';

let cryptoUtils: typeof import('./crypto');

beforeAll(async () => {
  // Set env BEFORE importing the module
  process.env.ENCRYPTION_KEY = 'super-secret-test-key';

  cryptoUtils = await import('./crypto');
});

describe('encryptSecret / decryptSecret', () => {
  it('should encrypt and decrypt text correctly', () => {
    const plaintext = 'my-very-secret-value';

    const encrypted = cryptoUtils.encryptSecret(plaintext);

    expect(encrypted).toBeTypeOf('string');
    expect(encrypted).not.toBe(plaintext);

    const decrypted = cryptoUtils.decryptSecret(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should generate different encrypted output for same input', () => {
    const plaintext = 'same-input';

    const encrypted1 = cryptoUtils.encryptSecret(plaintext);
    const encrypted2 = cryptoUtils.encryptSecret(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw when decrypting with modified data', () => {
    const plaintext = 'tamper-test';
    const encrypted = cryptoUtils.encryptSecret(plaintext);

    // Tamper with encrypted payload
    const tampered = encrypted.replace(/.$/, '0');

    expect(() => {
      cryptoUtils.decryptSecret(tampered);
    }).toThrow();
  });
});
