import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validate } from "./validate.middleware";

describe("validate middleware", () => {
  it("should call next when schema validation passes", () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    const req = {
      body: { email: "test@test.com" },
    } as Request;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it("should pass ZodError to next when validation fails", () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    const req = {
      body: { email: "invalid-email" },
    } as Request;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should pass unexpected errors to next", () => {
    const schema = {
      parse: () => {
        throw new Error("unexpected");
      },
    } as any;

    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
