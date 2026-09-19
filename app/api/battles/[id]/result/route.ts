import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  winnerId: z.string(),
  scoreSummary: z.string().max(100).optional(),
  proofImageUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const battle = await prisma.battle.findUnique({
    where: { id: params.id },
    include: { participants: true },
  });
  if (!battle) return jsonError("Battle not found", 404);

  const isParticipant = battle.participants.some((p) => p.userId === session.userId);
  if (!isParticipant) return jsonError("Only battle participants can report a result.", 403);
  if (battle.status !== "ACCEPTED" && battle.status !== "IN_PROGRESS") {
    return jsonError("This battle isn't in a reportable state.", 409);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("winnerId is required", 422);

  const winnerIsParticipant = battle.participants.some((p) => p.userId === parsed.data.winnerId);
  if (!winnerIsParticipant) return jsonError("winnerId must be one of the two battle participants.", 422);

  await prisma.$transaction([
    prisma.battle.update({ where: { id: battle.id }, data: { status: "COMPLETED" } }),
    prisma.battleResult.create({
      data: {
        battleId: battle.id,
        winnerId: parsed.data.winnerId,
        scoreSummary: parsed.data.scoreSummary,
        proofImageUrl: parsed.data.proofImageUrl,
      },
    }),
    ...battle.participants.map((p) =>
      prisma.battleParticipant.update({
        where: { id: p.id },
        data: { isWinner: p.userId === parsed.data.winnerId },
      })
    ),
  ]);

  // Update win/loss records on each participant's profile.
  for (const p of battle.participants) {
    const won = p.userId === parsed.data.winnerId;
    await prisma.profile.updateMany({
      where: { userId: p.userId },
      data: won ? { wins: { increment: 1 } } : { losses: { increment: 1 } },
    });
    await prisma.notification.create({
      data: {
        recipientId: p.userId,
        type: "BATTLE_RESULT",
        message: won ? "You won your battle! 🏆" : "Battle result reported — better luck next time.",
        link: `/battles/${battle.id}`,
      },
    });
  }

  const finalBattle = await prisma.battle.findUnique({
    where: { id: battle.id },
    include: { game: true, participants: { include: { user: true } }, result: true },
  });

  return jsonOk(finalBattle);
}
