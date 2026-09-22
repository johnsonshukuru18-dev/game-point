import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/utils";

// Without this, Next.js may statically cache this route at build time,
// so newly uploaded game cover images (or any DB change) wouldn't show up
// until the next deployment.
export const dynamic = "force-dynamic";

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