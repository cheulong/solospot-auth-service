export interface VerificationRepository {
  updateOtp(accountId: string, identifier: string, otp: string, expiresAt: Date, attempts: number, reason: string): Promise<any>;
  getOtp(accountId: string): Promise<any>;
  getOtpByEmail(email: string): Promise<any>;
  deleteOtp(accountId: string): Promise<void>;
}
