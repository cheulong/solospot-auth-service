import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { authLimiter, otpLimiter } from "./rateLimiter.middleware";

describe("Rate Limiters", () => {
  describe("authLimiter", () => {
    it("allows requests under the limit", async () => {
      const app = express();
      app.use(authLimiter);
      app.get("/", (_, res) => res.status(200).send("ok"));

      const res = await request(app).get("/");

      expect(res.status).toBe(200);
      expect(res.text).toBe("ok");
    });

    it("blocks requests over the limit", async () => {
      const app = express();
      app.use(authLimiter);
      app.get("/", (_, res) => res.status(200).send("ok"));

      // hit the limit
      for (let i = 0; i < 100; i++) {
        await request(app).get("/");
      }

      const blocked = await request(app).get("/");

      expect(blocked.status).toBe(429);
      expect(blocked.text).toContain(
        "Too many requests, please try again after 15 minutes"
      );
    });
  });

  describe("otpLimiter", () => {
    it("blocks after exceeding OTP attempt limit", async () => {
      const app = express();
      app.use(otpLimiter);
      app.get("/", (_, res) => res.status(200).send("ok"));

      // hit OTP limit
      for (let i = 0; i < 10; i++) {
        await request(app).get("/");
      }

      const blocked = await request(app).get("/");

      expect(blocked.status).toBe(429);
      expect(blocked.text).toContain(
        "Too many attempts, please try again later"
      );
    });
  });
});
