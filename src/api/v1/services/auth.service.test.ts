import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService } from "./auth.service";
import { HttpError } from "../../../errors/HttpError";
import { HTTP_STATUS } from "../../../constants/httpStatus";

// ---- mocks ----
vi.mock("../../../security/hash", () => ({
  hashString: vi.fn(),
  verifyString: vi.fn(),
  tokenHash: vi.fn(),
}));

vi.mock("../../../utils/issueTokens", () => ({
  issueTokens: vi.fn(),
}));

vi.mock("../../../security/jwt", () => ({
  verifyRefreshToken: vi.fn(),
}));

import { hashString, verifyString, tokenHash } from "../../../security/hash";
import { issueTokens } from "../../../utils/issueTokens";
import { verifyRefreshToken } from "../../../security/jwt";

describe("createAuthService", () => {
  let authRepo: any;
  let refreshTokenRepo: any;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    authRepo = {
      create: vi.fn(),
      getByEmail: vi.fn(),
      getById: vi.fn(),
    };

    refreshTokenRepo = {
      deleteRefreshToken: vi.fn(),
      getRefreshTokenByToken: vi.fn(),
    };

    service = createAuthService(authRepo, refreshTokenRepo);

    vi.clearAllMocks();
  });

  describe("createAccount", () => {
    it("hashes password and creates account", async () => {
      (hashString as any).mockResolvedValue("hashed-password");
      authRepo.create.mockResolvedValue({ id: "1" });

      const result = await service.createAccount({
        email: "test@test.com",
        password: "plain",
      });

      expect(hashString).toHaveBeenCalledWith("plain");
      expect(authRepo.create).toHaveBeenCalledWith({
        email: "test@test.com",
        passwordHash: "hashed-password",
      });
      expect(result).toEqual({ id: "1" });
    });
  });

  describe("login", () => {
    const account = {
      id: "1",
      email: "test@test.com",
      passwordHash: "hashed",
    };

    it("throws if password is invalid", async () => {
      (verifyString as any).mockResolvedValue(false);

      await expect(
        service.login("wrong", account)
      ).rejects.toBeInstanceOf(HttpError);

      await expect(
        service.login("wrong", account)
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    });

    it("returns tokens on success", async () => {
      (verifyString as any).mockResolvedValue(true);
      (issueTokens as any).mockResolvedValue({
        accessToken: "access",
        refreshToken: "refresh",
      });

      const result = await service.login("correct", account);

      expect(verifyString).toHaveBeenCalledWith("correct", "hashed");
      expect(issueTokens).toHaveBeenCalledWith(account, refreshTokenRepo);
      expect(result).toEqual({
        email: "test@test.com",
        accessToken: "access",
        refreshToken: "refresh",
      });
    });
  });

  describe("getByEmail", () => {
    it("delegates to authRepo", async () => {
      authRepo.getByEmail.mockResolvedValue({ id: "1" });

      const result = await service.getByEmail("a@test.com");

      expect(authRepo.getByEmail).toHaveBeenCalledWith("a@test.com");
      expect(result).toEqual({ id: "1" });
    });
  });

  describe("logout", () => {
    it("hashes refresh token and deletes it", async () => {
      (tokenHash as any).mockResolvedValue("hashed-token");
      refreshTokenRepo.deleteRefreshToken.mockResolvedValue(true);

      const result = await service.logout("raw-token");

      expect(tokenHash).toHaveBeenCalledWith("raw-token");
      expect(refreshTokenRepo.deleteRefreshToken).toHaveBeenCalledWith(
        "hashed-token"
      );
      expect(result).toBe(true);
    });
  });

  describe("refreshToken", () => {
    const storedToken = {
      accountId: "1",
      expiresAt: new Date(Date.now() + 60_000),
    };

    const account = {
      id: "1",
      email: "test@test.com",
    };

    it("throws if refresh token is invalid", async () => {
      (verifyRefreshToken as any).mockReturnValue(false);

      await expect(
        service.refreshToken("bad-token")
      ).rejects.toBeInstanceOf(HttpError);
    });

    it("throws if refresh token not found", async () => {
      (verifyRefreshToken as any).mockReturnValue(true);
      (tokenHash as any).mockResolvedValue("hashed");
      refreshTokenRepo.getRefreshTokenByToken.mockResolvedValue(null);

      await expect(
        service.refreshToken("token")
      ).rejects.toMatchObject({
        message: "Refresh token not found",
        status: HTTP_STATUS.NOT_FOUND,
      });
    });

    it("throws if refresh token expired", async () => {
      (verifyRefreshToken as any).mockReturnValue(true);
      (tokenHash as any).mockResolvedValue("hashed");

      refreshTokenRepo.getRefreshTokenByToken.mockResolvedValue({
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.refreshToken("token")
      ).rejects.toMatchObject({ 
        message: "Refresh token expired", 
        status: HTTP_STATUS.UNAUTHORIZED 
      });
    });

    it("issues new tokens on success", async () => {
      (verifyRefreshToken as any).mockReturnValue(true);
      (tokenHash as any).mockResolvedValue("hashed");
      refreshTokenRepo.getRefreshTokenByToken.mockResolvedValue(storedToken);
      authRepo.getById.mockResolvedValue(account);

      (issueTokens as any).mockResolvedValue({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });

      const result = await service.refreshToken("token");

      expect(issueTokens).toHaveBeenCalledWith(account, refreshTokenRepo);
      expect(result).toEqual({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });
    });
  });
});
