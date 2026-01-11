import { hashString, tokenHash, verifyString } from "../../../security/hash";
import { HttpError } from "../../../errors/HttpError";
import { HTTP_STATUS } from "../../../constants/httpStatus";
import { issueTokens } from "../../../utils/issueTokens";
import { verifyRefreshToken } from "../../../security/jwt";

export const createAuthService = (authRepo: any, refreshTokenRepo: any) => ({
  createAccount: async (authData: any) => {
    const hashedPassword = await hashString(authData.password);
    return authRepo.create({
      email: authData.email,
      passwordHash: hashedPassword,
    });
  },
  login: async (password: string, account: any) => {
    const isValid = await verifyString(password, account.passwordHash);
    if (!isValid) {
      throw new HttpError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }
    const { accessToken, refreshToken } = await issueTokens(account, refreshTokenRepo);
    return { email: account.email, accessToken, refreshToken };
  },
  getByEmail: async (email: string) => {
    return authRepo.getByEmail(email);
  },
  logout: async (refreshToken: string) => {
    const refreshTokenHash = await tokenHash(refreshToken);
    const deleted = await refreshTokenRepo.deleteRefreshToken(refreshTokenHash);
    return deleted;
  },
  refreshToken: async (refreshToken: string) => {
    if (!verifyRefreshToken(refreshToken)) throw new HttpError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    const refreshTokenHash = await tokenHash(refreshToken);
    const stored = await refreshTokenRepo.getRefreshTokenByToken(refreshTokenHash);
    if (!stored) throw new HttpError("Refresh token not found", HTTP_STATUS.NOT_FOUND);
    if (stored.revokedAt) throw new HttpError("Refresh token has been revoked", HTTP_STATUS.UNAUTHORIZED);
    if (stored.expiresAt < new Date()) throw new HttpError("Refresh token expired", HTTP_STATUS.UNAUTHORIZED);
    const account = await authRepo.getById(stored.accountId);
    if (!account) throw new HttpError("Account not found", 404);
    return await issueTokens(account, refreshTokenRepo);
  }
});

export type AuthServiceType = ReturnType<typeof createAuthService>;