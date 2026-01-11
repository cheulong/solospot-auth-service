import { eq } from "drizzle-orm";
import { authTable } from "../db/schema/auth.schema";

type DB = any;

export const createAuthRepository = (db: DB) => ({
  create: async (authData: any) => {
      console.log(authData);

    const [auth] = await db.insert(authTable).values(authData).returning();
    return auth;
  },

  getByEmail: async (email: string) => {
    const [auth] = await db.select().from(authTable).where(eq(authTable.email, email));
    return auth;
  },

  getById: async (id: string) => {
    const [auth] = await db.select().from(authTable).where(eq(authTable.id, id));
    return auth;
  },

  updatePasswordById: async (accountId: string, newPassword: string) => {
    const [updated] = await db.update(authTable)
      .set({ passwordHash: newPassword })
      .where(eq(authTable.id, accountId))
      .returning();
    return updated;
  },

  updateVerification: async (accountId: string, emailVerified: boolean) => {
    const [updated] = await db.update(authTable)
      .set({ emailVerified, emailVerifiedAt: new Date() })
      .where(eq(authTable.id, accountId))
      .returning();
    return updated;
  },

  updateTwoFactorSecret: async (email: string, twoFactorSecret: string) => {
    const [updated] = await db.update(authTable)
      .set({ twoFactorSecret })
      .where(eq(authTable.email, email))
      .returning();
    return updated;
  },

  updateTwoFactorVerified: async (email: string, twoFactorEnabled: boolean) => {
    const [updated] = await db.update(authTable)
      .set({ twoFactorEnabled })
      .where(eq(authTable.email, email))
      .returning();
    return updated;
  },

  saveRecoveryCodes: async (email: string, recoveryCodes: string[]) => {
    const [updated] = await db.update(authTable)
      .set({ twoFactorBackupCodes: recoveryCodes })
      .where(eq(authTable.email, email))
      .returning();
    return updated;
  },
});

export type AuthRepositoryType = ReturnType<typeof createAuthRepository>;
