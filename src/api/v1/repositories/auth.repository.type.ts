export interface AuthRepository {
  create: (authData: any) => Promise<any>;
  getByEmail: (email: string) => Promise<any>;
  getById: (id: string) => Promise<any>;
  updatePasswordById: (id: string, newPassword: string) => Promise<any>;
  saveRefreshToken: (authId: string, refreshToken: string, expiresAt: Date) => Promise<any>;
  getRefreshTokenByToken: (refreshToken: string) => Promise<any>;
  deleteRefreshToken: (refreshToken: string) => Promise<void>;
  deleteRefreshTokenById: (accountId: string) => Promise<void>;
  updateOtp: (accountId: string, identifier: string, otp: string, expiresAt: Date, attempts: number, reason: string) => Promise<any>;
  getOtp: (accountId: string) => Promise<any>;
  getOtpByEmail: (email: string) => Promise<any>;
  deleteOtp: (accountId: string) => Promise<void>;
  updateVerification: (accountId: string, verification: boolean) => Promise<any>;
  updateTwoFactorSecret: (email: string, twoFactorSecret: string) => Promise<any>;
  updateTwoFactorVerified: (email: string, twoFactorEnabled: boolean) => Promise<any>;
  saveRecoveryCodes: (email: string, recoveryCodes: string[]) => Promise<any>;
}
