import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      userGames: { include: { game: true } },
      _count: { select: { followers: true, following: true, posts: true, battleEntries: true } },
    },
  });
  if (!user) return jsonError("User not found", 404);

  const session = getSession();
  let isFollowedByMe = false;
  if (session && session.userId !== params.id) {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.userId, followingId: params.id } },
    });
    isFollowedByMe = !!f;
  }

  const { passwordHash, ...safe } = user;
  return jsonOk({ ...safe, isFollowedByMe });
}

const updateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  gamerTag: z.string().max(30).optional(),
  bio: z.string().max(280).optional(),
  country: z.string().max(56).optional(),
  avatarUrl: z.string().url().optional(),
  lookingFor: z.string().optional(),
  playStyle: z.enum(["CASUAL", "COMPETITIVE", "BOTH"]).optional(),
  lookingToPlay: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.userId !== params.id) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid input", 422);

  const profile = await prisma.profile.update({
    where: { userId: params.id },
    data: parsed.data,
  });
  return jsonOk(profile);
}
