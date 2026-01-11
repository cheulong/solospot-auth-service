import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { createAuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { createUserSchema, loginSchema } from "../db/schema/auth.validation";
import { authenticate } from "../middleware/auth.middleware";
import { AuthServiceType } from "../services/auth.service";

export const createAuthRoute = (authService: AuthServiceType) => {
  const router = express.Router();
  const controller = createAuthController(authService);

  /**
    * @openapi
    * /api/v1/auth/register:
    *   post:
    *     tags:
    *       - Auth
    *     summary: Register a new user
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: "#/components/schemas/CreateUserInput"
    *     responses:
    *       201:
    *         description: User registered successfully
    *         content:
    *           application/json:
    *             schema:
    *               $ref: "#/components/schemas/Account"
    *       409:
    *         description: Account already exists
    */
  router.route("/register")
    .post(validate(createUserSchema), asyncHandler(controller.createAccount));

  /**
   * @openapi
   * /api/v1/auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Login a user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/LoginInput"
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Invalid email or password
   */
  router.route("/login").post(validate(loginSchema), asyncHandler(controller.login));

  /**
   * @openapi
   * /api/v1/auth/refresh:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Refresh access token
   *     parameters:
   *       - in: header
   *         name: Cookie
   *         schema:
   *           type: string
   *         example: "refreshToken=YOUR_TOKEN_HERE"
   *         description: "Send refreshToken as a cookie manually"
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid or expired refresh token
   */
  router.route("/refresh").post(asyncHandler(controller.refreshToken));

  /**
   * @openapi
   * /api/v1/auth/logout:
   *   post:
   *     tags:
   *       - Auth
   *     summary: Logout a user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User logged out successfully
   */
  router.route("/logout").post(authenticate, asyncHandler(controller.logout));

  return router;
};
