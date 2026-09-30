import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/utils";
import { xpProgressPercent, RANK_TIER_ICON, RankTier } from "@/lib/gamification";

// Computed profile statistics for the redesigned profile page
// (Premium Feature Expansion). Nothing here writes data — it's a read-only
// aggregation over existing tables plus the new gamification fields.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      select: {
        createdAt: true,
        _count: { select: { followers: true, following: true } },
      },
    }),
    prisma.profile.findUnique({ where: { userId: params.id } }),
  ]);

  if (!user || !profile) return jsonError("User not found", 404);

  const battlesPlayed = await prisma.battleParticipant.count({
    where: { userId: params.id, battle: { status: "COMPLETED" } },
  });

  const totalDecided = profile.wins + profile.losses;
  const winRate = totalDecided > 0 ? Math.round((profile.wins / totalDecided) * 100) : 0;

  // Global leaderboard position: 1 + how many players have strictly more wins.
  const globalRank = (await prisma.profile.count({ where: { wins: { gt: profile.wins } } })) + 1;

  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { number: "desc" },
  });

  const seasonStat = activeSeason
    ? await prisma.seasonStat.findUnique({
        where: { seasonId_userId: { seasonId: activeSeason.id, userId: params.id } },
      })
    : null;

  return jsonOk({
    joinDate: user.createdAt,
    followers: user._count.followers,
    following: user._count.following,
    wins: profile.wins,
    losses: profile.losses,
    battlesPlayed,
    winRate,
    mvpAwards: profile.mvpAwards,
    longestWinStreak: profile.longestWinStreak,
    currentWinStreak: profile.currentWinStreak,
    level: profile.level,
    xp: profile.xp,
    xpProgressPercent: xpProgressPercent(profile.xp),
    rankTier: profile.rankTier,
    rankTierIcon: RANK_TIER_ICON[profile.rankTier as RankTier] || "🥉",
    globalRank,
    isPro: profile.isPro,
    isVerified: profile.isVerified,
    currentSeason: activeSeason
      ? {
          number: activeSeason.number,
          name: activeSeason.name,
          endsAt: activeSeason.endsAt,
          xp: seasonStat?.xp ?? 0,
          wins: seasonStat?.wins ?? 0,
          losses: seasonStat?.losses ?? 0,
          rankTier: seasonStat?.rankTier ?? "BRONZE",
        }
      : null,
  });
}