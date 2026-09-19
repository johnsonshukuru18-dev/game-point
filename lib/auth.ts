import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const COOKIE_NAME = "gp_session";
const SESSION_DAYS = 30;

// next/headers is required lazily (not imported at module scope) inside the
// functions below so that hashPassword/verifyPassword/createSessionToken/
// verifySessionToken can be unit-tested with Vitest outside of a Next.js
// request context (see tests/auth.test.ts). Next.js's server runtime
// supports require() in route handlers / server components.

export interface SessionPayload {
  userId: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** Sets the httpOnly session cookie. Call from a Route Handler or Server Action. */
export function setSessionCookie(token: string) {
  const { cookies } = require("next/headers");
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  const { cookies } = require("next/headers");
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/** Reads and verifies the current session from the request cookies. */
export function getSession(): SessionPayload | null {
  const { cookies } = require("next/headers");
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Fetches the full current user (throws-free — returns null if not logged in). */
export async function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });
  return user;
}

export function requireSession(): SessionPayload {
  const session = getSession();
  if (!session) {
    const err = new Error("UNAUTHORIZED");
    err.name = "UNAUTHORIZED";
    throw err;
  }
  return session;
}
