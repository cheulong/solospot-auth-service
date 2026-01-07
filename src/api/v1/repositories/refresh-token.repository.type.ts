export interface RefreshTokenRepository {
  saveRefreshToken(accountId: string, tokenHash: string, expiresAt: Date): Promise<any>;
  getRefreshTokenByToken(token: string): Promise<any>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteRefreshTokenById(accountId: string): Promise<void>;
}
