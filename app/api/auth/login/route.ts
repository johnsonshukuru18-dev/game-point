import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Email/username and password are required", 422);

  const { emailOrUsername, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });
  if (!user) return jsonError("Invalid credentials", 401);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return jsonError(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`, 429);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: lockedUntil ? 0 : attempts, lockedUntil },
    });
    if (lockedUntil) {
      return jsonError(`Too many failed attempts. Try again in ${LOCK_MINUTES} minute(s).`, 429);
    }
    return jsonError("Invalid credentials", 401);
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  const token = createSessionToken({ userId: user.id, username: user.username });
  setSessionCookie(token);

  await prisma.profile.updateMany({ where: { userId: user.id }, data: { status: "ONLINE" } });

  return jsonOk({ id: user.id, username: user.username });
}