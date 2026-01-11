import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "./asyncHandler.middleware";

describe("asyncHandler", () => {
    it("should call the wrapped function", async () => {
        const fn = vi.fn().mockResolvedValue("ok");

        const req = {} as Request;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        const handler = asyncHandler(fn);

        handler(req, res, next);

        expect(fn).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    it("should pass error to next when promise rejects", async () => {
        const error = new Error("boom");
        const fn = vi.fn().mockRejectedValue(error);

        const req = {} as Request;
        const res = {} as Response;
        const next = vi.fn() as NextFunction;

        const handler = asyncHandler(fn);

        // allow promise microtask to resolve
        await Promise.resolve(handler(req, res, next));

        expect(next).toHaveBeenCalledWith(error);
    });
});
