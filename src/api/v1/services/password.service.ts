import { hashString, verifyString } from "../../../security/hash";
import { HttpError } from "../../../errors/HttpError";

export const createPasswordService = (authRepo: any, refreshTokenRepo: any, verificationRepo: any) => ({
  changePassword: async (accountId: string, oldPassword: string, newPassword: string) => {
    const account = await authRepo.getById(accountId);
    if (!account) throw new HttpError("Account not found", 404);

    const isValid = await verifyString(oldPassword, account.passwordHash);
    if (!isValid) throw new HttpError("Invalid password", 401);

    const hashedPassword = await hashString(newPassword);
    await authRepo.updatePasswordById(accountId, hashedPassword);
    await refreshTokenRepo.deleteRefreshTokenById(accountId);

    return { message: "Password changed successfully" };
  },

  resetPassword: async (accountId: string, otp: string, newPassword: string, otpService: any) => {
    await otpService.verifyOtp(accountId, otp, "password_reset");

    const hashedPassword = await hashString(newPassword);
    await authRepo.updatePasswordById(accountId, hashedPassword);
    await otpService.deleteOtp(accountId);

    return { message: "Password reset successfully" };
  }
});
