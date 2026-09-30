import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";
import { levelFromXp, rankTierFromLevel, XP_PER_WIN, XP_PER_LOSS, MVP_STREAK_INTERVAL } from "@/lib/gamification";

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

  // Update win/loss records, XP, level, rank, and win-streak/MVP tracking
  // for each participant's profile (Premium Feature Expansion).
  for (const p of battle.participants) {
    const won = p.userId === parsed.data.winnerId;

    const profile = await prisma.profile.findUnique({ where: { userId: p.userId } });

    if (profile) {
      const newXp = profile.xp + (won ? XP_PER_WIN : XP_PER_LOSS);
      const newLevel = levelFromXp(newXp);
      const newRankTier = rankTierFromLevel(newLevel);
      const newCurrentStreak = won ? profile.currentWinStreak + 1 : 0;
      const newLongestStreak = Math.max(profile.longestWinStreak, newCurrentStreak);
      const earnsMvp = won && newCurrentStreak > 0 && newCurrentStreak % MVP_STREAK_INTERVAL === 0;

      await prisma.profile.update({
        where: { userId: p.userId },
        data: {
          wins: won ? { increment: 1 } : undefined,
          losses: !won ? { increment: 1 } : undefined,
          xp: newXp,
          level: newLevel,
          rankTier: newRankTier,
          currentWinStreak: newCurrentStreak,
          longestWinStreak: newLongestStreak,
          mvpAwards: earnsMvp ? { increment: 1 } : undefined,
        },
      });

      if (earnsMvp) {
        await prisma.trophy.create({
          data: {
            userId: p.userId,
            category: "MVP",
            rarity: "RARE",
            title: `${newCurrentStreak}-Win Streak MVP`,
            description: `Awarded for winning ${newCurrentStreak} battles in a row.`,
          },
        });
        await prisma.notification.create({
          data: {
            recipientId: p.userId,
            type: "BATTLE_RESULT",
            message: `🏅 MVP! You're on a ${newCurrentStreak}-win streak.`,
            link: `/profile/${p.userId}`,
          },
        });
      }
    }

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