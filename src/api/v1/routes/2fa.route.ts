import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { validate } from "../middleware/validate.middleware";
import { recoveryLoginSchema } from "../db/schema/auth.validation";
import { authenticate } from "../middleware/auth.middleware";
import { createTwoFactorController } from "../controllers/2fa.controller";
import { TwoFactorServiceType } from "../services/twoFactor.service";

export const createTwoFactorRoute = (twoFactorService: TwoFactorServiceType) => {
    const router = express.Router();
    const controller = createTwoFactorController(twoFactorService);


  /**
   * @openapi
   * /api/v1/auth/2fa/setup:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Setup 2FA
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 2FA setup successfully
   *       401:
   *         description: Unauthorized
   */
  router.route("/2fa/setup").post(authenticate, asyncHandler(controller.setup2FA));

  /**
   * @openapi
   * /api/v1/auth/2fa/verify:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Verify 2FA
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 2FA verified successfully
   *       401:
   *         description: Unauthorized
   */
  router.route("/2fa/verify").post(authenticate, asyncHandler(controller.verify2FA));

  /**
   * @openapi
   * /api/v1/auth/2fa/recover:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Recover 2FA
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 2FA recovered successfully
   *       401:
   *         description: Unauthorized
   */
  router.route("/2fa/recover").post(validate(recoveryLoginSchema), asyncHandler(controller.recoveryLogin));


    return router;
};