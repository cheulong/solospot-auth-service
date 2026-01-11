import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createPasswordlessRoute } from "./passwordless.route";

// 🔹 Mock middlewares
vi.mock("../middleware/asyncHandler.middleware", () => ({
  asyncHandler: (fn: any) => fn,
}));

vi.mock("../middleware/validate.middleware", () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

describe("createPasswordlessRoute", () => {
  let app: express.Express;
  let passwordlessService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    passwordlessService = {
      loginPasswordless: vi.fn().mockResolvedValue({ success: true }),
      loginCallback: vi.fn().mockResolvedValue({
        refreshToken: "refresh-token",
        accessToken: "access-token",
      }),
    };

    app.use("/auth/v1", createPasswordlessRoute(passwordlessService));
  });

  describe("POST /login/passwordless", () => {
    it("returns 200 on successful passwordless login", async () => {
      const res = await request(app)
        .post("/auth/v1/login/passwordless")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(passwordlessService.loginPasswordless).toHaveBeenCalledWith(
        "test@example.com"
      );
    });
  });

  describe("GET /login/callback", () => {
    it("returns 302 redirect on successful callback", async () => {
      const res = await request(app).get(
        "/auth/v1/login/callback?email=test@example.com&token=token123"
      );

      // controller redirects
      expect(res.status).toBe(302);
      expect(passwordlessService.loginCallback).toHaveBeenCalledWith(
        "test@example.com",
        "token123"
      );
    });
  });
});
