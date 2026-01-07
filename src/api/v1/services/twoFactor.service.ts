import { authenticator } from "otplib";
import QRCode from "qrcode";
import { randomBytes } from "node:crypto";
import { hashString, verifyString } from "../../../security/hash";
import { encryptSecret, decryptSecret } from "../../../utils/crypto";
import { HttpError } from "../../../errors/HttpError";
import { generateRefreshToken, generateToken } from "../../../security/jwt";

export const createTwoFactorService = (authRepo: any, refreshTokenRepo: any) => ({
  setup2FA: async (email: string) => {
    const account = await authRepo.getByEmail(email);
    if (!account) throw new HttpError("Account not found", 404);
    if (account.twoFactorSecret) throw new HttpError("2FA already set up", 400);

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, "SoloSpot", secret);

    const recoveryCodes = Array.from({ length: 5 }, () => randomBytes(4).toString("hex"));
    const encryptedRecoveryCodes = await Promise.all(recoveryCodes.map(hashString));
    await authRepo.saveRecoveryCodes(email, encryptedRecoveryCodes);

    const qrcode = await QRCode.toDataURL(otpauth);
    await authRepo.updateTwoFactorSecret(email, encryptSecret(secret));

    return { secret, qrcode, recoveryCodes };
  },

  verify2FA: async (email: string, otp: string) => {
    const account = await authRepo.getByEmail(email);
    if (!account || !account.twoFactorSecret) throw new HttpError("2FA not set up", 400);

    const decryptedSecret = decryptSecret(account.twoFactorSecret);
    const isValid = authenticator.check(otp, decryptedSecret);
    if (!isValid) throw new HttpError("Invalid 2FA code", 400);

    await authRepo.updateTwoFactorVerified(email, true);
    return { message: "2FA enabled successfully" };
  },

  useRecoveryCode: async (email: string, recoveryCode: string) => {
    const account = await authRepo.getByEmail(email);
    if (!account || !account.twoFactorSecret) throw new HttpError("2FA not enabled", 400);

    let matchedIndex = -1;
    for (let i = 0; i < account.twoFactorBackupCodes.length; i++) {
      if (await verifyString(recoveryCode, account.twoFactorBackupCodes[i])) {
        matchedIndex = i;
        break;
      }
    }
    if (matchedIndex === -1) throw new HttpError("Invalid recovery code", 400);

    account.twoFactorBackupCodes.splice(matchedIndex, 1);
    await authRepo.saveRecoveryCodes(email, account.twoFactorBackupCodes);

    // Issue tokens after recovery
    const refreshToken = generateRefreshToken({ accountId: account.id, email: account.email, isRefresh: true });
    const accessToken = generateToken({ accountId: account.id, email: account.email });
    return { accessToken, refreshToken };
  }
});
