import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../../../security/jwt";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    console.log({decoded});
    
    (req as any).account = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};