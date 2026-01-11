import type { Response, Request } from "express";
import { TwoFactorServiceType } from "../services/twoFactor.service";
import { setAuthCookie } from "../../../utils/cookies";
import { HTTP_STATUS } from "../../../constants/httpStatus";

// Extend Express Request to include account data from middleware
interface AuthRequest extends Request {
    account?: {
        accountId: string;
        email: string;
    };
}

export const createTwoFactorController = (twoFactorService: TwoFactorServiceType) => {
    return {
        setup2FA: async (req: AuthRequest, res: Response) => {
            const email = req.account?.email;
            if (!email) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });

            const result = await twoFactorService.setup2FA(email);
            res.status(HTTP_STATUS.OK).json(result);
        },
        verify2FA: async (req: AuthRequest, res: Response) => {
            const email = req.account?.email;
            if (!email) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Email is required" });
            }
            const { otp } = req.body;
            await twoFactorService.verify2FA(email, otp);
            res.status(HTTP_STATUS.OK).json({ message: "2FA verified successfully" });
        },
        recoveryLogin: async (req: Request, res: Response) => {
            const { email, recoveryCode } = req.body;
            const result = await twoFactorService.useRecoveryCode(email, recoveryCode);

            setAuthCookie(res, result.refreshToken);
            res.status(HTTP_STATUS.OK).json(result);
        },

    };
};