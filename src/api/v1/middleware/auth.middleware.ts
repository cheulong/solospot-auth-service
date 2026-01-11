import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../../security/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).account = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token." });
  }
};
