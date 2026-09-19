import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateBattleCodeString, jsonError, jsonOk } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameSlug = searchParams.get("game");
  const status = searchParams.get("status"); // e.g. WAITING to show open lobbies
  const mine = searchParams.get("mine") === "true";
  const session = getSession();

  const battles = await prisma.battle.findMany({
    where: {
      AND: [
        gameSlug ? { game: { is: { slug: gameSlug } } } : {},
        status ? { status: status as any } : {},
        mine && session
          ? { OR: [{ creatorId: session.userId }, { participants: { some: { userId: session.userId } } }] }
          : {},
      ],
    },
    include: {
      game: true,
      creator: { select: { id: true, username: true, profile: true } },
      participants: { include: { user: { select: { id: true, username: true, profile: true } } } },
      result: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk(battles);
}

const createSchema = z.object({
  gameId: z.string(),
  mode: z.string().min(1).max(20).default("1v1"),
  platform: z.string().min(1).max(30),
  skillLevel: z.enum(["CASUAL", "INTERMEDIATE", "COMPETITIVE"]).default("CASUAL"),
  targetUserId: z.string().optional(), // direct challenge instead of open lobby
});

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid input", 422);

  const game = await prisma.game.findUnique({ where: { id: parsed.data.gameId } });
  if (!game) return jsonError("Game not found", 404);

  // Ensure a unique battle code — retry on the rare collision.
  let code = generateBattleCodeString(game.slug);
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.battle.findUnique({ where: { code } });
    if (!clash) break;
    code = generateBattleCodeString(game.slug);
  }

  const battle = await prisma.battle.create({
    data: {
      code,
      gameId: game.id,
      creatorId: session.userId,
      mode: parsed.data.mode,
      platform: parsed.data.platform,
      skillLevel: parsed.data.skillLevel,
      participants: { create: [{ userId: session.userId }] },
    },
    include: {
      game: true,
      creator: { select: { id: true, username: true, profile: true } },
      participants: { include: { user: { select: { id: true, username: true, profile: true } } } },
    },
  });

  if (parsed.data.targetUserId) {
    await prisma.notification.create({
      data: {
        recipientId: parsed.data.targetUserId,
        type: "BATTLE_REQUEST",
        message: `You've been challenged to a ${game.name} battle.`,
        link: `/battles/${battle.id}`,
      },
    });
  }

  return jsonOk(battle, 201);
}
