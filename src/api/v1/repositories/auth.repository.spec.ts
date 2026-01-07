import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthRepository } from "./auth.repository";
import {
  authTable,
  refreshTokenTable,
  verificationTable,
} from "../db/schema/auth.schema";

/**
 * Helper to create a chainable mock
 */
const mockReturning = (result: any[]) => ({
  returning: vi.fn().mockResolvedValue(result),
});

describe("AuthRepository", () => {
  let db: any;
  let repo: ReturnType<typeof createAuthRepository>;

  beforeEach(() => {
    db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    repo = createAuthRepository(db);
  });

  describe("create", () => {
    it("should insert auth record", async () => {
      const auth = { id: "1", email: "test@test.com" };

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue(mockReturning([auth])),
      });

      const result = await repo.create(auth);

      expect(db.insert).toHaveBeenCalledWith(authTable);
      expect(result).toEqual(auth);
    });
  });

  describe("getByEmail", () => {
    it("should return auth by email", async () => {
      const auth = { id: "1", email: "test@test.com" };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([auth]),
        }),
      });

      const result = await repo.getByEmail("test@test.com");

      expect(result).toEqual(auth);
    });
  });

  describe("updatePasswordById", () => {
    it("should update password", async () => {
      const updated = { id: "1", passwordHash: "new" };

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockReturning([updated])),
        }),
      });

      const result = await repo.updatePasswordById("1", "new");

      expect(result).toEqual(updated);
    });
  });

  describe("saveRefreshToken", () => {
    it("should update existing refresh token", async () => {
      const token = { tokenHash: "abc" };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([token]),
        }),
      });

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockReturning([token])),
        }),
      });

      const result = await repo.saveRefreshToken("1", "abc", new Date());

      expect(db.update).toHaveBeenCalledWith(refreshTokenTable);
      expect(result).toEqual(token);
    });

    it("should insert new refresh token if none exists", async () => {
      const token = { tokenHash: "abc" };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue(mockReturning([token])),
      });

      const result = await repo.saveRefreshToken("1", "abc", new Date());

      expect(db.insert).toHaveBeenCalledWith(refreshTokenTable);
      expect(result).toEqual(token);
    });
  });

  describe("updateOtp", () => {
    it("should update existing OTP", async () => {
      const otp = { otp: "123456" };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([otp]),
        }),
      });

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockReturning([otp])),
        }),
      });

      const result = await repo.updateOtp(
        "1",
        "email@test.com",
        "123456",
        new Date(),
        1,
        "login"
      );

      expect(result).toEqual(otp);
    });

    it("should insert OTP if none exists", async () => {
      const otp = { otp: "123456" };

      db.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue(mockReturning([otp])),
      });

      const result = await repo.updateOtp(
        "1",
        "email@test.com",
        "123456",
        new Date(),
        1,
        "login"
      );

      expect(db.insert).toHaveBeenCalledWith(verificationTable);
      expect(result).toEqual(otp);
    });
  });

  describe("deleteRefreshToken", () => {
    it("should delete refresh token", async () => {
      db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await repo.deleteRefreshToken("abc");

      expect(db.delete).toHaveBeenCalledWith(refreshTokenTable);
    });
  });

  describe("updateVerification", () => {
    it("should update email verification", async () => {
      const updated = { emailVerified: true };

      db.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(mockReturning([updated])),
        }),
      });

      const result = await repo.updateVerification("1", true);

      expect(result).toEqual(updated);
    });
  });
});
