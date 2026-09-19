import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  targetType: z.enum(["USER", "POST", "BATTLE"]),
  targetId: z.string(),
  targetUserId: z.string().optional(),
  reason: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid report", 422);

  const report = await prisma.report.create({
    data: {
      reporterId: session.userId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      targetUserId: parsed.data.targetUserId,
      reason: parsed.data.reason,
    },
  });
  return jsonOk(report, 201);
}
