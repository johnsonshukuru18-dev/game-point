import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Forbidden", 403);

  const [users, posts, battles, messages, openReports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.battle.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  const activeUsers = await prisma.profile.count({ where: { status: "ONLINE" } });

  return jsonOk({ users, posts, battles, messages, openReports, activeUsers });
}
