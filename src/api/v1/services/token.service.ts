import { generateRefreshToken, generateToken, decodeToken, verifyRefreshToken } from "../../../security/jwt";
import { HttpError } from "../../../errors/HttpError";

export const createTokenService = (authRepo: any, refreshTokenRepo: any) => ({
  issueTokens: async (account: any) => {
    const refreshToken = generateRefreshToken({ accountId: account.id, email: account.email, isRefresh: true });
    const decoded = decodeToken(refreshToken) as { exp: number };
    const expDate = new Date(decoded.exp * 1000);

    await refreshTokenRepo.saveRefreshToken(account.id, refreshToken, expDate);
    const accessToken = generateToken({ accountId: account.id, email: account.email });

    return { accessToken, refreshToken };
  },

  refreshToken: async (refreshToken: string) => {
    if (!verifyRefreshToken(refreshToken)) throw new HttpError("Invalid refresh token", 401);

    const stored = await refreshTokenRepo.getRefreshTokenByToken(refreshToken);
    if (!stored) throw new HttpError("Refresh token not found", 404);
    if (stored.expiresAt < new Date()) throw new HttpError("Refresh token expired", 401);

    const account = await authRepo.getById(stored.accountId);
    if (!account) throw new HttpError("Account not found", 404);

    return createTokenService(authRepo, refreshTokenRepo).issueTokens(account);
  }
});
