import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId: params.id, userId: session.userId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const count = await prisma.like.count({ where: { postId: params.id } });
    return jsonOk({ liked: false, count });
  }

  await prisma.like.create({ data: { postId: params.id, userId: session.userId } });
  if (post.userId !== session.userId) {
    await prisma.notification.create({
      data: {
        recipientId: post.userId,
        type: "LIKE",
        message: "Someone liked your post.",
        link: `/posts/${post.id}`,
      },
    });
  }
  const count = await prisma.like.count({ where: { postId: params.id } });
  return jsonOk({ liked: true, count });
}
