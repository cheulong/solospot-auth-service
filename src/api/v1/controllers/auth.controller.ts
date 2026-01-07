import type { Response, Request } from "express";
import type { AuthService } from "../services/auth.type";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "../../../constants/auth.constants";

// Extend Express Request to include account data from middleware
interface AuthRequest extends Request {
  account?: {
    accountId: string;
    email: string;
  };
}

export const createAuthController = (authService: AuthService) => {

  // Helper to attach the refresh token cookie
  const setAuthCookie = (res: Response, token: string) => {
    res.cookie("refreshToken", token, REFRESH_TOKEN_COOKIE_OPTIONS);
  };

  return {
    createAccount: async (req: Request, res: Response) => {
      const existingAccount = await authService.getAccountByEmail(req.body.email);
      if (existingAccount) {
        return res.status(409).json({ message: "Account already exists" });
      }
      const newAccount = await authService.createAccount(req.body);
      res.status(201).json(newAccount);
    },

    login: async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const account = await authService.login(email, password);

      if (!account) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      setAuthCookie(res, account.refreshToken);
      res.status(200).json({
        message: "Login successful",
        email: account.email,
        accessToken: account.accessToken
      });
    },

    refreshToken: async (req: Request, res: Response) => {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      try {
        const result = await authService.refreshToken(refreshToken);
        res.status(200).json(result);
      } catch (error) {
        res.status(401).json({ message: (error as Error).message });
      }
    },

    logout: async (req: Request, res: Response) => {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      if (refreshToken) {
        await authService.deleteRefreshToken(refreshToken);
      }
      res.clearCookie("refreshToken", REFRESH_TOKEN_COOKIE_OPTIONS);
      res.status(200).json({ message: "Logout successful" });
    },

    changePassword: async (req: AuthRequest, res: Response) => {
      const { oldPassword, newPassword } = req.body;
      const accountId = req.account?.accountId;

      if (!accountId) return res.status(401).json({ message: "Unauthorized" });

      await authService.changePassword(accountId, oldPassword, newPassword);
      res.status(200).json({ message: "Password changed successfully" });
    },

    forgotPassword: async (req: Request, res: Response) => {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json({ message: "Reset link sent", ...result });
    },

    resetPassword: async (req: Request, res: Response) => {
      const { accountId, otp, newPassword } = req.body;
      await authService.resetPassword(accountId, otp, newPassword);
      res.status(200).json({ message: "Password reset successfully" });
    },

    sendVerification: async (req: AuthRequest, res: Response) => {
      const accountId = req.account?.accountId;
      if (!accountId) return res.status(401).json({ message: "Unauthorized" });

      const result = await authService.sendVerification(accountId);
      res.status(200).json(result);
    },

    verifyEmail: async (req: AuthRequest, res: Response) => {
      const accountId = req.account?.accountId;
      if (!accountId) return res.status(401).json({ message: "Unauthorized" });

      await authService.verifyOtp(accountId, req.body.otp, true);
      res.status(200).json({ message: "Email verified successfully" });
    },
    verifyOtp: async (req: any, res: Response) => {
      const accountId = req.account?.accountId;
      if (!accountId) {
        return res.status(401).json({ message: "Account ID is required" });
      }
      const { otp } = req.body;
      await authService.verifyOtp(accountId, otp, false);
      res.status(200).json({ message: "OTP verified successfully" });
    },
    setup2FA: async (req: AuthRequest, res: Response) => {
      const email = req.account?.email;
      if (!email) return res.status(401).json({ message: "Unauthorized" });

      const result = await authService.setup2FA(email);
      res.status(200).json(result);
    },

    recoveryLogin: async (req: Request, res: Response) => {
      const { email, recoveryCode } = req.body;
      const result = await authService.verifyAndUseRecoveryCode(email, recoveryCode);

      setAuthCookie(res, result.refreshToken);
      res.status(200).json(result);
    },

    loginPasswordless: async (req: Request, res: Response) => {
      if (!req.body.email) return res.status(400).json({ message: "Email required" });
      const result = await authService.loginPasswordless(req.body.email);
      res.status(200).json(result);
    },
    verify2FA: async (req: any, res: Response) => {
      const email = req.account?.email;
      if (!email) {
        return res.status(401).json({ message: "Email is required" });
      }
      const { otp } = req.body;
      await authService.verify2FA(email, otp);
      res.status(200).json({ message: "2FA verified successfully" });
    },
    loginCallback: async (req: Request, res: Response) => {
      const { email, token } = req.query;
      if (!email || !token) return res.status(400).json({ message: "Missing params" });

      const result = await authService.loginCallback(email as string, token as string);
      setAuthCookie(res, result.refreshToken);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/dashboard`);
    },
  };
};