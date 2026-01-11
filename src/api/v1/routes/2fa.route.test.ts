import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createTwoFactorRoute } from "./2fa.route";

vi.hoisted(() => {
  vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-bytes-long!!");
});

// 🔹 Mock middlewares
vi.mock("../middleware/auth.middleware", () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.account = {
      accountId: "acc-1",
      email: "test@example.com",
    };
    next();
  },
}));

vi.mock("../middleware/asyncHandler.middleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

vi.mock("../middleware/validate.middleware", () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

describe("createTwoFactorRoute", () => {
  let app: express.Express;
  let twoFactorService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    twoFactorService = {
      setup2FA: vi.fn().mockResolvedValue({ qrCode: "qr-code" }),
      verify2FA: vi.fn().mockResolvedValue(undefined),
      useRecoveryCode: vi.fn().mockResolvedValue({
        refreshToken: "refresh-token",
      }),
    };

    app.use("/api/v1/auth", createTwoFactorRoute(twoFactorService));
  });

  describe("POST /2fa/setup", () => {
    it("returns 200 and setup result", async () => {
      const res = await request(app).post("/api/v1/auth/2fa/setup");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ qrCode: "qr-code" });
      expect(twoFactorService.setup2FA).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("POST /2fa/verify", () => {
    it("returns 200 when OTP is valid", async () => {
      const res = await request(app)
        .post("/api/v1/auth/2fa/verify")
        .send({ otp: "123456" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "2FA verified successfully",
      });
      expect(twoFactorService.verify2FA).toHaveBeenCalledWith(
        "test@example.com",
        "123456"
      );
    });
  });

  describe("POST /2fa/recover", () => {
    it("returns 200 and recovery result", async () => {
      const res = await request(app)
        .post("/api/v1/auth/2fa/recover")
        .send({
          email: "test@example.com",
          recoveryCode: "recovery-code",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        refreshToken: "refresh-token",
      });
      expect(twoFactorService.useRecoveryCode).toHaveBeenCalledWith(
        "test@example.com",
        "recovery-code"
      );
    });
  });
});
