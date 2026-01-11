import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/httpStatus";
import { setAuthCookie } from "../../../utils/cookies";
import { createTwoFactorController } from "./2fa.controller";

vi.hoisted(() => {
  vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-32-bytes-long!!");
});

vi.mock("../../../utils/cookies", () => ({
  setAuthCookie: vi.fn(),
}));

describe("createTwoFactorController", () => {
  let res: Response;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  const twoFactorService = {
    setup2FA: vi.fn(),
    verify2FA: vi.fn(),
    useRecoveryCode: vi.fn(),
  };

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn();

    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    vi.clearAllMocks();
  });

  describe("setup2FA", () => {
    it("returns 401 if email is missing", async () => {
      const req = { account: undefined } as any;

      const controller = createTwoFactorController(twoFactorService);
      await controller.setup2FA(req, res as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("returns 200 and setup result when email exists", async () => {
      const req = {
        account: { email: "test@example.com" },
      } as any;

      const mockResult = { qrCode: "qr-code" };
      twoFactorService.setup2FA.mockResolvedValue(mockResult);

      const controller = createTwoFactorController(twoFactorService);
      await controller.setup2FA(req, res as Response);

      expect(twoFactorService.setup2FA).toHaveBeenCalledWith("test@example.com");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("verify2FA", () => {
    it("returns 401 if email is missing", async () => {
      const req = {
        body: { otp: "123456" },
      } as any;

      const controller = createTwoFactorController(twoFactorService);
      await controller.verify2FA(req, res as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Email is required" });
    });

    it("verifies OTP and returns success message", async () => {
      const req = {
        account: { email: "test@example.com" },
        body: { otp: "123456" },
      } as any;

      const controller = createTwoFactorController(twoFactorService);
      await controller.verify2FA(req, res as Response);

      expect(twoFactorService.verify2FA).toHaveBeenCalledWith(
        "test@example.com",
        "123456"
      );
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "2FA verified successfully",
      });
    });
  });

  describe("recoveryLogin", () => {
    it("uses recovery code, sets auth cookie, and returns result", async () => {
      const req = {
        body: {
          email: "test@example.com",
          recoveryCode: "recovery-code",
        },
      } as Request;

      const mockResult = {
        refreshToken: "refresh-token",
        accessToken: "access-token",
      };

      twoFactorService.useRecoveryCode.mockResolvedValue(mockResult);

      const controller = createTwoFactorController(twoFactorService);
      await controller.recoveryLogin(req, res as Response);

      expect(twoFactorService.useRecoveryCode).toHaveBeenCalledWith(
        "test@example.com",
        "recovery-code"
      );
      expect(setAuthCookie).toHaveBeenCalledWith(res, "refresh-token");
      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });
  });
});
