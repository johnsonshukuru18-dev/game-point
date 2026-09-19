import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

// Join either by battle id (open lobby button) or by battle code (JOIN BATTLE box).
const schema = z.object({ code: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const code = parsed.success ? parsed.data.code : undefined;

  const battle = await prisma.battle.findFirst({
    where: code ? { code } : { id: params.id },
    include: { participants: true },
  });
  if (!battle) return jsonError("Battle not found — check the code and try again.", 404);
  if (battle.status !== "WAITING") return jsonError("This battle is no longer open to join.", 409);
  if (battle.participants.some((p) => p.userId === session.userId)) {
    return jsonError("You're already in this battle.", 409);
  }
  if (battle.participants.length >= 2) {
    return jsonError("This battle already has two players.", 409);
  }

  const updated = await prisma.battle.update({
    where: { id: battle.id },
    data: {
      status: "ACCEPTED",
      participants: { create: [{ userId: session.userId }] },
    },
    include: {
      game: true,
      creator: { select: { id: true, username: true, profile: true } },
      participants: { include: { user: { select: { id: true, username: true, profile: true } } } },
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: battle.creatorId,
      type: "BATTLE_ACCEPTED",
      message: "A gamer joined your battle. Time to play!",
      link: `/battles/${battle.id}`,
    },
  });

  return jsonOk(updated);
}
