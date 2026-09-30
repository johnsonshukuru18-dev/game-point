// Shared level/XP/rank logic for the Premium Feature Expansion.
// Kept as pure, well-documented functions so the formulas can be tuned
// later without touching the API routes that call them.

/** XP required to reach a given level, cumulative from level 1. */
export function xpForLevel(level: number): number {
  return (level - 1) * 100;
}

/** Computes the level a total XP amount corresponds to. */
export function levelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/** Progress (0-100) toward the next level, for a progress bar. */
export function xpProgressPercent(xp: number): number {
  return xp % 100;
}

export type RankTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER";

const RANK_THRESHOLDS: { tier: RankTier; minLevel: number }[] = [
  { tier: "MASTER", minLevel: 25 },
  { tier: "DIAMOND", minLevel: 20 },
  { tier: "PLATINUM", minLevel: 15 },
  { tier: "GOLD", minLevel: 10 },
  { tier: "SILVER", minLevel: 5 },
  { tier: "BRONZE", minLevel: 1 },
];

/** Determines rank tier from level. */
export function rankTierFromLevel(level: number): RankTier {
  for (const { tier, minLevel } of RANK_THRESHOLDS) {
    if (level >= minLevel) return tier;
  }
  return "BRONZE";
}

export const RANK_TIER_ORDER: RankTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER"];

export const RANK_TIER_ICON: Record<RankTier, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💠",
  DIAMOND: "💎",
  MASTER: "👑",
};

// XP awarded per battle outcome — tunable constants.
export const XP_PER_WIN = 50;
export const XP_PER_LOSS = 15;

// An MVP award is granted every time a player's win streak hits a multiple
// of this number (3, 6, 9, ...). Simple, transparent rule.
export const MVP_STREAK_INTERVAL = 3;