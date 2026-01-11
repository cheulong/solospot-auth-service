import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { createVerificationController } from "../controllers/verification.controller";
import { OtpServiceType } from "../services/otp.service";

export const createVerificationRoute = (otpService: OtpServiceType) => {
    const router = express.Router();
    const controller = createVerificationController(otpService);

    /**
     * @openapi
     * /api/v1/auth/send-email-verification:
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
    router.route("/send-email-verification").post(authenticate, asyncHandler(controller.sendEmailVerification));

    /**
     * @openapi
     * /api/v1/auth/verify-otp:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Verify OTP
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - type
     *               - otp
     *             properties:
     *              type:
     *               type: string
     *               description: The type of verification
     *               enum:
     *                 - email_verification
     *                 - password_reset
     *              otp:
     *               type: string
     *               description: The OTP
     *     responses:
     *       200:
     *         description: OTP verified successfully
     *       401:
     *         description: Unauthorized
     */
    router.route("/verify-otp").post(authenticate, asyncHandler(controller.verifyOtp));

    return router;
};
