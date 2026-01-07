import { createRepositories } from "../repositories";
import { createPasswordService } from "./password.service";
import { createOtpService } from "./otp.service";
import { createTwoFactorService } from "./twoFactor.service";
import { createTokenService } from "./token.service";
import { createPasswordlessService } from "./passwordless.service";

export const createAuthService = (db: any) => {
  const { auth: authRepo, refreshToken: refreshTokenRepo, verification: verificationRepo } = createRepositories(db);

  const tokenService = createTokenService(authRepo, refreshTokenRepo);
  const otpService = createOtpService(verificationRepo);
  const passwordService = createPasswordService(authRepo, refreshTokenRepo, verificationRepo);
  const twoFactorService = createTwoFactorService(authRepo, refreshTokenRepo);
  const passwordlessService = createPasswordlessService(authRepo, verificationRepo);

  return {
    authRepo,
    refreshTokenRepo,
    verificationRepo,
    otpService,
    passwordService,
    twoFactorService,
    tokenService,
    passwordlessService
  };
};
