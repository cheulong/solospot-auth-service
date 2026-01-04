import { randomInt } from 'node:crypto';

export const generateOtp = (): string => {
  return randomInt(100000, 999999).toString();
}

export const otpExpiresIn = (minutes: number = 15): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);  // 15 minutes
}
