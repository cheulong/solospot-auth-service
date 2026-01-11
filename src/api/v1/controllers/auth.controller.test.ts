import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthController } from "./auth.controller";
import { HTTP_STATUS } from "../../../constants/httpStatus";

// Helper to mock Express response
const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
};

describe("createAuthController", () => {
  let authService: any;
  let controller: ReturnType<typeof createAuthController>;

  beforeEach(() => {
    authService = {
      getByEmail: vi.fn(),
      createAccount: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
    };

    controller = createAuthController(authService);
  });

  describe("createAccount", () => {
    it("returns 409 if account already exists", async () => {
      const req: any = { body: { email: "test@example.com" } };
      const res = mockResponse();

      authService.getByEmail.mockResolvedValue({ id: "1" });

      await controller.createAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(res.json).toHaveBeenCalledWith({
        message: "Account already exists",
      });
    });

    it("creates account and returns 201", async () => {
      const req: any = { body: { email: "test@example.com", password: "123" } };
      const res = mockResponse();

      authService.getByEmail.mockResolvedValue(null);
      authService.createAccount.mockResolvedValue({ id: "1", email: req.body.email });

      await controller.createAccount(req, res);

      expect(authService.createAccount).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        id: "1",
        email: "test@example.com",
      });
    });
  });

  describe("login", () => {
    it("returns 401 if account does not exist", async () => {
      const req: any = { body: { email: "x@test.com", password: "123" } };
      const res = mockResponse();

      authService.getByEmail.mockResolvedValue(null);

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password",
      });
    });

    it("returns 401 if password is invalid", async () => {
      const req: any = { body: { email: "x@test.com", password: "wrong" } };
      const res = mockResponse();

      authService.getByEmail.mockResolvedValue({ id: "1", email: req.body.email });
      authService.login.mockResolvedValue(null);

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    });

    it("sets refresh cookie and returns tokens on success", async () => {
      const req: any = { body: { email: "x@test.com", password: "123" } };
      const res = mockResponse();

      const account = {
        email: req.body.email,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      authService.getByEmail.mockResolvedValue({ id: "1", email: req.body.email });
      authService.login.mockResolvedValue(account);

      await controller.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.any(Object)
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        email: account.email,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
      });
    });
  });

  describe("refreshToken", () => {
    it("returns 401 if refresh token is missing", async () => {
      const req: any = { cookies: {} };
      const res = mockResponse();

      await controller.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Refresh token is required",
      });
    });

    it("returns new tokens on success", async () => {
      const req: any = {
        cookies: { refreshToken: "refresh-token" },
      };
      const res = mockResponse();

      authService.refreshToken.mockResolvedValue({
        accessToken: "new-access",
      });

      await controller.refreshToken(req, res);

      expect(authService.refreshToken).toHaveBeenCalledWith("refresh-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "new-access",
      });
    });

    it("returns 401 on refresh failure", async () => {
      const req: any = {
        cookies: { refreshToken: "bad-token" },
      };
      const res = mockResponse();

      authService.refreshToken.mockRejectedValue(new Error("Invalid token"));

      await controller.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid token",
      });
    });
  });

  describe("logout", () => {
    it("clears cookie and logs out", async () => {
      const req: any = {
        cookies: { refreshToken: "refresh-token" },
      };
      const res = mockResponse();

      authService.logout.mockResolvedValue(true);

      await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith("refresh-token");
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logout successful",
        deleted: true,
      });
    });
  });
});
