import type { AuthService } from "./auth.type";
import { createAuthRepository } from "../repositories/auth.repository";
import { hashPassword, verifyPassword } from "../../../../security/hash";
import jwt from "jsonwebtoken";
import { decodeToken, generateRefreshToken, generateToken, verifyRefreshToken } from "../../../../security/jwt";
import { DateTime } from "luxon";
import { HttpError } from "../../../errors/HttpError";

export const createAuthService = (db: any): AuthService => {
  const authRepo = createAuthRepository(db);
  return {
    createAccount: async (authData: any) => {
      const hashedPassword = await hashPassword(authData.password);

      return authRepo.create({
        email: authData.email,
        passwordHash: hashedPassword,
      });
    },
    getAccountByEmail: async (email: string) => {
      return authRepo.getByEmail(email);
    },
    login: async (email: string, password: string) => {
      const account = await authRepo.getByEmail(email);
      if (!account) {
        throw new HttpError("Account not found", 404);
      }
      const isValid = await verifyPassword(password, account.passwordHash);
      if (!isValid) {
        throw new HttpError("Invalid password", 401);
      }
      const refreshToken = generateRefreshToken({
        accountId: account.id,
        email: account.email,
        isRefresh: true
      });
      const decodedRefreshToken = decodeToken(refreshToken);
      const { exp } = decodedRefreshToken as { exp: number };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(account.id, refreshToken, expDate);

      const accessToken = generateToken({
        accountId: account.id,
        email: account.email,
      });

      return { email: account.email, accessToken, refreshToken };
    },

    refreshToken: async (refreshToken: string) => {
      // TODO: Implement refresh token logic
      // This should validate the refresh token and issue a new access token
      // For now, just return a placeholder response
      const isValidToken = verifyRefreshToken(refreshToken);
      if (!isValidToken) {
        throw new Error("Invalid or expired refresh token");
      }

      const storedRefreshToken = await authRepo.getRefreshTokenByToken(refreshToken);
      if (!storedRefreshToken) {
        throw new Error("Refresh token not found");
      }
      if (storedRefreshToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
      }
      if (storedRefreshToken.expiresAt < new Date()) {
        throw new Error("Refresh token has expired");
      }

      const newRefreshToken = generateRefreshToken({
        accountId: storedRefreshToken.accountId,
        email: storedRefreshToken.email,
        isRefresh: true
      });

      const decodedNewRefreshToken = decodeToken(newRefreshToken);
      const { exp, accountId, email } = decodedNewRefreshToken as { exp: number; accountId: string; email: string };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(accountId, newRefreshToken, expDate);

      const accessToken = generateToken({
        accountId,
        email
      });

      return { message: "Refresh token processed", email, accessToken, refreshToken };
    },
    deleteRefreshToken: async (refreshToken: string) => {
      await authRepo.deleteRefreshToken(refreshToken);
    },
    changePassword: async (accountId: string, oldPassword: string, newPassword: string) => {
      const account = await authRepo.getById(accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      const isValid = await verifyPassword(oldPassword, account.passwordHash);
      if (!isValid) {
        throw new Error("Invalid password");
      }
      const hashedPassword = await hashPassword(newPassword);
      await authRepo.updatePasswordById(accountId, hashedPassword);
      // Delete all refresh tokens for the account
      await authRepo.deleteRefreshTokenById(accountId)
      return { message: "Password changed successfully" };
    }

    // getAllPlaces: async () => {
    //   return placeRepo.getAll();
    // },
    // getPlaceById: async (id: string) => {
    //   const place = await placeRepo.getById(id);
    //   if (!place) {
    //     throw new Error(`Place with id ${id} not found`);
    //   }
    //   return place;
    // },
    // updatePlaceById: async (id: string, placeData: any) => {
    //   await placeRepo.getById(id);
    //   return placeRepo.updateById(id, placeData);
    // },
    // deletePlaceById: async (id: string) => {
    //   await placeRepo.getById(id);
    //   return placeRepo.deleteById(id);
    // },
    // deleteAllPlaces: async () => {
    //   return placeRepo.deleteAll();
    // },
  }
};
