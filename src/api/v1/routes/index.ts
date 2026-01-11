import { ServiceType } from "../services";
import express from "express";
import { createAuthRoute } from "./auth.route";
import { createPasswordRoute } from "./password.route";
import { createVerificationRoute } from "./verification.route";
import { createTwoFactorRoute } from "./2fa.route";
import { createPasswordlessRoute } from "./passwordless.route";



export const createRouter = (services: ServiceType) => {
  const router = express.Router();

  router.use("/auth", createAuthRoute(services.authService));
  router.use("/auth", createPasswordRoute(services.passwordService, services.otpService));
  router.use("/auth", createVerificationRoute(services.otpService));
  router.use("/auth", createTwoFactorRoute(services.twoFactorService));
  router.use("/auth", createPasswordlessRoute(services.passwordlessService));

  return router;
};