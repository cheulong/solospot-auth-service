import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';

vi.mock('../repositories/auth.repository', () => ({
  createAuthRepository: vi.fn(),
}));

vi.mock('../../../security/hash', () => ({
  hashString: vi.fn(),
  verifyString: vi.fn(),
}));

vi.mock('../../../security/jwt', () => ({
  generateToken: vi.fn(() => 'access-token'),
  generateRefreshToken: vi.fn(() => 'refresh-token'),
  decodeToken: vi.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
  verifyRefreshToken: vi.fn(() => true),
}));

vi.mock('../../../utils/mailer', () => ({
  mailer: {
    sendMail: vi.fn(),
  },
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => 'qr-code'),
  },
}));

vi.mock('../../../utils/crypto', () => ({
  encryptSecret: vi.fn(v => `enc-${v}`),
  decryptSecret: vi.fn(v => v.replace('enc-', '')),
}));

import { createAuthRepository } from '../repositories/auth.repository';
import { verifyString, hashString } from '../../../security/hash';

describe('AuthService', () => {
  let authRepo: any;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();

    authRepo = {
      getByEmail: vi.fn(),
      saveRefreshToken: vi.fn(),
    };

    (createAuthRepository as any).mockReturnValue(authRepo);

    service = createAuthService({});
  });

  it('throws 404 if account not found', async () => {
    authRepo.getByEmail.mockResolvedValue(null);

    await expect(
      service.login('test@test.com', 'password')
    ).rejects.toMatchObject({
      message: 'Account not found',
      status: 404,
    });
  });

  it('throws 401 if password is invalid', async () => {
    authRepo.getByEmail.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      passwordHash: 'hashed',
    });

    (verifyString as any).mockResolvedValue(false);

    await expect(
      service.login('test@test.com', 'wrong-password')
    ).rejects.toMatchObject({
      message: 'Invalid password',
      status: 401,
    });
  });

  it('returns tokens on successful login', async () => {
    authRepo.getByEmail.mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      passwordHash: 'hashed',
    });

    (verifyString as any).mockResolvedValue(true);

    const result = await service.login('test@test.com', 'correct-password');

    expect(result).toEqual({
      email: 'test@test.com',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(authRepo.saveRefreshToken).toHaveBeenCalled();
  });

  it('creates account with hashed password', async () => {
    (hashString as any).mockResolvedValue('hashed-password');

    authRepo.create = vi.fn().mockResolvedValue({
      email: 'test@test.com',
    });

    const result = await service.createAccount({
      email: 'test@test.com',
      password: 'plain',
    });

    expect(hashString).toHaveBeenCalledWith('plain');
    expect(authRepo.create).toHaveBeenCalledWith({
      email: 'test@test.com',
      passwordHash: 'hashed-password',
    });
    expect(result.email).toBe('test@test.com');
  });
});
