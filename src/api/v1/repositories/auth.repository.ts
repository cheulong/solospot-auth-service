import { eq } from "drizzle-orm";
import { authTable, refreshTokenTable, verificationTable } from "../db/schema/auth.schema";
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
  getById: async (id: string) => {
    const [auth] = await db
      .select()
      .from(authTable)
      .where(eq(authTable.id, id));
    return auth;
  },
  updatePasswordById: async (accountId: string, newPassword: string) => {
    const [updatedAuth] = await db
      .update(authTable)
      .set({ passwordHash: newPassword })
      .where(eq(authTable.id, accountId))
      .returning();
    return updatedAuth;
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
  deleteRefreshTokenById: async (accountId: string) => {
    await db
      .delete(refreshTokenTable)
      .where(eq(refreshTokenTable.accountId, accountId));
  },
  updateOtp: async (accountId: string, otp: string, expiresAt: Date, attempts: number) => {
    const existingToken = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.accountId, accountId));

    if (existingToken.length > 0) {
      const [updatedAuth] = await db
        .update(verificationTable)
        .set({ otp, accountId, expiresAt, attempts })
        .where(eq(verificationTable.accountId, accountId))
        .returning();
      return updatedAuth;
    } else {
      const [newToken] = await db
        .insert(verificationTable)
        .values({ otp, accountId, expiresAt })
        .returning();
      return newToken;
    }
  },
  getOtp: async (accountId: string) => {
    const [otp] = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.accountId, accountId));
    return otp;
  },
  deleteOtp: async (accountId: string) => {
    await db
      .delete(verificationTable)
      .where(eq(verificationTable.accountId, accountId));
  },
  updateVerification: async (accountId: string, emailVerified: boolean) => {
    const [updatedAuth] = await db
      .update(authTable)
      .set({
        emailVerified,
        emailVerifiedAt: new Date()
      })
      .where(eq(authTable.id, accountId))
      .returning();
    return updatedAuth;
  }
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
