import { tokenHash } from "../security/hash";
import { decodeToken, generateRefreshToken, generateToken } from "../security/jwt";

export const issueTokens = async (
  account: any,
  refreshTokenRepo: any
) => {
  const refreshToken = generateRefreshToken({
    accountId: account.id,
    email: account.email,
    isRefresh: true,
  });

  const decoded = decodeToken(refreshToken) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  const refreshTokenHash = await tokenHash(refreshToken);
  await refreshTokenRepo.saveRefreshToken(
    account.id,
    refreshTokenHash,
    expiresAt
  );

  const accessToken = generateToken({
    accountId: account.id,
    email: account.email,
  });

  return { accessToken, refreshToken };
};
