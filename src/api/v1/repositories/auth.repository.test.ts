import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthRepository } from "./auth.repository";
import { authTable } from "../db/schema/auth.schema";
import { eq } from "drizzle-orm";

// Mock eq so we can assert it was called correctly
vi.mock("drizzle-orm", () => ({
  eq: vi.fn()
}));

describe("createAuthRepository", () => {
  let db: any;
  let repository: ReturnType<typeof createAuthRepository>;

  beforeEach(() => {
    vi.clearAllMocks();

    db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn()
    };

    repository = createAuthRepository(db);
  });

  it("creates auth record", async () => {
    const authData = { email: "test@test.com" };
    const returnedAuth = { id: "1", ...authData };

    db.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([returnedAuth])
      })
    });

    const result = await repository.create(authData);

    expect(db.insert).toHaveBeenCalledWith(authTable);
    expect(result).toEqual(returnedAuth);
  });

  it("gets auth by email", async () => {
    const auth = { id: "1", email: "test@test.com" };

    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([auth])
      })
    });

    const result = await repository.getByEmail(auth.email);

    expect(eq).toHaveBeenCalledWith(authTable.email, auth.email);
    expect(result).toEqual(auth);
  });

  it("gets auth by id", async () => {
    const auth = { id: "1" };

    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([auth])
      })
    });

    const result = await repository.getById(auth.id);

    expect(eq).toHaveBeenCalledWith(authTable.id, auth.id);
    expect(result).toEqual(auth);
  });

  it("updates password by id", async () => {
    const updated = { id: "1", passwordHash: "hashed" };

    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated])
        })
      })
    });

    const result = await repository.updatePasswordById("1", "hashed");

    expect(db.update).toHaveBeenCalledWith(authTable);
    expect(result).toEqual(updated);
  });

  it("updates email verification", async () => {
    const updated = { id: "1", emailVerified: true };

    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated])
        })
      })
    });

    const result = await repository.updateVerification("1", true);

    expect(result).toEqual(updated);
  });

  it("updates two factor secret", async () => {
    const updated = { email: "test@test.com", twoFactorSecret: "secret" };

    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated])
        })
      })
    });

    const result = await repository.updateTwoFactorSecret(
      updated.email,
      updated.twoFactorSecret
    );

    expect(eq).toHaveBeenCalledWith(authTable.email, updated.email);
    expect(result).toEqual(updated);
  });

  it("updates two factor verification", async () => {
    const updated = { email: "test@test.com", twoFactorEnabled: true };

    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated])
        })
      })
    });

    const result = await repository.updateTwoFactorVerified(
      updated.email,
      true
    );

    expect(result).toEqual(updated);
  });

  it("saves recovery codes", async () => {
    const updated = {
      email: "test@test.com",
      twoFactorBackupCodes: ["a", "b"]
    };

    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated])
        })
      })
    });

    const result = await repository.saveRecoveryCodes(
      updated.email,
      updated.twoFactorBackupCodes
    );

    expect(result).toEqual(updated);
  });
});
