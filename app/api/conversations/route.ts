import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.userId } } },
    include: {
      participants: { include: { user: { select: { id: true, username: true, profile: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(conversations);
}

const schema = z.object({ userId: z.string() });

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("userId is required", 422);
  if (parsed.data.userId === session.userId) return jsonError("Can't message yourself", 422);

  // Reuse an existing 1:1 conversation if one already exists.
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.userId } } },
        { participants: { some: { userId: parsed.data.userId } } },
      ],
    },
    include: { participants: true },
  });
  if (existing && existing.participants.length === 2) return jsonOk(existing);

  const conversation = await prisma.conversation.create({
    data: {
      participants: { create: [{ userId: session.userId }, { userId: parsed.data.userId }] },
    },
    include: { participants: { include: { user: { select: { id: true, username: true, profile: true } } } } },
  });

  return jsonOk(conversation, 201);
}
