import { createRepositories } from "../repositories";
import { createPasswordService } from "./password.service";
import { createOtpService } from "./otp.service";
import { createTwoFactorService } from "./twoFactor.service";
import { createPasswordlessService } from "./passwordless.service";
import { createAuthService } from "./auth.service";

export const createService = (db: any) => {
    const { authRepo, refreshTokenRepo, verificationRepo } = createRepositories(db);
    
    const authService = createAuthService(authRepo, refreshTokenRepo);
    const passwordService = createPasswordService(authRepo, refreshTokenRepo, verificationRepo);
    const otpService = createOtpService(verificationRepo);
    const twoFactorService = createTwoFactorService(authRepo);
    const passwordlessService = createPasswordlessService(authRepo, verificationRepo,refreshTokenRepo);

    return {
        authService,
        passwordService,
        otpService,
        twoFactorService,
        passwordlessService,
    };
};

export type ServiceType = ReturnType<typeof createService>;