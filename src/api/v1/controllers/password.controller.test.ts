import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { createPasswordController } from "./password.controller";
import { HTTP_STATUS } from "../../../constants/httpStatus";

describe("createPasswordController", () => {
    let passwordService: any;
    let otpService: any;
    let res: Response;

    beforeEach(() => {
        passwordService = {
            changePassword: vi.fn(),
            forgotPassword: vi.fn(),
            resetPassword: vi.fn(),
        };

        otpService = {
            verifyOtp: vi.fn(),
            deleteOtp: vi.fn(),
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response;
    });

    describe("changePassword", () => {
        it("should change password when authorized", async () => {
            const req: any = {
                body: {
                    oldPassword: "old123",
                    newPassword: "new123",
                },
                account: {
                    accountId: "acc-1",
                    email: "test@example.com",
                },
            };

            const controller = createPasswordController(passwordService, otpService);

            await controller.changePassword(req, res);

            expect(passwordService.changePassword).toHaveBeenCalledWith(
                "acc-1",
                "old123",
                "new123"
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password changed successfully",
            });
        });

        it("should return 401 when accountId is missing", async () => {
            const req: any = {
                body: {
                    oldPassword: "old123",
                    newPassword: "new123",
                },
            };

            const controller = createPasswordController(passwordService, otpService);

            await controller.changePassword(req, res);

            expect(passwordService.changePassword).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
            expect(res.json).toHaveBeenCalledWith({
                message: "Unauthorized",
            });
        });
    });

    describe("forgotPassword", () => {
        it("should send reset link", async () => {
            const req = {
                body: {
                    email: "test@example.com",
                },
            } as Request;

            passwordService.forgotPassword.mockResolvedValue({
                token: "reset-token",
            });

            const controller = createPasswordController(passwordService, otpService);

            await controller.forgotPassword(req, res);

            expect(passwordService.forgotPassword).toHaveBeenCalledWith(
                "test@example.com"
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({
                token: "reset-token",
                message: "Reset link sent",
            });
        });
    });

    describe("resetPassword", () => {
        it("should verify OTP and reset password", async () => {
            const req = {
                body: {
                    accountId: "acc-1",
                    otp: "123456",
                    newPassword: "new123",
                },
            } as Request;

            const controller = createPasswordController(passwordService, otpService);

            await controller.resetPassword(req, res);

            expect(otpService.verifyOtp).toHaveBeenCalledWith(
                "acc-1",
                "123456",
                "password_reset"
            );
            expect(passwordService.resetPassword).toHaveBeenCalledWith(
                "acc-1",
                "new123"
            );
            expect(otpService.deleteOtp).toHaveBeenCalledWith("acc-1");
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password reset successfully",
            });
        });
    });
});