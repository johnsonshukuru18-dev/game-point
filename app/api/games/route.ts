import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/utils";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      games: {
        include: {
          _count: { select: { userGames: true, posts: true, battles: true } },
        },
      },
    },
  });
  return jsonOk(categories);
}
