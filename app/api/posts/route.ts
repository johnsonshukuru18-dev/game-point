import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameSlug = searchParams.get("game"); // specific game slug
  const categoryName = searchParams.get("category"); // FOOTBALL | SHOOTER | ...
  const myGamesOnly = searchParams.get("myGames") === "true";
  const cursor = searchParams.get("cursor") || undefined;

  const session = getSession();

  let gameIdFilter: string[] | undefined;
  if (myGamesOnly && session) {
    const ug = await prisma.userGame.findMany({ where: { userId: session.userId } });
    gameIdFilter = ug.map((g) => g.gameId);
  }

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        gameSlug ? { game: { is: { slug: gameSlug } } } : {},
        categoryName ? { game: { is: { category: { is: { name: categoryName } } } } } : {},
        gameIdFilter ? { gameId: { in: gameIdFilter } } : {},
      ],
    },
    include: {
      user: { select: { id: true, username: true, profile: true } },
      game: true,
      images: true,
      _count: { select: { likes: true, comments: true } },
      likes: session ? { where: { userId: session.userId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const shaped = posts.map((p: any) => ({
    ...p,
    likedByMe: session ? p.likes.length > 0 : false,
    likes: undefined,
  }));

  return jsonOk({ posts: shaped, nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null });
}

const createSchema = z.object({
  caption: z.string().min(1).max(500),
  gameId: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(6).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid input", 422);

  const post = await prisma.post.create({
    data: {
      userId: session.userId,
      gameId: parsed.data.gameId || null,
      caption: parsed.data.caption,
      images: { create: parsed.data.imageUrls.map((url) => ({ url })) },
    },
    include: { user: { select: { id: true, username: true, profile: true } }, game: true, images: true },
  });

  return jsonOk(post, 201);
}
