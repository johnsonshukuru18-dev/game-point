import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return jsonError("Post not found", 404);
  if (post.userId !== session.userId) return jsonError("You can only delete your own posts.", 403);

  // Cascading deletes (schema.prisma onDelete: Cascade) also remove this
  // post's images, comments, and likes automatically.
  await prisma.post.delete({ where: { id: params.id } });

  return jsonOk({ success: true });
}