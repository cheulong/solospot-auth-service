import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTwoFactorService } from "./twoFactor.service";
import { HttpError } from "../../../errors/HttpError";

// 🔹 Mock otplib
vi.mock("otplib", () => ({
  authenticator: {
    generateSecret: vi.fn(() => "plain-secret"),
    keyuri: vi.fn(() => "otpauth://uri"),
    check: vi.fn(() => true),
  },
}));

// 🔹 Mock QRCode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(async () => "data:image/png;base64,qr"),
  },
}));

// 🔹 Mock crypto
vi.mock("node:crypto", () => ({
  randomBytes: vi.fn(() => Buffer.from("abcd1234")),
}));

// 🔹 Mock hash utils
vi.mock("../../../security/hash", () => ({
  hashString: vi.fn(async (v: string) => `hashed-${v}`),
  verifyString: vi.fn(async () => true),
}));

// 🔹 Mock encryption utils
vi.mock("../../../utils/crypto", () => ({
  encryptSecret: vi.fn((v: string) => `encrypted-${v}`),
  decryptSecret: vi.fn((v: string) => v.replace("encrypted-", "")),
}));

// 🔹 Mock JWT
vi.mock("../../../security/jwt", () => ({
  generateRefreshToken: vi.fn(() => "refresh-token"),
  generateToken: vi.fn(() => "access-token"),
}));

describe("createTwoFactorService", () => {
  let authRepo: any;
  let service: ReturnType<typeof createTwoFactorService>;

  beforeEach(() => {
    authRepo = {
      getByEmail: vi.fn(),
      saveRecoveryCodes: vi.fn(),
      updateTwoFactorSecret: vi.fn(),
      updateTwoFactorVerified: vi.fn(),
    };

    service = createTwoFactorService(authRepo);
    vi.clearAllMocks();
  });

  describe("setup2FA", () => {
    it("throws if account does not exist", async () => {
      authRepo.getByEmail.mockResolvedValue(null);

      await expect(service.setup2FA("test@example.com"))
        .rejects.toBeInstanceOf(HttpError);
    });

    it("throws if 2FA already enabled", async () => {
      authRepo.getByEmail.mockResolvedValue({
        twoFactorSecret: "encrypted-secret",
      });

      await expect(service.setup2FA("test@example.com"))
        .rejects.toBeInstanceOf(HttpError);
    });

    it("generates secret, QR, recovery codes and saves them", async () => {
      authRepo.getByEmail.mockResolvedValue({
        email: "test@example.com",
        twoFactorSecret: null,
      });

      const result = await service.setup2FA("test@example.com");

      expect(result.secret).toBe("plain-secret");
      expect(result.qrcode).toBe("data:image/png;base64,qr");
      expect(result.recoveryCodes).toHaveLength(5);

      expect(authRepo.saveRecoveryCodes).toHaveBeenCalled();
      expect(authRepo.updateTwoFactorSecret).toHaveBeenCalledWith(
        "test@example.com",
        "encrypted-plain-secret"
      );
    });
  });

  describe("verify2FA", () => {
    it("throws if 2FA not set up", async () => {
      authRepo.getByEmail.mockResolvedValue(null);

      await expect(
        service.verify2FA("test@example.com", "123456")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("throws if OTP is invalid", async () => {
      const { authenticator } = await import("otplib");
      (authenticator.check as any).mockReturnValueOnce(false);

      authRepo.getByEmail.mockResolvedValue({
        twoFactorSecret: "encrypted-secret",
      });

      await expect(
        service.verify2FA("test@example.com", "123456")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("verifies OTP and enables 2FA", async () => {
      authRepo.getByEmail.mockResolvedValue({
        twoFactorSecret: "encrypted-secret",
      });

      const result = await service.verify2FA(
        "test@example.com",
        "123456"
      );

      expect(authRepo.updateTwoFactorVerified).toHaveBeenCalledWith(
        "test@example.com",
        true
      );

      expect(result).toEqual({
        message: "2FA enabled successfully",
      });
    });
  });

  describe("useRecoveryCode", () => {
    it("throws if 2FA not enabled", async () => {
      authRepo.getByEmail.mockResolvedValue(null);

      await expect(
        service.useRecoveryCode("test@example.com", "code")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("throws if recovery code is invalid", async () => {
      const { verifyString } = await import("../../../security/hash");
      (verifyString as any).mockResolvedValue(false);

      authRepo.getByEmail.mockResolvedValue({
        twoFactorSecret: "encrypted-secret",
        twoFactorBackupCodes: ["hashed-code"],
      });

      await expect(
        service.useRecoveryCode("test@example.com", "bad-code")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("uses recovery code and issues tokens", async () => {
      const { verifyString } = await import("../../../security/hash");
      (verifyString as any).mockResolvedValue(true);
      
      authRepo.getByEmail.mockResolvedValue({
        id: "acc-1",
        email: "test@example.com",
        twoFactorSecret: "encrypted-secret",
        twoFactorBackupCodes: ["hashed-code"],
      });

      const result = await service.useRecoveryCode(
        "test@example.com",
        "raw-code"
      );

      expect(authRepo.saveRecoveryCodes).toHaveBeenCalledWith(
        "test@example.com",
        []
      );

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });
});
