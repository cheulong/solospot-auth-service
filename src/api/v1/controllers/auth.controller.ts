import type { Response, Request } from "express";
import { AuthServiceType } from "../services/auth.service";
import { HTTP_STATUS } from "../../../constants/httpStatus";
import { setAuthCookie } from "../../../utils/cookies";

// Extend Express Request to include account data from middleware
interface AuthRequest extends Request {
  account?: {
    accountId: string;
    email: string;
  };
}

export const createAuthController = (authService: AuthServiceType) => {

  return {
    createAccount: async (req: Request, res: Response) => {
      const existingAccount = await authService.getByEmail(req.body.email);
      if (existingAccount) {
        return res.status(HTTP_STATUS.CONFLICT).json({ message: "Account already exists" });
      }
      const newAccount = await authService.createAccount(req.body);
      res.status(HTTP_STATUS.CREATED).json(newAccount);
    },
    login: async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const existingAccount = await authService.getByEmail(email);

      if (!existingAccount) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid email or password" });
      }
      const account = await authService.login(password, existingAccount);
      if (!account) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid email or password" });
      }

      setAuthCookie(res, account.refreshToken);
      res.status(HTTP_STATUS.OK).json({
        message: "Login successful",
        email: account.email,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken
      });
    },
    refreshToken: async (req: Request, res: Response) => {
      const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
      if (!refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Refresh token is required" });
      }
      try {
        const result = await authService.refreshToken(refreshToken);
        const { accessToken, refreshToken: newRefreshToken } = result;
        setAuthCookie(res, newRefreshToken);
        res.status(HTTP_STATUS.OK).json({ accessToken, refreshToken: newRefreshToken });
      } catch (error) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: (error as Error).message });
      }
    },
    logout: async (req: AuthRequest, res: Response) => {
      const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
      const deleted = await authService.logout(refreshToken);
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/auth/refresh",
      });
      res.status(HTTP_STATUS.OK).json({ message: "Logout successful", deleted });
    },
  };
};