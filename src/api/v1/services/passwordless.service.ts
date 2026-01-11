import { randomBytes } from "node:crypto";
import { hashString, verifyString } from "../../../security/hash";
import { mailer } from "../../../utils/mailer";
import { HttpError } from "../../../errors/HttpError";
import { issueTokens } from "../../../utils/issueTokens";

export const createPasswordlessService = (authRepo: any, verificationRepo: any, refreshTokenRepo: any) => ({
  loginPasswordless: async (email: string) => {
    const account = await authRepo.getByEmail(email);
    if (!account) throw new HttpError("Account not found", 404);

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = await hashString(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await verificationRepo.updateOtp(account.id, email, hashedToken, expiresAt, 0, "passwordless_login");

    const magicLink = `http://localhost:5000/api/v1/auth/login/callback?token=${rawToken}&email=${email}`;
    await mailer.sendMail({
      from: `Solo Spot App<no-reply@cheulongsear.dev>`,
      to: email,
      subject: "Your magic link",
      html: `<p>Click <a href="${magicLink}">here</a> to login.</p>`,
    });

    return { message: "Passwordless login initiated", magicLink };
  },

  loginCallback: async (email: string, token: string) => {
    const otpRecord = await verificationRepo.getOtpByEmail(email);
    if (!otpRecord || otpRecord.expiresAt < new Date()) throw new HttpError("Invalid or expired magic link", 400);

    if (!await verifyString(token, otpRecord.otp)) throw new HttpError("Invalid magic link", 400);

    await verificationRepo.deleteOtp(otpRecord.accountId);
    const account = await authRepo.getByEmail(email);
    const { accessToken, refreshToken } = await issueTokens(account, refreshTokenRepo);

    return { accessToken, refreshToken };
  }
});

export type PasswordlessServiceType = ReturnType<typeof createPasswordlessService>;