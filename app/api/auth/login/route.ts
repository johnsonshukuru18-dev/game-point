import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Email/username and password are required", 422);

  const { emailOrUsername, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });
  if (!user) return jsonError("Invalid credentials", 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return jsonError("Invalid credentials", 401);

  const token = createSessionToken({ userId: user.id, username: user.username });
  setSessionCookie(token);

  await prisma.profile.updateMany({ where: { userId: user.id }, data: { status: "ONLINE" } });

  return jsonOk({ id: user.id, username: user.username });
}
