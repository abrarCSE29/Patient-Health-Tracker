import type { Request, Response } from "express";
import { verifyAccessToken } from "./tokens.js";

export const REFRESH_COOKIE_NAME = "refresh_token";

export interface RequestUserContext {
  userId: string;
  userEmail: string;
}

const isProduction = process.env.NODE_ENV === "production";

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
  });
}

export function getRefreshTokenFromRequest(req: Request) {
  return req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
}

export function getRequestUser(req: Request): RequestUserContext | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    return {
      userId: payload.sub,
      userEmail: payload.email,
    };
  } catch {
    return null;
  }
}

export function requireRequestUser(req: Request, res: Response): RequestUserContext | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}
