import type { AuthService } from "../services/auth.type";

export const createAuthController = (authService: AuthService) => ({
  // @desc Create an account
  // @route POST /auth/register
  createAccount: async (req: any, res: any) => {
    const authData = req.body;
    const existingAccount = await authService.getAccountByEmail(authData.email);
    if (existingAccount) {
      return res.status(409).json({ message: "Account already exists" });
    }
    const newAccount = await authService.createAccount(authData);
    res.status(201).json(newAccount);
  },

  // @desc Login to an account
  // @route POST /auth/login
  login: async (req: any, res: any) => {
    const { email, password } = req.body;
    const existingAccount = await authService.getAccountByEmail(email);
    if (!existingAccount) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const account = await authService.login(email, password);
    if (!account) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { email: accountEmail, accessToken, refreshToken } = account;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "none",  // Allow cross-site requests for refresh token
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/auth/refresh",
    });
    res.status(200).json({ message: "Login successful", email: accountEmail, accessToken, refreshToken });
  },

  refreshToken: async (req: any, res: any) => {
    const refreshToken = req.cookies.refreshToken;
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

  logout: async (req: any, res: any) => {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.deleteRefreshToken(refreshToken);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth/refresh",
    });
    res.status(200).json({ message: "Logout successful" });
  },

  changePassword: async (req: any, res: any) => {
    const accountId = req.account?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Account ID is required" });
    }
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(accountId, oldPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully" });
  },

  forgotPassword: async (req: any, res: any) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ message: "Password reset link sent to your email", ...result });
  },

  resetPassword: async (req: any, res: any) => {
    const { accountId, otp, newPassword } = req.body;
    await authService.resetPassword(accountId, otp, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  },

  sendVerification: async (req: any, res: any) => {
    const accountId = req.account?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Account ID is required" });
    }
    const result = await authService.sendVerification(accountId);
    res.status(200).json(result);
  },

  verifyEmail: async (req: any, res: any) => {
    const accountId = req.account?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Account ID is required" });
    }
    const { otp } = req.body;
    await authService.verifyOtp(accountId, otp, true);
    res.status(200).json({ message: "OTP verified successfully" });
  },
  verifyOtp: async (req: any, res: any) => {
    const accountId = req.account?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Account ID is required" });
    }
    const { otp } = req.body;
    await authService.verifyOtp(accountId, otp, false);
    res.status(200).json({ message: "OTP verified successfully" });
  },
  setup2FA: async (req: any, res: any) => {
    const email = req.account?.email;
    if (!email) {
      return res.status(401).json({ message: "Email is required" });
    }
    const result = await authService.setup2FA(email);
    res.status(200).json(result);
  },
  verify2FA: async (req: any, res: any) => {
    const email = req.account?.email;
    if (!email) {
      return res.status(401).json({ message: "Email is required" });
    }
    const { otp } = req.body;
    await authService.verify2FA(email, otp);
    res.status(200).json({ message: "2FA verified successfully" });
  },
  recoveryLogin: async (req: any, res: any) => {
    const { email, recoveryCode } = req.body;
    if (!email) {
      return res.status(401).json({ message: "Email is required" });
    }
    const result = await authService.verifyAndUseRecoveryCode(email, recoveryCode);
    const { refreshToken } = result;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "none",  // Allow cross-site requests for refresh token
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/auth/refresh",
    });
    res.status(200).json(result);
  },
  loginPasswordless: async (req: any, res: any) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await authService.loginPasswordless(email);
    res.status(200).json(result);
  },
  loginCallback: async (req: any, res: any) => {
    const { email, token } = req.query;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }
    // Handle passwordless login callback - verify the token and issue JWT
    const result = await authService.loginCallback(email as string, token as string);
    const { refreshToken } = result;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: "none",  // Allow cross-site requests for refresh token
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/auth/refresh",
    });
    res.redirect(`http://localhost:5000/dashboard`);
  },
});
