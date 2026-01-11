import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRefreshTokenRepository } from "./refreshToken.repository";
import { refreshTokenTable } from "../db/schema/auth.schema";

describe("createRefreshTokenRepository", () => {
  let db: any;
  let repo: ReturnType<typeof createRefreshTokenRepository>;

  beforeEach(() => {
    // chainable mocks
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
      where: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    });

    repo = createRefreshTokenRepository(db);
  });

  describe("saveRefreshToken", () => {
    it("updates existing refresh token", async () => {
      const existingRow = [{ accountId: "acc-1" }];
      const updatedRow = [{ tokenHash: "new-hash" }];

      // mock existing select
      db.select().from().where.mockResolvedValue(existingRow);
      db.update().set().where().returning.mockResolvedValue(updatedRow);

      const result = await repo.saveRefreshToken(
        "acc-1",
        "new-hash",
        new Date()
      );

      expect(db.select).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalledWith(refreshTokenTable);
      expect(result).toEqual(updatedRow[0]);
    });

    it("inserts new refresh token when none exists", async () => {
      const insertedRow = [{ tokenHash: "hash" }];

      db.select().from().where.mockResolvedValue([]);
      db.insert().values().returning.mockResolvedValue(insertedRow);

      const result = await repo.saveRefreshToken(
        "acc-2",
        "hash",
        new Date()
      );

      expect(db.insert).toHaveBeenCalledWith(refreshTokenTable);
      expect(result).toEqual(insertedRow[0]);
    });
  });

  describe("getRefreshTokenByToken", () => {
    it("returns refresh token by token hash", async () => {
      const row = { tokenHash: "hash" };

      db.select().from().where.mockResolvedValue([row]);

      const result = await repo.getRefreshTokenByToken("hash");

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(row);
    });

    it("returns undefined when token not found", async () => {
      db.select().from().where.mockResolvedValue([]);

      const result = await repo.getRefreshTokenByToken("missing");

      expect(result).toBeUndefined();
    });
  });

  describe("deleteRefreshToken", () => {
    it("deletes refresh token by token hash", async () => {
      const deletedRows = [{ tokenHash: "hash" }];

      db.delete().where().returning.mockResolvedValue(deletedRows);

      const result = await repo.deleteRefreshToken("hash");

      expect(db.delete).toHaveBeenCalledWith(refreshTokenTable);
      expect(result).toEqual(deletedRows);
    });
  });

  describe("deleteRefreshTokenById", () => {
    it("deletes refresh token by accountId", async () => {
      db.delete().where.mockResolvedValue(undefined);

      await repo.deleteRefreshTokenById("acc-1");

      expect(db.delete).toHaveBeenCalledWith(refreshTokenTable);
    });
  });
});
