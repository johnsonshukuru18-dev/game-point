import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

// Accepting a direct challenge notification is functionally the same as joining.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const battle = await prisma.battle.findUnique({ where: { id: params.id }, include: { participants: true } });
  if (!battle) return jsonError("Battle not found", 404);
  if (battle.status !== "WAITING") return jsonError("This battle can no longer be accepted.", 409);
  if (battle.participants.some((p) => p.userId === session.userId)) {
    return jsonError("You're already in this battle.", 409);
  }

  const updated = await prisma.battle.update({
    where: { id: params.id },
    data: { status: "ACCEPTED", participants: { create: [{ userId: session.userId }] } },
    include: { game: true, participants: { include: { user: true } } },
  });

  await prisma.notification.create({
    data: {
      recipientId: battle.creatorId,
      type: "BATTLE_ACCEPTED",
      message: "Your battle challenge was accepted.",
      link: `/battles/${battle.id}`,
    },
  });

  return jsonOk(updated);
}
