import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const battle = await prisma.battle.findUnique({ where: { id: params.id } });
  if (!battle) return jsonError("Battle not found", 404);
  if (battle.creatorId !== session.userId) return jsonError("Only the creator can cancel this battle.", 403);
  if (battle.status === "COMPLETED") return jsonError("A completed battle can't be cancelled.", 409);

  const updated = await prisma.battle.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return jsonOk(updated);
}
