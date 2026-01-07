import { eq } from "drizzle-orm";
import { refreshTokenTable } from "../db/schema/auth.schema";

type DB = any;

export const createRefreshTokenRepository = (db: DB) => {
  const upsert = async (accountId: string, tokenHash: string, expiresAt: Date) => {
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
  };

  return {
    saveRefreshToken: upsert,

    getRefreshTokenByToken: async (token: string) => {
      const [refreshToken] = await db.select()
        .from(refreshTokenTable)
        .where(eq(refreshTokenTable.tokenHash, token));
      return refreshToken;
    },

    deleteRefreshToken: async (token: string) => {
      await db.delete(refreshTokenTable).where(eq(refreshTokenTable.tokenHash, token));
    },

    deleteRefreshTokenById: async (accountId: string) => {
      await db.delete(refreshTokenTable).where(eq(refreshTokenTable.accountId, accountId));
    },
  };
};
