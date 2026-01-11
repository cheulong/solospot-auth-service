import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginPasswordlessSchema } from "../db/schema/auth.validation";
import { createPasswordlessController } from "../controllers/passwordless.controller";
import { PasswordlessServiceType } from "../services/passwordless.service";

export const createPasswordlessRoute = (passwordlessService: PasswordlessServiceType) => {
  const router = express.Router();
  const controller = createPasswordlessController(passwordlessService);

  /**
   * @openapi
   * /api/v1/auth/login/passwordless:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Login with passwordless
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/LoginPasswordlessInput"
   *     responses:
   *       200:
   *         description: Login with passwordless successfully
   *       401:
   *         description: Unauthorized
   */
  router.route("/login/passwordless").post(validate(loginPasswordlessSchema), asyncHandler(controller.loginPasswordless));

  /**
   * @openapi
   * /api/v1/auth/login/callback:
   *   get:
   *     tags:
   *       - Auth
   *     summary: Login callback
   *     responses:
   *       200:
   *         description: Login callback successfully
   *       401:
   *         description: Unauthorized
   */
  router.route("/login/callback").get(asyncHandler(controller.loginCallback));

  return router;
};
