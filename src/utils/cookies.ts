import type { Response } from "express";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "../constants/auth.constants";

// Helper to attach the refresh token cookie
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, REFRESH_TOKEN_COOKIE_OPTIONS);
};