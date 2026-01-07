import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { createAuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { createUserSchema, recoveryLoginSchema } from "../db/schema/auth.validation";
import { authenticate } from "../middleware/auth";

export const createAuthRouter = ({ authService }: { authService: any }) => {
    const router = express.Router();
    const controller = createAuthController(authService);

    router.route("/register")
        .post(validate(createUserSchema), asyncHandler(controller.createAccount));

    router.route("/login").post(asyncHandler(controller.login));

    router.route("/refresh").post(asyncHandler(controller.refreshToken));

    router.route("/logout").post(authenticate, asyncHandler(controller.logout));

    router.route("/change-password").post(authenticate, asyncHandler(controller.changePassword));

    router.route("/forgot-password").post(asyncHandler(controller.forgotPassword));

    router.route("/reset-password").post(asyncHandler(controller.resetPassword));

    router.route("/send-verification").post(authenticate, asyncHandler(controller.sendVerification));
    
    router.route("/verify-email").post(authenticate, asyncHandler(controller.verifyEmail));

    router.route("/verify-otp").post(authenticate, asyncHandler(controller.verifyOtp));

    router.route("/2fa/setup").post(authenticate, asyncHandler(controller.setup2FA));

    router.route("/2fa/verify").post(authenticate, asyncHandler(controller.verify2FA));

    router.route("/2fa/recover").post(validate(recoveryLoginSchema), asyncHandler(controller.recoveryLogin));

    router.route("/login/passwordless").post(asyncHandler(controller.loginPasswordless));

    router.route("/login/callback").get(asyncHandler(controller.loginCallback));

    return router;
};
