import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVerificationRepository } from "./verification.repository";
import { verificationTable } from "../db/schema/auth.schema";

describe("createVerificationRepository", () => {
  let db: any;
  let repo: ReturnType<typeof createVerificationRepository>;

  beforeEach(() => {
    db = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // SELECT chain
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
    });

    // INSERT chain
    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    });

    // UPDATE chain
    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn(),
        }),
      }),
    });

    // DELETE chain
    db.delete.mockReturnValue({
      where: vi.fn(),
    });

    repo = createVerificationRepository(db);
  });

  describe("updateOtp", () => {
    it("updates existing OTP record", async () => {
      const existing = [{ accountId: "acc-1" }];
      const updated = [{ otp: "123456" }];

      db.select().from().where.mockResolvedValue(existing);
      db.update().set().where().returning.mockResolvedValue(updated);

      const result = await repo.updateOtp(
        "acc-1",
        "test@example.com",
        "123456",
        new Date(),
        1,
        "email_verification"
      );

      expect(db.update).toHaveBeenCalledWith(verificationTable);
      expect(result).toEqual(updated[0]);
    });

    it("inserts OTP record when none exists", async () => {
      const inserted = [{ otp: "654321" }];

      db.select().from().where.mockResolvedValue([]);
      db.insert().values().returning.mockResolvedValue(inserted);

      const result = await repo.updateOtp(
        "acc-2",
        "test@example.com",
        "654321",
        new Date(),
        0,
        "password_reset"
      );

      expect(db.insert).toHaveBeenCalledWith(verificationTable);
      expect(result).toEqual(inserted[0]);
    });
  });

  describe("getOtp", () => {
    it("returns OTP by accountId", async () => {
      const row = { otp: "123456" };

      db.select().from().where.mockResolvedValue([row]);

      const result = await repo.getOtp("acc-1");

      expect(result).toEqual(row);
    });

    it("returns undefined when OTP not found", async () => {
      db.select().from().where.mockResolvedValue([]);

      const result = await repo.getOtp("missing");

      expect(result).toBeUndefined();
    });
  });

  describe("getOtpByEmail", () => {
    it("returns OTP by email identifier", async () => {
      const row = { otp: "999999" };

      db.select().from().where.mockResolvedValue([row]);

      const result = await repo.getOtpByEmail("test@example.com");

      expect(result).toEqual(row);
    });
  });

  describe("deleteOtp", () => {
    it("deletes OTP by accountId", async () => {
      db.delete().where.mockResolvedValue(undefined);

      await repo.deleteOtp("acc-1");

      expect(db.delete).toHaveBeenCalledWith(verificationTable);
    });
  });
});
