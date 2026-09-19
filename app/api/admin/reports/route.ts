import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Forbidden", 403);

  const reports = await prisma.report.findMany({
    include: {
      reporter: { select: { id: true, username: true } },
      targetUser: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk(reports);
}

const schema = z.object({ id: z.string(), status: z.enum(["OPEN", "REVIEWED", "DISMISSED"]) });

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("id and status are required", 422);

  const report = await prisma.report.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  return jsonOk(report);
}
