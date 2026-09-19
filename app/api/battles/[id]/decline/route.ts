import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const battle = await prisma.battle.findUnique({ where: { id: params.id } });
  if (!battle) return jsonError("Battle not found", 404);
  if (battle.status !== "WAITING") return jsonError("This battle can no longer be declined.", 409);

  const updated = await prisma.battle.update({ where: { id: params.id }, data: { status: "DECLINED" } });

  await prisma.notification.create({
    data: {
      recipientId: battle.creatorId,
      type: "BATTLE_REQUEST",
      message: "Your battle challenge was declined.",
      link: `/battles/${battle.id}`,
    },
  });

  return jsonOk(updated);
}
