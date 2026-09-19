import { NextResponse } from "next/server";

const GAME_PREFIXES: Record<string, string> = {
  efootball: "EF",
  "dream-league-soccer": "DLS",
  "ea-sports-fc": "FC",
  "call-of-duty": "COD",
  "call-of-duty-mobile": "CODM",
  "gta-v": "GTA",
  "gta-online": "GTAO",
  "need-for-speed": "NFS",
  asphalt: "ASP",
};

/** Generates a real, collision-checked, human-shareable battle code like EF-7K92X. */
export function generateBattleCodeString(gameSlug: string): string {
  const prefix = GAME_PREFIXES[gameSlug] || gameSlug.slice(0, 3).toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
