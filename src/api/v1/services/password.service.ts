import { hashString, verifyString } from "../../../security/hash";
import { HttpError } from "../../../errors/HttpError";
import { generateOtp, otpExpiresIn } from "../../../utils/otp";
import { mailer } from "../../../utils/mailer";
import type { AuthRepositoryType } from "../repositories/auth.repository";
import type { RefreshTokenRepositoryType } from "../repositories/refreshToken.repository";
import type { VerificationRepositoryType } from "../repositories/verification.repository";

export const createPasswordService = (authRepo: AuthRepositoryType, refreshTokenRepo: RefreshTokenRepositoryType, verificationRepo: VerificationRepositoryType) => ({
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
  forgotPassword: async (email: string) => {
    const account = await authRepo.getByEmail(email);
    if (!account) {
      throw new HttpError("Account not found", 404);
    }
    const otp = generateOtp();
    const hashedOtp = await hashString(otp);
    const expiresAt = otpExpiresIn();
    await verificationRepo.updateOtp(account.id, account.email, hashedOtp, expiresAt, 0, "password_reset");
    try {
      await mailer.sendMail({
        from: `Solo Spot App<no-reply@cheulongsear.dev>`,
        to: account.email,
        subject: "Password Reset OTP",
        html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 15 minutes.</p>`,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new HttpError("Failed to send verification email", 500);
    }
    return { message: "OTP sent successfully", otp, account };
  },

  resetPassword: async (accountId: string, newPassword: string) => {
    const hashedPassword = await hashString(newPassword);
    await authRepo.updatePasswordById(accountId, hashedPassword);
    return { message: "Password reset successfully" };
  }
});

export type PasswordServiceType = ReturnType<typeof createPasswordService>;
