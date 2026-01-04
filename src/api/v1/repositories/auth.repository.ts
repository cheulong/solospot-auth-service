import { eq } from "drizzle-orm";
import { authTable, refreshTokenTable } from "../db/schema/auth.schema";
import type { AuthRepository } from "./auth.repository.type";
import { PgTimestamp } from "drizzle-orm/pg-core";

export const createAuthRepository = (db: any): AuthRepository => ({
  create: async (authData: any) => {
    const [auth] = await db.insert(authTable).values(authData).returning();
    return auth;
  },
  getByEmail: async (email: string) => {
    const [auth] = await db
      .select()
      .from(authTable)
      .where(eq(authTable.email, email));
    return auth;
  },
  saveRefreshToken: async (authId: string, refreshToken: string, expiresAt: Date) => {
    const existingToken = await db
      .select()
      .from(refreshTokenTable)
      .where(eq(refreshTokenTable.accountId, authId));
    
    if (existingToken.length > 0) {
      const [updatedAuth] = await db
        .update(refreshTokenTable)
        .set({ tokenHash: refreshToken, accountId: authId, expiresAt })
        .where(eq(refreshTokenTable.accountId, authId))
        .returning();
      return updatedAuth;
    } else {
      const [newToken] = await db
        .insert(refreshTokenTable)
        .values({ tokenHash: refreshToken, accountId: authId, expiresAt })
        .returning();
      return newToken;
    }
  },
  getRefreshTokenByToken: async (refreshToken: string) => {
    const [token] = await db
      .select()
      .from(refreshTokenTable)
      .where(eq(refreshTokenTable.tokenHash, refreshToken));
    return token;
  },
  deleteRefreshToken: async (refreshToken: string) => {
    await db
      .delete(refreshTokenTable)
      .where(eq(refreshTokenTable.tokenHash, refreshToken));
  },
  // getAll: async () => {
  //   return db.select().from(placeTable);
  // },
  // getById: async (id: string) => {
  //   const [place] = await db
  //     .select()
  //     .from(placeTable)
  //     .where(eq(placeTable.id, id));

  //   return place;
  // },
  // updateById: async (id: string, placeData: any) => {
  //   const [place] = await db
  //     .update(placeTable)
  //     .set(placeData)
  //     .where(eq(placeTable.id, id))
  //     .returning();

  //   return place;
  // },
  // deleteById: async (id: string) => {
  //   const [place] = await db
  //     .delete(placeTable)
  //     .where(eq(placeTable.id, id))
  //     .returning();

  //   return place;
  // },
  // deleteAll: async () => {
  //   const deletedPlaces = await db
  //     .delete(placeTable)
  //     .returning({ deleted: placeTable.id });
  //   return deletedPlaces;
  // },
});
