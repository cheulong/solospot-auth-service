export interface AuthRepository {
  create: (authData: any) => Promise<any>;
  getByEmail: (email: string) => Promise<any>;
  getById: (id: string) => Promise<any>;
  updatePasswordById: (id: string, newPassword: string) => Promise<any>;
  updateVerification: (accountId: string, verification: boolean) => Promise<any>;
  updateTwoFactorSecret: (email: string, twoFactorSecret: string) => Promise<any>;
  updateTwoFactorVerified: (email: string, twoFactorEnabled: boolean) => Promise<any>;
  saveRecoveryCodes: (email: string, recoveryCodes: string[]) => Promise<any>;
}
