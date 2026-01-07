import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { logger } from "./logger.middleware";

describe("logger middleware", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log request method and path and call next", () => {
    const req = {
      method: "GET",
      path: "/health",
    } as Request;

    const res = {} as Response;
    const next = vi.fn();

    logger(req, res, next);

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logMessage = consoleSpy.mock.calls[0][0] as string;

    expect(logMessage).toContain("GET /health");
    expect(logMessage).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z - GET \/health$/
    );

    expect(next).toHaveBeenCalled();
  });
});
