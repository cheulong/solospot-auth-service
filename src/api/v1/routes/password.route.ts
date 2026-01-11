import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { validate } from "../middleware/validate.middleware";
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../db/schema/auth.validation";
import { authenticate } from "../middleware/auth.middleware";
import { createPasswordController } from "../controllers/password.controller";
import { PasswordServiceType } from "../services/password.service";
import { OtpServiceType } from "../services/otp.service";

export const createPasswordRoute = (passwordService: PasswordServiceType, otpService: OtpServiceType) => {
    const router = express.Router();
    const controller = createPasswordController(passwordService, otpService);


    /**
     * @openapi
     * /api/v1/auth/change-password:
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
     * /api/v1/auth/forgot-password:
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
     * /api/v1/auth/reset-password:
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

    return router;
};
