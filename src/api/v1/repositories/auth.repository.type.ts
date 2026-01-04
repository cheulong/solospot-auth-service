export interface AuthRepository {
  create: (authData: any) => Promise<any>;
  getByEmail: (email: string) => Promise<any>;
  getById: (id: string) => Promise<any>;
  updatePasswordById: (id: string, newPassword: string) => Promise<any>;
  saveRefreshToken: (authId: string, refreshToken: string, expiresAt: Date) => Promise<any>;
  getRefreshTokenByToken: (refreshToken: string) => Promise<any>;
  deleteRefreshToken: (refreshToken: string) => Promise<void>;
  deleteRefreshTokenById: (accountId: string) => Promise<void>;
  updateOtp: (accountId: string, otp: string, expiresAt: Date, attempts: number) => Promise<any>;
  getOtp: (accountId: string) => Promise<any>;
  deleteOtp: (accountId: string) => Promise<void>;
  updateVerification: (accountId: string, verification: boolean) => Promise<any>;
  // getAll: () => Promise<any[]>;
  // getById: (id: string) => Promise<any>;
  // updateById: (id: string, authData: any) => Promise<any>;
  // deleteById: (id: string) => Promise<any>;
  // deleteAll: () => Promise<any[]>;
}
