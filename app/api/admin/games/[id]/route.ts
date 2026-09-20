import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({ coverUrl: z.string().url() });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("A valid coverUrl is required", 422);

  const game = await prisma.game.update({
    where: { id: params.id },
    data: { coverUrl: parsed.data.coverUrl },
  });

  return jsonOk(game);
}