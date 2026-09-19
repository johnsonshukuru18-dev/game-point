import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Forbidden", 403);

  const users = await prisma.user.findMany({
    include: { profile: true, _count: { select: { posts: true, reportsAgainst: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const safe = users.map(({ passwordHash, ...u }) => u);
  return jsonOk(safe);
}
