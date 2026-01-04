import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret-key";
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
const JWT_REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d";

export const generateToken = (payload: any) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as jwt.JwtPayload;
};

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
}

export const decodeToken = (token: string) => {
  return jwt.decode(token) as jwt.JwtPayload | null;
};

export type JwtPayload = {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
  refreshTokenId?: string;
};

