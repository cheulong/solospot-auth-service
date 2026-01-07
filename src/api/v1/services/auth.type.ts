export interface AuthService {
  createAccount: (userData: any) => Promise<any>;
  getAccountByEmail: (email: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  refreshToken: (refreshToken: string) => Promise<any>;
  deleteRefreshToken: (refreshToken: string) => Promise<void>;
  changePassword: (accountId: string, oldPassword: string, newPassword: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (accountId: string, otp: string, newPassword: string) => Promise<any>;
  sendVerification: (accountId: string) => Promise<any>;
  verifyOtp: (accountId: string, otp: string, emailVerified: boolean) => Promise<any>;
  setup2FA: (email: string) => Promise<any>;
  verify2FA: (email: string, otp: string) => Promise<any>;
  verifyAndUseRecoveryCode: (email: string, recoveryCode: string) => Promise<any>;
  loginPasswordless: (email: string) => Promise<any>;
  loginCallback: (email: string, token: string) => Promise<any>;
}
