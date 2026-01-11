import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPasswordlessService } from "./passwordless.service";
import { HttpError } from "../../../errors/HttpError";

// 🔹 Mock node crypto
vi.mock("node:crypto", () => ({
  randomBytes: vi.fn(() => Buffer.from("mocked-random-bytes")),
}));

// 🔹 Mock hash utilities
vi.mock("../../../security/hash", () => ({
  hashString: vi.fn(async () => "hashed-token"),
  verifyString: vi.fn(async () => true),
}));

// 🔹 Mock mailer
vi.mock("../../../utils/mailer", () => ({
  mailer: {
    sendMail: vi.fn(),
  },
}));

// 🔹 Mock token issuing
vi.mock("../../../utils/issueTokens", () => ({
  issueTokens: vi.fn(async () => ({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  })),
}));

describe("createPasswordlessService", () => {
  let authRepo: any;
  let verificationRepo: any;
  let refreshTokenRepo: any;
  let service: ReturnType<typeof createPasswordlessService>;

  beforeEach(() => {
    authRepo = {
      getByEmail: vi.fn(),
    };

    verificationRepo = {
      updateOtp: vi.fn(),
      getOtpByEmail: vi.fn(),
      deleteOtp: vi.fn(),
    };

    refreshTokenRepo = {};

    service = createPasswordlessService(
      authRepo,
      verificationRepo,
      refreshTokenRepo
    );

    vi.clearAllMocks();
  });

  describe("loginPasswordless", () => {
    it("throws 404 if account does not exist", async () => {
      authRepo.getByEmail.mockResolvedValue(null);

      await expect(service.loginPasswordless("test@example.com"))
        .rejects.toBeInstanceOf(HttpError);
    });

    it("creates OTP, sends email, and returns magic link", async () => {
      authRepo.getByEmail.mockResolvedValue({ id: "acc-1" });

      const result = await service.loginPasswordless("test@example.com");

      expect(verificationRepo.updateOtp).toHaveBeenCalledWith(
        "acc-1",
        "test@example.com",
        "hashed-token",
        expect.any(Date),
        0,
        "passwordless_login"
      );

      expect(result.message).toBe("Passwordless login initiated");
      expect(result.magicLink).toContain("login/callback");

      const { mailer } = await import("../../../utils/mailer");
      expect(mailer.sendMail).toHaveBeenCalled();
    });
  });

  describe("loginCallback", () => {
    it("throws if OTP record does not exist", async () => {
      verificationRepo.getOtpByEmail.mockResolvedValue(null);

      await expect(
        service.loginCallback("test@example.com", "token")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("throws if OTP is expired", async () => {
      verificationRepo.getOtpByEmail.mockResolvedValue({
        otp: "hashed-token",
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.loginCallback("test@example.com", "token")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("throws if token does not match", async () => {
      const { verifyString } = await import("../../../security/hash");
      (verifyString as any).mockResolvedValueOnce(false);

      verificationRepo.getOtpByEmail.mockResolvedValue({
        otp: "hashed-token",
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(
        service.loginCallback("test@example.com", "token")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("issues tokens and deletes OTP on success", async () => {
      verificationRepo.getOtpByEmail.mockResolvedValue({
        otp: "hashed-token",
        expiresAt: new Date(Date.now() + 10000),
        accountId: "acc-1",
      });

      authRepo.getByEmail.mockResolvedValue({
        id: "acc-1",
        email: "test@example.com",
      });

      const result = await service.loginCallback(
        "test@example.com",
        "raw-token"
      );

      expect(verificationRepo.deleteOtp).toHaveBeenCalledWith("acc-1");
      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });
});
