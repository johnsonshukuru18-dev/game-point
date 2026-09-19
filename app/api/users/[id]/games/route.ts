import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({ gameIds: z.array(z.string()).min(1).max(20) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.userId !== params.id) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("gameIds is required", 422);

  await prisma.userGame.deleteMany({ where: { userId: params.id } });
  await prisma.userGame.createMany({
    data: parsed.data.gameIds.map((gameId) => ({ userId: params.id, gameId })),
    skipDuplicates: true,
  });

  const userGames = await prisma.userGame.findMany({
    where: { userId: params.id },
    include: { game: true },
  });
  return jsonOk(userGames);
}
