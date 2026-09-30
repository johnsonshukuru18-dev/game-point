import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/utils";

// Activity Timeline (Premium Feature Expansion) — a read-only merged feed
// built from existing tables (posts, battle wins, trophies). There is no
// separate "activity log" table; this keeps the feature additive and
// avoids a new write-path that could drift out of sync with real data.
// Rank-up history and tournament joins aren't included because there's no
// existing table tracking those events over time.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [posts, battleWins, trophies] = await Promise.all([
    prisma.post.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, caption: true, createdAt: true, game: { select: { name: true } } },
    }),
    prisma.battleResult.findMany({
      where: { winnerId: params.id },
      orderBy: { reportedAt: "desc" },
      take: 10,
      include: { battle: { include: { game: true } } },
    }),
    prisma.trophy.findMany({
      where: { userId: params.id },
      orderBy: { earnedAt: "desc" },
      take: 10,
    }),
  ]);

  const items = [
    ...posts.map((p) => ({
      type: "POST" as const,
      id: p.id,
      message: `Posted${p.game ? ` about ${p.game.name}` : ""}: "${p.caption.slice(0, 60)}${p.caption.length > 60 ? "…" : ""}"`,
      createdAt: p.createdAt,
    })),
    ...battleWins.map((r) => ({
      type: "BATTLE_WIN" as const,
      id: r.id,
      message: `Won a ${r.battle.game.name} battle${r.scoreSummary ? ` (${r.scoreSummary})` : ""} 🏆`,
      createdAt: r.reportedAt,
    })),
    ...trophies.map((t) => ({
      type: "TROPHY" as const,
      id: t.id,
      message: `Earned trophy: ${t.title}`,
      createdAt: t.earnedAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return jsonOk(items.slice(0, 15));
}