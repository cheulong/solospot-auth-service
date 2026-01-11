import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { createPasswordlessController } from "./passwordless.controller";
import { setAuthCookie } from "../../../utils/cookies";

vi.mock("../../../utils/cookies", () => ({
  setAuthCookie: vi.fn(),
}));

describe("createPasswordlessController", () => {
  let res: Response;

  const passwordlessService = {
    loginPasswordless: vi.fn(),
    loginCallback: vi.fn(),
  };

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      redirect: vi.fn(),
    } as unknown as Response;

    vi.clearAllMocks();
  });

  describe("loginPasswordless", () => {
    it("returns 400 if email is missing", async () => {
      const req = {
        body: {},
      } as Request;

      const controller = createPasswordlessController(passwordlessService);
      await controller.loginPasswordless(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email required" });
      expect(passwordlessService.loginPasswordless).not.toHaveBeenCalled();
    });

    it("calls service and returns result when email is provided", async () => {
      const req = {
        body: { email: "test@example.com" },
      } as Request;

      const result = { success: true };
      passwordlessService.loginPasswordless.mockResolvedValue(result);

      const controller = createPasswordlessController(passwordlessService);
      await controller.loginPasswordless(req, res);

      expect(passwordlessService.loginPasswordless).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe("loginCallback", () => {
    it("returns 400 when query params are invalid", async () => {
      const req = {
        query: { email: 123, token: null },
      } as unknown as Request;

      const controller = createPasswordlessController(passwordlessService);
      await controller.loginCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid params" });
      expect(passwordlessService.loginCallback).not.toHaveBeenCalled();
    });

    it("calls service, sets auth cookie, and redirects on success", async () => {
      const req = {
        query: {
          email: "test@example.com",
          token: "token-123",
        },
      } as unknown as Request;

      const serviceResult = {
        refreshToken: "refresh-token",
      };

      passwordlessService.loginCallback.mockResolvedValue(serviceResult);

      process.env.CLIENT_URL = "http://client.test";

      const controller = createPasswordlessController(passwordlessService);
      await controller.loginCallback(req, res);

      expect(passwordlessService.loginCallback).toHaveBeenCalledWith(
        "test@example.com",
        "token-123"
      );
      expect(setAuthCookie).toHaveBeenCalledWith(res, "refresh-token");
      expect(res.redirect).toHaveBeenCalledWith(
        "http://client.test/health"
      );
    });

    it("uses default redirect URL when CLIENT_URL is not set", async () => {
      const req = {
        query: {
          email: "test@example.com",
          token: "token-123",
        },
      } as unknown as Request;

      const serviceResult = {
        refreshToken: "refresh-token",
      };

      passwordlessService.loginCallback.mockResolvedValue(serviceResult);
      delete process.env.CLIENT_URL;

      const controller = createPasswordlessController(passwordlessService);
      await controller.loginCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5000/health"
      );
    });
  });
});
