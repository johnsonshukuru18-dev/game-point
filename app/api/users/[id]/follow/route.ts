import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);
  if (session.userId === params.id) return jsonError("You can't follow yourself", 422);

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.userId, followingId: params.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return jsonOk({ following: false });
  }

  await prisma.follow.create({ data: { followerId: session.userId, followingId: params.id } });
  await prisma.notification.create({
    data: { recipientId: params.id, type: "FOLLOW", message: "You have a new follower.", link: `/profile/${session.userId}` },
  });
  return jsonOk({ following: true });
}
