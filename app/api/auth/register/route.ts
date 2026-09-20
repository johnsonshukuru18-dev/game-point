import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number"),
  gameIds: z.array(z.string()).optional().default([]),
  playStyle: z.enum(["CASUAL", "COMPETITIVE", "BOTH"]).optional(),
  lookingFor: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input", 422);
  }
  const { username, email, password, gameIds, playStyle, lookingFor } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return jsonError(
      existing.email === email ? "Email already in use" : "Username already taken",
      409
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      profile: {
        create: {
          displayName: username,
          playStyle: playStyle || "BOTH",
          lookingFor: lookingFor || null,
        },
      },
      userGames: {
        create: gameIds.map((gameId) => ({ gameId })),
      },
    },
    include: { profile: true },
  });

  const token = createSessionToken({ userId: user.id, username: user.username });
  setSessionCookie(token);

  return jsonOk({ id: user.id, username: user.username, email: user.email }, 201);
}