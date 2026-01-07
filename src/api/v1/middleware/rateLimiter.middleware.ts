import { rateLimit } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  legacyHeaders: false,
  message: "Too many requests, please try again after 15 minutes"
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  legacyHeaders: false,
  message: "Too many attempts, please try again later"
});