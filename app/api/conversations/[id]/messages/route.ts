import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

async function assertParticipant(conversationId: string, userId: string) {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!p;
}

// GET supports ?after=<ISO timestamp> so the client can poll for new messages only.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);
  if (!(await assertParticipant(params.id, session.userId))) return jsonError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    include: { sender: { select: { id: true, username: true, profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: params.id, userId: session.userId } },
    data: { lastReadAt: new Date() },
  });

  return jsonOk(messages);
}

const schema = z.object({ content: z.string().min(1).max(2000), battleCode: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);
  if (!(await assertParticipant(params.id, session.userId))) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Message content is required", 422);

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: session.userId,
      content: parsed.data.content,
      battleCode: parsed.data.battleCode,
    },
    include: { sender: { select: { id: true, username: true, profile: true } } },
  });

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId: params.id, userId: { not: session.userId } },
  });
  for (const p of otherParticipants) {
    await prisma.notification.create({
      data: {
        recipientId: p.userId,
        type: "MESSAGE",
        message: "You have a new message.",
        link: `/messages?conversation=${params.id}`,
      },
    });
  }

  return jsonOk(message, 201);
}
