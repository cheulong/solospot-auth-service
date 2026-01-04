import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.middleware";
import { createAuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { createUserSchema } from "../db/schema/auth.schema";
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

    router.route("/send-verification").post(authenticate, asyncHandler(controller.sendVerification));
    
    router.route("/verify-email").post(authenticate, asyncHandler(controller.verifyEmail));

    router.route("/verify-otp").post(authenticate, asyncHandler(controller.verifyOtp));

    // router.post("/password-reset", (req: express.Request, res: express.Response) => {
    //     res.json({ message: "Password reset endpoint" });
    // });

    // router.post("/verify-email", (req, res) => {
    //     res.json({ message: "Verify email endpoint" });
    // });

    return router;
};
