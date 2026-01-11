import { ServiceType } from "../services";
import { createAuthController } from "./auth.controller";
import { createTwoFactorController } from "./2fa.controller";
import { createPasswordController } from "./password.controller";
import { createVerificationController } from "./verification.controller";
import { createPasswordlessController } from "./passwordless.controller";

export const createController = (services: ServiceType) => {
  const authController = createAuthController(services.authService);
  const passwordController = createPasswordController(services.passwordService, services.otpService);
  const verificationController = createVerificationController(services.otpService);
  const twoFactorController = createTwoFactorController(services.twoFactorService);
  const passwordlessController = createPasswordlessController(services.passwordlessService);

  return {
    authController,
    passwordController,
    verificationController,
    twoFactorController,
    passwordlessController
  }
};