import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { createAuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { createUserSchema, loginSchema, recoveryLoginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, loginPasswordlessSchema } from "../db/schema/auth.validation";
import { authenticate } from "../middleware/auth";

export const createAuthRouter = ({ authService }: { authService: any }) => {
    const router = express.Router();
    const controller = createAuthController(authService);

    /**
      * @openapi
      * /auth/v1/register:
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
     * /auth/v1/login:
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
     * /auth/v1/refresh:
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
     * /auth/v1/logout:
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

    /**
     * @openapi
     * /auth/v1/change-password:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Change user password
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/ChangePasswordInput"
     *     responses:
     *       200:
     *         description: Password changed successfully
     *       401:
     *         description: Unauthorized
     *       400:
     *         description: Invalid password
     */
    router.route("/change-password").post(authenticate, validate(changePasswordSchema), asyncHandler(controller.changePassword));

    /**
     * @openapi
     * /auth/v1/forgot-password:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Request password reset
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/ForgotPasswordInput"
     *     responses:
     *       200:
     *         description: Password reset email sent
     *       404:
     *         description: User not found
     */
    router.route("/forgot-password").post(validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));

    /**
     * @openapi
     * /auth/v1/reset-password:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Reset user password
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/ResetPasswordInput"
     *     responses:
     *       200:
     *         description: Password reset successfully
     *       400:
     *         description: Invalid or expired token
     */
    router.route("/reset-password").post(validate(resetPasswordSchema), asyncHandler(controller.resetPassword));

    /**
     * @openapi
     * /auth/v1/send-verification:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Send email verification
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Verification email sent
     *       401:
     *         description: Unauthorized
     */
    router.route("/send-verification").post(authenticate, asyncHandler(controller.sendVerification));

    /**
     * @openapi
     * /auth/v1/verify-email:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Verify email
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Email verified successfully
     *       401:
     *         description: Unauthorized
     */
    router.route("/verify-email").post(authenticate, asyncHandler(controller.verifyEmail));

    /**
     * @openapi
     * /auth/v1/verify-otp:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Verify OTP
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: OTP verified successfully
     *       401:
     *         description: Unauthorized
     */
    router.route("/verify-otp").post(authenticate, asyncHandler(controller.verifyOtp));

    /**
     * @openapi
     * /auth/v1/2fa/setup:
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
     * /auth/v1/2fa/verify:
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
     * /auth/v1/2fa/recover:
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

    /**
     * @openapi
     * /auth/v1/login/passwordless:
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
     * /auth/v1/login/callback:
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
