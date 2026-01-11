import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { createVerificationController } from "./verification.controller";
import { HTTP_STATUS } from "../../../constants/httpStatus";

describe("createVerificationController", () => {
  let res: Response;

  const otpService = {
    generateOtp: vi.fn(),
    sendOtpEmail: vi.fn(),
    verifyOtp: vi.fn(),
    deleteOtp: vi.fn(),
  };

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    vi.clearAllMocks();
  });

  describe("sendEmailVerification", () => {
    it("returns 401 when accountId or email is missing", async () => {
      const req = {
        account: undefined,
      } as any;

      const controller = createVerificationController(otpService);
      await controller.sendEmailVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(otpService.generateOtp).not.toHaveBeenCalled();
    });

    it("generates OTP, sends email, and returns result", async () => {
      const req = {
        account: {
          accountId: "acc-1",
          email: "test@example.com",
        },
      } as any;

      otpService.generateOtp.mockResolvedValue({ otp: "123456" });
      otpService.sendOtpEmail.mockResolvedValue({ success: true });

      const controller = createVerificationController(otpService);
      await controller.sendEmailVerification(req, res);

      expect(otpService.generateOtp).toHaveBeenCalledWith(
        "acc-1",
        "test@example.com",
        "email_verification"
      );
      expect(otpService.sendOtpEmail).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
        "email_verification"
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe("verifyOtp", () => {
    it("returns 401 when accountId or type is missing", async () => {
      const req = {
        account: { accountId: "acc-1" },
        body: {},
      } as any;

      const controller = createVerificationController(otpService);
      await controller.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        message: "Account ID and type are required",
      });
    });

    it("returns 401 for invalid type", async () => {
      const req = {
        account: { accountId: "acc-1" },
        body: { type: "invalid", otp: "123456" },
      } as any;

      const controller = createVerificationController(otpService);
      await controller.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid type" });
    });

    it("returns 401 when OTP is missing", async () => {
      const req = {
        account: { accountId: "acc-1" },
        body: { type: "email_verification" },
      } as any;

      const controller = createVerificationController(otpService);
      await controller.verifyOtp(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ message: "OTP is required" });
    });

    it("verifies email OTP and returns success message", async () => {
      const req = {
        account: { accountId: "acc-1" },
        body: { type: "email_verification", otp: "123456" },
      } as any;

      otpService.verifyOtp.mockResolvedValue(undefined);

      const controller = createVerificationController(otpService);
      await controller.verifyOtp(req, res);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        "acc-1",
        "123456",
        "email_verification"
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified successfully",
      });
    });

    it("verifies password reset OTP and returns success message", async () => {
      const req = {
        account: { accountId: "acc-1" },
        body: { type: "password_reset", otp: "123456" },
      } as any;

      otpService.verifyOtp.mockResolvedValue(undefined);

      const controller = createVerificationController(otpService);
      await controller.verifyOtp(req, res);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(
        "acc-1",
        "123456",
        "password_reset"
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password reset successfully",
      });
    });
  });
});
