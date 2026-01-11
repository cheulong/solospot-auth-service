import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "./error.middleware";

describe("errorHandler middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle ZodError and return 400 with validation details", () => {
    const schema = z.object({
      email: z.string().email(),
    });

    let zodError: ZodError;
    try {
      schema.parse({ email: "invalid-email" });
    } catch (err) {
      zodError = err as ZodError;
    }

    errorHandler(zodError!, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Validation error",
      errors: zodError!.flatten().fieldErrors,
    });
  });

  it("should handle custom error with status", () => {
    const error: any = new Error("Not authorized");
    error.status = 401;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Not authorized",
    });
  });

  it("should default to status 500 when no status is provided", () => {
    const error = new Error("Something broke");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Something broke",
    });
  });

  it("should include stack trace in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const error = new Error("Dev error");

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Dev error",
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should not include stack trace outside development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new Error("Prod error");

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      message: "Prod error",
    });

    process.env.NODE_ENV = originalEnv;
  });
});
