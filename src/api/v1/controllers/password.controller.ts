import type { Response, Request } from "express";
import { HTTP_STATUS } from "../../../constants/httpStatus";
import { PasswordServiceType } from "../services/password.service";
import { OtpServiceType } from "../services/otp.service";

// Extend Express Request to include account data from middleware
interface AuthRequest extends Request {
  account?: {
    accountId: string;
    email: string;
  };
}

export const createPasswordController = (passwordService: PasswordServiceType, otpService: OtpServiceType) => {
  return {
    changePassword: async (req: AuthRequest, res: Response) => {
      const { oldPassword, newPassword } = req.body;
      const accountId = req.account?.accountId;

      if (!accountId) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });

      await passwordService.changePassword(accountId, oldPassword, newPassword);
      res.status(HTTP_STATUS.OK).json({ message: "Password changed successfully" });
    },
    forgotPassword: async (req: Request, res: Response) => {
      const result = await passwordService.forgotPassword(req.body.email);
      res.status(HTTP_STATUS.OK).json({ ...result, message: "Reset link sent", });
    },
    resetPassword: async (req: Request, res: Response) => {
      const { accountId, otp, newPassword } = req.body;
      await otpService.verifyOtp(accountId, otp, "password_reset");
      await passwordService.resetPassword(accountId, newPassword);
      await otpService.deleteOtp(accountId);
      res.status(HTTP_STATUS.OK).json({ message: "Password reset successfully" });
    },
  };
};