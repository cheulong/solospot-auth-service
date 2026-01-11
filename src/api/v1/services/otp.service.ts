import { generateOtp, otpExpiresIn } from "../../../utils/otp";
import { hashString, verifyString } from "../../../security/hash";
import { HttpError } from "../../../errors/HttpError";
import { mailer } from "../../../utils/mailer";
import type { VerificationRepositoryType } from "../repositories/verification.repository";

const OTP_MAX_ATTEMPTS = 5;

export const createOtpService = (verificationRepo: VerificationRepositoryType) => ({
  generateOtp: async (accountId: string, identifier: string, type: 'email_verification' | 'password_reset') => {
    const otp = generateOtp();
    const hashedOtp = await hashString(otp);
    const expiresAt = otpExpiresIn();

    await verificationRepo.updateOtp(accountId, identifier, hashedOtp, expiresAt, 0, type);

    return { otp, expiresAt };
  },

  sendOtpEmail: async (email: string, otp: string, type: 'email_verification' | 'password_reset') => {
    const subject = type === "password_reset" ? "Password Reset OTP" : "Your verification code";
    const html = `<p>Your OTP is <b>${otp}</b>. It expires in 15 minutes.</p>`;

    try {
      await mailer.sendMail({
        from: `Solo Spot App<no-reply@cheulongsear.dev>`,
        to: email,
        subject,
        html,
      });
    } catch (err) {
      throw new HttpError("Failed to send OTP email", 500);
    }
  },

  verifyOtp: async (accountId: string, otp: string, type: 'password_reset' | 'email_verification') => {
    const storedOtp = await verificationRepo.getOtp(accountId);
    
    if (!storedOtp) throw new HttpError("OTP not found", 404);
    if (storedOtp.expiresAt < new Date()) {
      await verificationRepo.deleteOtp(accountId);
      throw new HttpError("OTP has expired", 401);
    }
    if (storedOtp.attempts >= OTP_MAX_ATTEMPTS) {
      await verificationRepo.deleteOtp(accountId);
      throw new HttpError("OTP has been used too many times", 429);
    }

    const isValid = await verifyString(otp, storedOtp.otp);
    if (!isValid) {
      storedOtp.attempts++;
      await verificationRepo.updateOtp(
        accountId,
        storedOtp.identifier,
        storedOtp.otp,
        storedOtp.expiresAt,
        storedOtp.attempts,
        type
      );
      throw new HttpError("Invalid OTP", 401);
    }
    return storedOtp;
  },

  deleteOtp: (accountId: string) => verificationRepo.deleteOtp(accountId)
});

export type OtpServiceType = ReturnType<typeof createOtpService>;
