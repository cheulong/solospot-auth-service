import { eq } from "drizzle-orm";
import { refreshTokenTable } from "../db/schema/auth.schema";

type DB = any;

export const createRefreshTokenRepository = (db: DB) => {
  return {
    saveRefreshToken: async (accountId: string, tokenHash: string, expiresAt: Date) => {
      const existing = await db.select().from(refreshTokenTable).where(eq(refreshTokenTable.accountId, accountId));

      if (existing.length > 0) {
        const [updated] = await db.update(refreshTokenTable)
          .set({ tokenHash, accountId, expiresAt })
          .where(eq(refreshTokenTable.accountId, accountId))
          .returning();
        return updated;
      } else {
        const [inserted] = await db.insert(refreshTokenTable)
          .values({ tokenHash, accountId, expiresAt })
          .returning();
        return inserted;
      }
    },
    getRefreshTokenByToken: async (token: string) => {
      const [refreshToken] = await db.select()
        .from(refreshTokenTable)
        .where(eq(refreshTokenTable.tokenHash, token));
      return refreshToken;
    },
    deleteRefreshToken: async (token: string) => {
      const deleted = await db.delete(refreshTokenTable).where(eq(refreshTokenTable.tokenHash, token)).returning();
      return deleted;
    },
    deleteRefreshTokenById: async (accountId: string) => {
      await db.delete(refreshTokenTable).where(eq(refreshTokenTable.accountId, accountId));
    },
  };
};

export type RefreshTokenRepositoryType = ReturnType<typeof createRefreshTokenRepository>;