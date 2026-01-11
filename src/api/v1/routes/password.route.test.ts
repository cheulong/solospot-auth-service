import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

import { createPasswordRoute } from "./password.route";
import { HTTP_STATUS } from "../../../constants/httpStatus";

/**
 * ---- Mock middlewares ----
 * We mock them to avoid testing middleware internals here.
 */
vi.mock("../middleware/auth.middleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.account = { accountId: "acc-1", email: "test@example.com" };
    next();
  },
}));

vi.mock("../middleware/validate.middleware", () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../middleware/asyncHandler.middleware", () => ({
  asyncHandler:
    (fn: any) => (req: any, res: any, next: any) =>
      Promise.resolve(fn(req, res)).catch(next),
}));

describe("createPasswordRoute", () => {
  let app: express.Express;
  let passwordService: any;
  let otpService: any;

  beforeEach(() => {
    passwordService = {
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    otpService = {
      verifyOtp: vi.fn(),
      deleteOtp: vi.fn(),
    };

    app = express();
    app.use(express.json());

    app.use(
      "/auth/v1",
      createPasswordRoute(passwordService, otpService)
    );
  });

  describe("POST /auth/v1/change-password", () => {
    it("should change password successfully", async () => {
      const res = await request(app)
        .post("/auth/v1/change-password")
        .set("Cookie", ["refreshToken=refresh-token"])
        .send({
          oldPassword: "old123",
          newPassword: "new123",
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        message: "Password changed successfully",
      });

      expect(passwordService.changePassword).toHaveBeenCalledWith(
        "acc-1",
        "old123",
        "new123"
      );
    });
  });

  describe("POST /auth/v1/forgot-password", () => {
    it("should send reset link", async () => {
      passwordService.forgotPassword.mockResolvedValue({
        token: "reset-token",
      });

      const res = await request(app)
        .post("/auth/v1/forgot-password")
        .send({
          email: "test@example.com",
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        token: "reset-token",
        message: "Reset link sent",
      });

      expect(passwordService.forgotPassword).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("POST /auth/v1/reset-password", () => {
    it("should verify otp and reset password", async () => {
      const res = await request(app)
        .post("/auth/v1/reset-password")
        .send({
          accountId: "acc-1",
          otp: "123456",
          newPassword: "new123",
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        message: "Password reset successfully",
      });

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        "acc-1",
        "123456",
        "password_reset"
      );
      expect(passwordService.resetPassword).toHaveBeenCalledWith(
        "acc-1",
        "new123"
      );
      expect(otpService.deleteOtp).toHaveBeenCalledWith("acc-1");
    });
  });
});
