import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { setCache } from "./cache.middleware";

describe("setCache middleware", () => {
  it("should set public cache for GET requests", () => {
    const req = {
      method: "GET",
    } as Request;

    const res = {
      set: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    setCache(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=300"
    );
    expect(next).toHaveBeenCalled();
  });

  it("should disable cache for non-GET requests", () => {
    const req = {
      method: "POST",
    } as Request;

    const res = {
      set: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    setCache(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store"
    );
    expect(next).toHaveBeenCalled();
  });
});
