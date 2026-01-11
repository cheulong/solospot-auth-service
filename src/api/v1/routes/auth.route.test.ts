import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { createAuthRoute } from "./auth.route";
import { HTTP_STATUS } from "../../../constants/httpStatus";

/* ------------------------------------------------------------------ */
/*                            Middleware mocks                         */
/* ------------------------------------------------------------------ */

vi.mock("../middleware/asyncHandler.middleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

vi.mock("../middleware/validate.middleware", () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../middleware/auth.middleware", () => ({
  authenticate: (_req: any, _res: any, next: any) => next(),
}));

/* ------------------------------------------------------------------ */

describe("Auth routes", () => {
  let app: express.Express;
  let authService: any;

  beforeEach(() => {
    authService = {
      createAccount: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      getByEmail: vi.fn(),
    };

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/auth/v1", createAuthRoute(authService));
  });

  describe("POST /auth/v1/register", () => {
    it("returns 201 when account is created", async () => {
      authService.getByEmail.mockResolvedValue(null);
      authService.createAccount.mockResolvedValue({
        id: "1",
        email: "test@test.com",
      });

      const res = await request(app)
        .post("/auth/v1/register")
        .send({ email: "test@test.com", password: "123456" });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.email).toBe("test@test.com");
    });

    it("returns 409 when account already exists", async () => {
      authService.getByEmail.mockResolvedValue({ id: "1" });

      const res = await request(app)
        .post("/auth/v1/register")
        .send({ email: "test@test.com", password: "123456" });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.message).toBe("Account already exists");
    });
  });

  describe("POST /auth/v1/login", () => {
    it("returns 200 and sets refresh token cookie", async () => {
      authService.getByEmail.mockResolvedValue({
        id: "1",
        email: "test@test.com",
        passwordHash: "hash",
      });

      authService.login.mockResolvedValue({
        email: "test@test.com",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const res = await request(app)
        .post("/auth/v1/login")
        .send({ email: "test@test.com", password: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe("access-token");
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");
    });

    it("returns 401 for invalid credentials", async () => {
      authService.getByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post("/auth/v1/login")
        .send({ email: "bad@test.com", password: "wrong" });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe("POST /auth/v1/refresh", () => {
    it("returns new tokens when refresh token is valid", async () => {
      authService.refreshToken.mockResolvedValue({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });

      const res = await request(app)
        .post("/auth/v1/refresh")
        .set("Cookie", ["refreshToken=refresh-token"]);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe("new-access");
    });

    it("returns 401 when refresh token is missing", async () => {
      const res = await request(app).post("/auth/v1/refresh");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Refresh token is required");
    });
  });

  describe("POST /auth/v1/logout", () => {
    it("logs out user and clears cookie", async () => {
      authService.logout.mockResolvedValue(true);

      const res = await request(app)
        .post("/auth/v1/logout")
        .set("Cookie", ["refreshToken=refresh-token"]);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=;");
    });
  });
});
