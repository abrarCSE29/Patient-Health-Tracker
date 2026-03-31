import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";

const ACCESS_TTL = (process.env.ACCESS_TOKEN_TTL || "15m") as SignOptions["expiresIn"];
const REFRESH_TTL = (process.env.REFRESH_TOKEN_TTL || "7d") as SignOptions["expiresIn"];

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(user: { id: string; email: string }) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefreshToken(user: { id: string; email: string }) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}
