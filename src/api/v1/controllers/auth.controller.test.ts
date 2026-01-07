import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthController } from './auth.controller';

const mockAuthService = {
  getAccountByEmail: vi.fn(),
  createAccount: vi.fn(),
  login: vi.fn(),
  refreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
  changePassword: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  sendVerification: vi.fn(),
  verifyOtp: vi.fn(),
  setup2FA: vi.fn(),
  verify2FA: vi.fn(),
  verifyAndUseRecoveryCode: vi.fn(),
  loginPasswordless: vi.fn(),
  loginCallback: vi.fn(),
};

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  let controller: ReturnType<typeof createAuthController>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = createAuthController(mockAuthService as any);
  });

  describe('createAccount', () => {
    it('should return 409 if account already exists', async () => {
      mockAuthService.getAccountByEmail.mockResolvedValue({ id: '1' });

      const req: any = { body: { email: 'test@test.com' } };
      const res = mockRes();

      await controller.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account already exists' });
    });

    it('should create account and return 201', async () => {
      mockAuthService.getAccountByEmail.mockResolvedValue(null);
      mockAuthService.createAccount.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const req: any = { body: { email: 'test@test.com' } };
      const res = mockRes();

      await controller.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: '1', email: 'test@test.com' });
    });
  });

  describe('login', () => {
    it('should return 401 if account does not exist', async () => {
      mockAuthService.getAccountByEmail.mockResolvedValue(null);

      const req: any = { body: { email: 'x@test.com', password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should login and set refreshToken cookie', async () => {
      mockAuthService.getAccountByEmail.mockResolvedValue({ id: '1' });
      mockAuthService.login.mockResolvedValue({
        email: 'test@test.com',
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const req: any = { body: { email: 'test@test.com', password: 'pass' } };
      const res = mockRes();

      await controller.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.objectContaining({
          httpOnly: true,
          path: '/auth/refresh',
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refreshToken', () => {
    it('should return 401 if refresh token is missing', async () => {
      const req: any = { cookies: {} };
      const res = mockRes();

      await controller.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('should clear refreshToken cookie', async () => {
      const req: any = { cookies: { refreshToken: 'token' } };
      const res = mockRes();

      await controller.logout(req, res);

      expect(mockAuthService.deleteRefreshToken).toHaveBeenCalledWith('token');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/auth/refresh' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('changePassword', () => {
    it('should return 401 if accountId is missing', async () => {
      const req: any = { body: {} };
      const res = mockRes();

      await controller.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
