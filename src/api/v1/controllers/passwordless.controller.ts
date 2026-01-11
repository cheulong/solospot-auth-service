import type { Response, Request } from "express";
import { PasswordlessServiceType } from "../services/passwordless.service";
import { setAuthCookie } from "../../../utils/cookies";

export const createPasswordlessController = (passwordlessService: PasswordlessServiceType) => {

  return {
    loginPasswordless: async (req: Request, res: Response) => {
      if (!req.body.email) return res.status(400).json({ message: "Email required" });
      const result = await passwordlessService.loginPasswordless(req.body.email);
      res.status(200).json(result);
    },
    loginCallback: async (req: Request, res: Response) => {
      const { email, token } = req.query;
      if (typeof email !== "string" || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid params" });
      }
      const result = await passwordlessService.loginCallback(email as string, token as string);
      setAuthCookie(res, result.refreshToken);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/health`);
    },

  };
};