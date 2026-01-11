import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOtpService } from "./otp.service";
import { HttpError } from "../../../errors/HttpError";

/**
 * ---- Mock dependencies ----
 */
vi.mock("../../../utils/otp", () => ({
  generateOtp: vi.fn(() => "123456"),
  otpExpiresIn: vi.fn(() => new Date("2099-01-01")),
}));

vi.mock("../../../security/hash", () => ({
  hashString: vi.fn(async (value: string) => `hashed-${value}`),
  verifyString: vi.fn().mockResolvedValue(false),
}));

vi.mock("../../../utils/mailer", () => ({
  mailer: {
    sendMail: vi.fn(),
  },
}));

describe("createOtpService", () => {
  let verificationRepo: any;
  let otpService: ReturnType<typeof createOtpService>;

  beforeEach(() => {
    verificationRepo = {
      updateOtp: vi.fn(),
      getOtp: vi.fn(),
      deleteOtp: vi.fn(),
    };

    otpService = createOtpService(verificationRepo);
  });

  describe("generateOtp", () => {
    it("should generate, hash, and store OTP", async () => {
      const result = await otpService.generateOtp(
        "acc-1",
        "email",
        "password_reset"
      );

      expect(result).toEqual({
        otp: "123456",
        expiresAt: new Date("2099-01-01"),
      });

      expect(verificationRepo.updateOtp).toHaveBeenCalledWith(
        "acc-1",
        "email",
        "hashed-123456",
        new Date("2099-01-01"),
        0,
        "password_reset"
      );
    });
  });

  describe("sendOtpEmail", () => {
    it("should send OTP email successfully", async () => {
      await otpService.sendOtpEmail(
        "test@example.com",
        "123456",
        "password_reset"
      );

      expect(
        (await import("../../../utils/mailer")).mailer.sendMail
      ).toHaveBeenCalled();
    });

    it("should throw HttpError if mail sending fails", async () => {
      const { mailer } = await import("../../../utils/mailer");
      (mailer.sendMail as any).mockRejectedValueOnce(new Error("SMTP error"));
      await expect(
        otpService.sendOtpEmail("test@example.com", "123456", "password_reset")
      ).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe("verifyOtp", () => {
    it("should verify valid OTP", async () => {
      const { verifyString } = await import("../../../security/hash");

      verificationRepo.getOtp.mockResolvedValue({
        accountId: "acc-1",
        identifier: "email",
        otp: "hashed-123456",
        expiresAt: new Date("2099-01-01"),
        attempts: 0,
      });

      (verifyString as any).mockResolvedValue(true);

      const result = await otpService.verifyOtp(
        "acc-1",
        "123456",
        "password_reset"
      );

      expect(result.otp).toBe("hashed-123456");
    });

    it("should throw if OTP not found", async () => {
      verificationRepo.getOtp.mockResolvedValue(null);

      await expect(
        otpService.verifyOtp("acc-1", "123456", "password_reset")
      ).rejects.toMatchObject({ 
        status: 404,
        message: "OTP not found"
       });
    });

    it("should delete and throw if OTP expired", async () => {
      verificationRepo.getOtp.mockResolvedValue({
        otp: "hashed-123456",
        identifier: "email",
        expiresAt: new Date("2000-01-01"),
        attempts: 0,
      });

      await expect(
        otpService.verifyOtp("acc-1", "123456", "password_reset")
      ).rejects.toMatchObject({ status: 401, message: "OTP has expired" });

      expect(verificationRepo.deleteOtp).toHaveBeenCalledWith("acc-1");
    });

    it("should delete and throw if max attempts exceeded", async () => {
      verificationRepo.getOtp.mockResolvedValue({
        otp: "hashed-123456",
        identifier: "email",
        expiresAt: new Date("2099-01-01"),
        attempts: 5,
      });

      await expect(
        otpService.verifyOtp("acc-1", "123456", "password_reset")
      ).rejects.toMatchObject({ status: 429, message: "OTP has been used too many times" });

      expect(verificationRepo.deleteOtp).toHaveBeenCalledWith("acc-1");
    });

    it("should increment attempts and throw on invalid OTP", async () => {
      const { verifyString } = await import("../../../security/hash");

      verificationRepo.getOtp.mockResolvedValue({
        otp: "hashed-123456",
        identifier: "email",
        expiresAt: new Date("2099-01-01"),
        attempts: 1,
      });

      (verifyString as any).mockResolvedValue(false);

      await expect(
        otpService.verifyOtp("acc-1", "000000", "password_reset")
      ).rejects.toMatchObject({ status: 401, message: "Invalid OTP" });

      expect(verificationRepo.updateOtp).toHaveBeenCalledWith(
        "acc-1",
        "email",
        "hashed-123456",
        new Date("2099-01-01"),
        2,
        "password_reset"
      );
    });
  });

  describe("deleteOtp", () => {
    it("should delete OTP", async () => {
      await otpService.deleteOtp("acc-1");
      expect(verificationRepo.deleteOtp).toHaveBeenCalledWith("acc-1");
    });
  });
});
