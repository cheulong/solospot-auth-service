import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createVerificationRoute } from "./verification.route";

// 🔹 Mock middlewares
vi.mock("../middleware/auth.middleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.account = {
      accountId: "account-1",
      email: "test@example.com",
    };
    next();
  },
}));

vi.mock("../middleware/asyncHandler.middleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

describe("createVerificationRoute", () => {
  let app: express.Express;
  let otpService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    otpService = {
      generateOtp: vi.fn().mockResolvedValue({ otp: "123456" }),
      sendOtpEmail: vi.fn().mockResolvedValue({ success: true }),
      verifyOtp: vi.fn().mockResolvedValue(undefined),
    };

    app.use("/auth/v1", createVerificationRoute(otpService));
  });

  describe("POST /send-email-verification", () => {
    it("returns 200 and sends verification email", async () => {
      const res = await request(app).post("/auth/v1/send-email-verification");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      expect(otpService.generateOtp).toHaveBeenCalledWith(
        "account-1",
        "test@example.com",
        "email_verification"
      );

      expect(otpService.sendOtpEmail).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
        "email_verification"
      );
    });
  });

  describe("POST /verify-otp", () => {
    it("returns 200 for email verification", async () => {
      const res = await request(app)
        .post("/auth/v1/verify-otp")
        .send({
          type: "email_verification",
          otp: "123456",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Email verified successfully",
      });

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        "account-1",
        "123456",
        "email_verification"
      );
    });

    it("returns 200 for password reset", async () => {
      const res = await request(app)
        .post("/auth/v1/verify-otp")
        .send({
          type: "password_reset",
          otp: "654321",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Password reset successfully",
      });

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        "account-1",
        "654321",
        "password_reset"
      );
    });
  });
});
