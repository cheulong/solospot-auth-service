import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "./auth";
import { verifyToken } from "../../../security/jwt";

// 🔹 mock verifyToken
vi.mock("../../../security/jwt", () => ({
  verifyToken: vi.fn(),
}));

describe("authenticate middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      header: vi.fn(),
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should return 401 if no Authorization header is provided", () => {
    (req.header as any).mockReturnValue(undefined);

    authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Access denied. No token provided.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next and attach account when token is valid", () => {
    const decodedToken = { id: "user-1", email: "test@test.com" };

    (req.header as any).mockReturnValue("Bearer valid-token");
    (verifyToken as any).mockReturnValue(decodedToken);

    authenticate(req as Request, res as Response, next);

    expect(verifyToken).toHaveBeenCalledWith("valid-token");
    expect((req as any).account).toEqual(decodedToken);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if token is invalid", () => {
    (req.header as any).mockReturnValue("Bearer invalid-token");
    (verifyToken as any).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
