import type { AuthService } from "./auth.type";
import { createAuthRepository } from "../repositories/auth.repository";
import { hashString, verifyString } from "../../../../security/hash";
import jwt from "jsonwebtoken";
import { decodeToken, generateRefreshToken, generateToken, verifyRefreshToken } from "../../../../security/jwt";
import { DateTime } from "luxon";
import { HttpError } from "../../../errors/HttpError";
import { generateOtp, otpExpiresIn } from "../../../utils/otp";
import { mailer } from "../../../utils/mailer";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from "../../../utils/crypto";
import argon2 from 'argon2';

const OTP_MAX_ATTEMPTS = 5;

export const createAuthService = (db: any): AuthService => {
  const authRepo = createAuthRepository(db);
  return {
    createAccount: async (authData: any) => {
      const hashedPassword = await hashString(authData.password);

      return authRepo.create({
        email: authData.email,
        passwordHash: hashedPassword,
      });
    },
    getAccountByEmail: async (email: string) => {
      return authRepo.getByEmail(email);
    },
    login: async (email: string, password: string) => {
      const account = await authRepo.getByEmail(email);
      if (!account) {
        throw new HttpError("Account not found", 404);
      }
      const isValid = await verifyString(password, account.passwordHash);
      if (!isValid) {
        throw new HttpError("Invalid password", 401);
      }
      const refreshToken = generateRefreshToken({
        accountId: account.id,
        email: account.email,
        isRefresh: true
      });
      const decodedRefreshToken = decodeToken(refreshToken);
      const { exp } = decodedRefreshToken as { exp: number };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(account.id, refreshToken, expDate);

      const accessToken = generateToken({
        accountId: account.id,
        email: account.email,
      });

      return { email: account.email, accessToken, refreshToken };
    },

    refreshToken: async (refreshToken: string) => {
      // TODO: Implement refresh token logic
      // This should validate the refresh token and issue a new access token
      // For now, just return a placeholder response
      const isValidToken = verifyRefreshToken(refreshToken);
      if (!isValidToken) {
        throw new Error("Invalid or expired refresh token");
      }

      const storedRefreshToken = await authRepo.getRefreshTokenByToken(refreshToken);
      if (!storedRefreshToken) {
        throw new Error("Refresh token not found");
      }
      if (storedRefreshToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
      }
      if (storedRefreshToken.expiresAt < new Date()) {
        throw new Error("Refresh token has expired");
      }

      const newRefreshToken = generateRefreshToken({
        accountId: storedRefreshToken.accountId,
        email: storedRefreshToken.email,
        isRefresh: true
      });

      const decodedNewRefreshToken = decodeToken(newRefreshToken);
      const { exp, accountId, email } = decodedNewRefreshToken as { exp: number; accountId: string; email: string };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(accountId, newRefreshToken, expDate);

      const accessToken = generateToken({
        accountId,
        email
      });

      return { message: "Refresh token processed", email, accessToken, refreshToken };
    },
    deleteRefreshToken: async (refreshToken: string) => {
      await authRepo.deleteRefreshToken(refreshToken);
    },
    changePassword: async (accountId: string, oldPassword: string, newPassword: string) => {
      const account = await authRepo.getById(accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      const isValid = await verifyString(oldPassword, account.passwordHash);
      if (!isValid) {
        throw new Error("Invalid password");
      }
      const hashedPassword = await hashString(newPassword);
      await authRepo.updatePasswordById(accountId, hashedPassword);
      // Delete all refresh tokens for the account
      await authRepo.deleteRefreshTokenById(accountId)
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
      await authRepo.updateOtp(account.id, account.email, hashedOtp, expiresAt, 0, "password_reset");
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
    resetPassword: async (accountId: string, otp: string, newPassword: string) => {
      const storedOtp = await authRepo.getOtp(accountId);
      if (!storedOtp) {
        throw new HttpError("OTP not found", 404);
      }
      if (storedOtp.expiresAt < new Date()) {
        await authRepo.deleteOtp(accountId);
        throw new HttpError("OTP has expired", 401);
      }
      if (storedOtp.attempts >= OTP_MAX_ATTEMPTS) {
        await authRepo.deleteOtp(accountId);
        throw new HttpError("OTP has been used too many times", 429);
      }
      const isValid = await verifyString(otp, storedOtp.otp);
      if (!isValid) {
        storedOtp.attempts++;
        await authRepo.updateOtp(accountId, 'email', storedOtp.otp, storedOtp.expiresAt, storedOtp.attempts, "password_reset");
        throw new HttpError("Invalid OTP", 401);
      }
      const hashedPassword = await hashString(newPassword);
      await authRepo.updatePasswordById(accountId, hashedPassword);
      await authRepo.deleteOtp(accountId);
      return { message: "Password reset successfully" };
    },
    sendVerification: async (accountId: string) => {
      const account = await authRepo.getById(accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      const otp = generateOtp();
      const hashedOtp = await hashString(otp);
      const expiresAt = otpExpiresIn();
      await authRepo.updateOtp(accountId, account.email, hashedOtp, expiresAt, 0, "email_verification");
      try {
        await mailer.sendMail({
          from: `Solo Spot App<no-reply@cheulongsear.dev>`,
          to: account.email,
          subject: "Your verification code",
          html: `<p>Your OTP is <b>${otp}</b>. It expires in 15 minutes.</p>`,
        })
      } catch (err) {
        throw new Error("Failed to send OTP email");
      }
      return { message: "Verification email sent successfully", otp, email: account.email };
    },
    verifyOtp: async (accountId: string, otp: string, emailVerified: boolean) => {
      const storedOtp = await authRepo.getOtp(accountId);
      if (!storedOtp) {
        throw new HttpError("OTP not found", 404);
      }
      if (storedOtp.expiresAt < new Date()) {
        await authRepo.deleteOtp(accountId);
        throw new HttpError("OTP has expired", 401);
      }
      if (storedOtp.attempts >= OTP_MAX_ATTEMPTS) {
        await authRepo.deleteOtp(accountId);
        throw new HttpError("OTP has been used too many times", 429);
      }
      const isValid = await verifyString(otp, storedOtp.otp);
      if (!isValid) {
        storedOtp.attempts++;
        await authRepo.updateOtp(accountId, 'email', storedOtp.otp, storedOtp.expiresAt, storedOtp.attempts, "email_verification");
        throw new HttpError("Invalid OTP", 401);
      }
      if (emailVerified) {
        await authRepo.updateVerification(accountId, true);
      }
      await authRepo.deleteOtp(accountId);
      return { message: "OTP verified successfully" };
    },
    setup2FA: async (email: string) => {
      const account = await authRepo.getByEmail(email);
      if (account?.twoFactorSecret) {
        throw new HttpError("2FA is already set up for this account", 400);
      }
      // Generate a unique secret for the user
      const secret = authenticator.generateSecret();

      // Create a URI for the authenticator app (Label: Issuer)
      const otpauth = authenticator.keyuri(email, 'SoloSpot', secret);

      // Generate 10 recovery codes
      const recoveryCodes = Array.from({ length: 5 }, () =>
        randomBytes(4).toString('hex') // e.g., 'a1b2c3d4'
      );
      const encryptedRecoveryCodes = await Promise.all(recoveryCodes.map(code => hashString(code)));
      // Store recovery codes in database for user
      await authRepo.saveRecoveryCodes(email, encryptedRecoveryCodes);

      // Generate QR code as a Data URL to display on the frontend
      const imageUrl = await QRCode.toDataURL(otpauth);
      const encryptedSecret = encryptSecret(secret);
      await authRepo.updateTwoFactorSecret(email, encryptedSecret);

      return {
        message: "2FA setup initiated",
        email,
        recoveryCodes,
        secret, // User might need this for manual entry
        qrcode: imageUrl
      };
    },
    verify2FA: async (email: string, otp: string) => {
      // Retrieve the secret from your database
      const account = await authRepo.getByEmail(email);
      console.log({ account });

      const twoFactorSecret = account?.twoFactorSecret;
      if (!account || !twoFactorSecret) {
        throw new HttpError("2FA not set up for this user", 400);
      }

      const decryptedSecret = decryptSecret(twoFactorSecret);
      const isValid = authenticator.check(otp, decryptedSecret);
      if (!isValid) {
        throw new HttpError("Invalid 2FA code", 400);
      }



      // Mark the user as 2FA enabled in your database
      await authRepo.updateTwoFactorVerified(email, true);

      return { success: true, message: "2FA enabled successfully" };
    },
    verifyAndUseRecoveryCode: async (email: string, recoveryCode: string) => {
      const account = await authRepo.getByEmail(email);
      if (!account || !account?.twoFactorSecret) {
        throw new HttpError("2FA not enabled or user not found", 400);
      }
      let matchedIndex = -1;
      for (let i = 0; i < account.twoFactorBackupCodes.length; i++) {
        const isMatch = await verifyString(recoveryCode, account.twoFactorBackupCodes[i]);
        if (isMatch) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex === -1) {
        throw new HttpError("Invalid recovery code", 400);
      }
      account.twoFactorBackupCodes.splice(matchedIndex, 1);
      await authRepo.saveRecoveryCodes(email, account.twoFactorBackupCodes);
      const refreshToken = generateRefreshToken({
        accountId: account.id,
        email: account.email,
        isRefresh: true
      });
      const decodedRefreshToken = decodeToken(refreshToken);
      const { exp } = decodedRefreshToken as { exp: number };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(account.id, refreshToken, expDate);

      const accessToken = generateToken({
        accountId: account.id,
        email: account.email,
      });
      // In a real implementation, you would mark the recovery code as used
      return {
        success: true,
        message: "Recovery code verified successfully",
        accessToken,
        refreshToken
      };
    },
    loginPasswordless: async (email: string) => {
      // In a real implementation, you would generate a magic link and send it to the user
      const account = await authRepo.getByEmail(email);
      if (!account) {
        throw new HttpError("Account not found", 404);
      }
      // 1. Generate a raw random token
      const rawToken = randomBytes(32).toString('hex');

      // 2. Hash it before saving (security rule: never store raw secrets)
      const hashedToken = await argon2.hash(rawToken);

      // 3. Save to DB with expiration (e.g., 15 minutes)
      await authRepo.updateOtp(account?.id, email, hashedToken, new Date(Date.now() + 15 * 60 * 1000), 0, "passwordless_login");

      // 4. Create the URL
      const magicLink = `http://localhost:5000/auth/v1/login/callback?token=${rawToken}&email=${email}`;

      try {
        await mailer.sendMail({
          from: `Solo Spot App<no-reply@cheulongsear.dev>`,
          to: account.email,
          subject: "Your magic link",
          html: `<p>Click <a href="${magicLink}">here</a> to login.</p>`,
        });
        console.log(`Magic link sent to ${account.email}: ${magicLink}`);
      } catch (err) {
        console.error("Failed to send magic link email:", err);
        throw new Error("Failed to send magic link email");
      }
      
      return {
        success: true,
        message: "Passwordless login initiated. Check your email for the magic link.",
        magicLink,
        token: rawToken // for testing purposes
      };
    },

    loginCallback: async (email: string, token: string) => {
      // Verify the OTP
      const otpRecord = await authRepo.getOtpByEmail(email);
      if (!otpRecord) {
        throw new HttpError("Invalid or expired magic link", 400);
      }
      if (otpRecord.expiresAt < new Date()) {
        throw new HttpError("Magic link has expired", 400);
      }
      
      // Verify the token
      const isValid = await argon2.verify(otpRecord.otp, token);
      if (!isValid) {
        throw new HttpError("Invalid or expired magic link", 400);
      }
      
      // Delete the OTP after successful verification
      await authRepo.deleteOtp(otpRecord.accountId);
      
      // Get the account to return user info
      const account = await authRepo.getByEmail(email);
      if (!account) {
        throw new HttpError("Account not found", 404);
      }
      const refreshToken = generateRefreshToken({
        accountId: account.id,
        email: account.email,
        isRefresh: true
      });
      const decodedRefreshToken = decodeToken(refreshToken);
      const { exp } = decodedRefreshToken as { exp: number };
      const expDate = new Date(exp * 1000)

      await authRepo.saveRefreshToken(account.id, refreshToken, expDate);

      const accessToken = generateToken({
        accountId: account.id,
        email: account.email,
      });
      
      // In a real implementation, you would verify the token and issue JWT
      // For now, just return success
      return {
        success: true,
        accessToken,
        refreshToken,
        message: "Passwordless login callback processed successfully.",
        email,
      };
    },

    // getAllPlaces: async () => {
    //   return placeRepo.getAll();
    // },
    // getPlaceById: async (id: string) => {
    //   const place = await placeRepo.getById(id);
    //   if (!place) {
    //     throw new Error(`Place with id ${id} not found`);
    //   }
    //   return place;
    // },
    // updatePlaceById: async (id: string, placeData: any) => {
    //   await placeRepo.getById(id);
    //   return placeRepo.updateById(id, placeData);
    // },
    // deletePlaceById: async (id: string) => {
    //   await placeRepo.getById(id);
    //   return placeRepo.deleteById(id);
    // },
    // deleteAllPlaces: async () => {
    //   return placeRepo.deleteAll();
    // },
  }
};

