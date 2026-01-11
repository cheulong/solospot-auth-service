import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPasswordService } from "./password.service";
import { HttpError } from "../../../errors/HttpError";
import { mailer } from "../../../utils/mailer";

/* ------------------------------------------------------------------ */
/*                               Mocks                                */
/* ------------------------------------------------------------------ */
vi.mock("../../../security/hash", () => ({
  hashString: vi.fn(async (v: string) => `hashed-${v}`),
  verifyString: vi.fn(),
}));

vi.mock("../../../utils/otp", () => ({
  generateOtp: vi.fn(() => "123456"),
  otpExpiresIn: vi.fn(() => new Date("2099-01-01")),
}));

vi.mock("../../../utils/mailer", () => ({
  mailer: {
    sendMail: vi.fn(),
  },
}));

describe("createPasswordService", () => {
  let authRepo: any;
  let refreshTokenRepo: any;
  let verificationRepo: any;
  let passwordService: ReturnType<typeof createPasswordService>;

  beforeEach(() => {
    authRepo = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      updatePasswordById: vi.fn(),
    };

    refreshTokenRepo = {
      deleteRefreshTokenById: vi.fn(),
    };

    verificationRepo = {
      updateOtp: vi.fn(),
    };

    passwordService = createPasswordService(
      authRepo,
      refreshTokenRepo,
      verificationRepo
    );
  });

  /* ------------------------------------------------------------------ */
  /*                           changePassword                           */
  /* ------------------------------------------------------------------ */
  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const { verifyString } = await import("../../../security/hash");

      authRepo.getById.mockResolvedValue({
        id: "acc-1",
        passwordHash: "hashed-old",
      });

      (verifyString as any).mockResolvedValue(true);

      const result = await passwordService.changePassword(
        "acc-1",
        "old123",
        "new123"
      );

      expect(authRepo.updatePasswordById).toHaveBeenCalledWith(
        "acc-1",
        "hashed-new123"
      );
      expect(refreshTokenRepo.deleteRefreshTokenById).toHaveBeenCalledWith(
        "acc-1"
      );
      expect(result).toEqual({ message: "Password changed successfully" });
    });

    it("should throw if account not found", async () => {
      authRepo.getById.mockResolvedValue(null);

      await expect(
        passwordService.changePassword("acc-1", "old", "new")
      ).rejects.toMatchObject({ 
        status: 404,
        message: "Account not found" 
      });
    });

    it("should throw if old password is invalid", async () => {
      const { verifyString } = await import("../../../security/hash");

      authRepo.getById.mockResolvedValue({
        id: "acc-1",
        passwordHash: "hashed-old",
      });

      (verifyString as any).mockResolvedValue(false);

      await expect(
        passwordService.changePassword("acc-1", "wrong", "new")
      ).rejects.toMatchObject({ 
        status: 401,
        message: "Invalid password" 
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*                           forgotPassword                           */
  /* ------------------------------------------------------------------ */
  describe("forgotPassword", () => {
    it("should generate OTP and send email", async () => {
      authRepo.getByEmail.mockResolvedValue({
        id: "acc-1",
        email: "test@example.com",
      });

      const result = await passwordService.forgotPassword(
        "test@example.com"
      );

      expect(verificationRepo.updateOtp).toHaveBeenCalledWith(
        "acc-1",
        "test@example.com",
        "hashed-123456",
        new Date("2099-01-01"),
        0,
        "password_reset"
      );

      expect(mailer.sendMail).toHaveBeenCalled();
      expect(result.message).toBe("OTP sent successfully");
      expect(result.otp).toBe("123456");
    });

    it("should throw if account not found", async () => {
      authRepo.getByEmail.mockResolvedValue(null);

      await expect(
        passwordService.forgotPassword("missing@example.com")
      ).rejects.toMatchObject({ 
        status: 404,
        message: "Account not found" 
      });
    });

    it("should throw if email sending fails", async () => {
      authRepo.getByEmail.mockResolvedValue({
        id: "acc-1",
        email: "test@example.com",
      });

      (mailer.sendMail as any).mockRejectedValueOnce(
        new Error("SMTP error")
      );

      await expect(
        passwordService.forgotPassword("test@example.com")
      ).rejects.toBeInstanceOf(HttpError);
    });
  });

  /* ------------------------------------------------------------------ */
  /*                            resetPassword                           */
  /* ------------------------------------------------------------------ */
  describe("resetPassword", () => {
    it("should reset password", async () => {
      const result = await passwordService.resetPassword(
        "acc-1",
        "new123"
      );

      expect(authRepo.updatePasswordById).toHaveBeenCalledWith(
        "acc-1",
        "hashed-new123"
      );
      expect(result).toEqual({
        message: "Password reset successfully",
      });
    });
  });
});
