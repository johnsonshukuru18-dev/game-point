import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const gameSlug = searchParams.get("game");
  const country = searchParams.get("country");
  const onlineOnly = searchParams.get("onlineOnly") === "true";
  const lookingToPlay = searchParams.get("lookingToPlay") === "true";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { username: { contains: q } },
                { profile: { is: { gamerTag: { contains: q } } } },
              ],
            }
          : {},
        gameSlug ? { userGames: { some: { game: { slug: gameSlug } } } } : {},
        country ? { profile: { is: { country } } } : {},
        onlineOnly ? { profile: { is: { status: "ONLINE" } } } : {},
        lookingToPlay ? { profile: { is: { lookingToPlay: true } } } : {},
      ],
    },
    include: {
      profile: true,
      userGames: { include: { game: true } },
    },
    take: 40,
    orderBy: { createdAt: "desc" },
  });

  const safe = users.map(({ passwordHash, ...u }) => u);
  return jsonOk(safe);
}
