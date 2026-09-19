import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({ content: z.string().min(1).max(500) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    include: { user: { select: { id: true, username: true, profile: true } } },
    orderBy: { createdAt: "asc" },
  });
  return jsonOk(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Comment content is required", 422);

  const comment = await prisma.comment.create({
    data: { postId: params.id, userId: session.userId, content: parsed.data.content },
    include: { user: { select: { id: true, username: true, profile: true } } },
  });

  if (post.userId !== session.userId) {
    await prisma.notification.create({
      data: {
        recipientId: post.userId,
        type: "COMMENT",
        message: "Someone commented on your post.",
        link: `/posts/${post.id}`,
      },
    });
  }

  return jsonOk(comment, 201);
}
