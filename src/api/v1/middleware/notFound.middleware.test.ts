import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { notFound } from "./notFound.middleware";

describe("notFound middleware", () => {
  it("should create a 404 error and pass it to next", () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn(); // ✅ do NOT type as NextFunction

    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0] as any;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Route not found");
    expect(error.status).toBe(404);
  });
});
