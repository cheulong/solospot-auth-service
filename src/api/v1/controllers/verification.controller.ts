import type { Response, Request } from "express";
import { HTTP_STATUS } from "../../../constants/httpStatus";
import { OtpServiceType } from "../services/otp.service";

// Extend Express Request to include account data from middleware
interface AuthRequest extends Request {
  account?: {
    accountId: string;
    email: string;
  };
}

export const createVerificationController = (otpService: OtpServiceType) => {
  return {
    sendEmailVerification: async (req: AuthRequest, res: Response) => {
      const accountId = req.account?.accountId;
      const email = req.account?.email || "";
      if (!accountId || !email) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
      const { otp } = await otpService.generateOtp(accountId, email, "email_verification");
      const result = await otpService.sendOtpEmail(email, otp, "email_verification");
      res.status(HTTP_STATUS.OK).json(result);
    },
    verifyOtp: async (req: AuthRequest, res: Response) => {
      const accountId = req.account?.accountId;
      const { type, otp } = req.body;
      if (!accountId || !type) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Account ID and type are required" });
      }
      if (type !== "email_verification" && type !== "password_reset") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid type" });
      }
      if (!otp) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "OTP is required" });
      }
      const message = type === "email_verification" ? "Email verified successfully" : "Password reset successfully";
      await otpService.verifyOtp(accountId, otp, type);
      res.status(HTTP_STATUS.OK).json({ message });
    },

  };
};