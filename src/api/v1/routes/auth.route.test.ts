import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../middleware/asyncHandler.middleware', () => ({
  asyncHandler: (fn: any) => fn,
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../middleware/validate.middleware', () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../controllers/auth.controller', () => ({
  createAuthController: vi.fn(),
}));

import { createAuthRouter } from './auth.route';
import { createAuthController } from '../controllers/auth.controller';

const mockController = {
  createAccount: vi.fn((_req, res) => res.sendStatus(201)),
  login: vi.fn((_req, res) => res.sendStatus(200)),
  refreshToken: vi.fn((_req, res) => res.sendStatus(200)),
  logout: vi.fn((_req, res) => res.sendStatus(200)),
  changePassword: vi.fn((_req, res) => res.sendStatus(200)),
  forgotPassword: vi.fn((_req, res) => res.sendStatus(200)),
  resetPassword: vi.fn((_req, res) => res.sendStatus(200)),
  sendVerification: vi.fn((_req, res) => res.sendStatus(200)),
  verifyEmail: vi.fn((_req, res) => res.sendStatus(200)),
  verifyOtp: vi.fn((_req, res) => res.sendStatus(200)),
  setup2FA: vi.fn((_req, res) => res.sendStatus(200)),
  verify2FA: vi.fn((_req, res) => res.sendStatus(200)),
  recoveryLogin: vi.fn((_req, res) => res.sendStatus(200)),
  loginPasswordless: vi.fn((_req, res) => res.sendStatus(200)),
  loginCallback: vi.fn((_req, res) => res.sendStatus(200)),
};

const buildApp = () => {
  (createAuthController as any).mockReturnValue(mockController);

  const app = express();
  app.use(express.json());

  app.use(
    '/auth',
    createAuthRouter({ authService: {} })
  );

  return app;
};

describe('Auth Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /auth/register', async () => {
    const app = buildApp();

    await request(app)
      .post('/auth/register')
      .send({})
      .expect(201);

    expect(mockController.createAccount).toHaveBeenCalled();
  });

  it('POST /auth/login', async () => {
    const app = buildApp();

    await request(app)
      .post('/auth/login')
      .send({})
      .expect(200);

    expect(mockController.login).toHaveBeenCalled();
  });

  it('POST /auth/logout (authenticated)', async () => {
    const app = buildApp();

    await request(app)
      .post('/auth/logout')
      .expect(200);

    expect(mockController.logout).toHaveBeenCalled();
  });

  it('POST /auth/2fa/recover (with validation)', async () => {
    const app = buildApp();

    await request(app)
      .post('/auth/2fa/recover')
      .send({})
      .expect(200);

    expect(mockController.recoveryLogin).toHaveBeenCalled();
  });

  it('GET /auth/login/callback', async () => {
    const app = buildApp();

    await request(app)
      .get('/auth/login/callback')
      .expect(200);

    expect(mockController.loginCallback).toHaveBeenCalled();
  });
});
