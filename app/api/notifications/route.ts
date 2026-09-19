import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { recipientId: session.userId, read: false },
  });

  return jsonOk({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  // Mark all as read. (Body may later support marking a single id.)
  await prisma.notification.updateMany({
    where: { recipientId: session.userId, read: false },
    data: { read: true },
  });
  return jsonOk({ success: true });
}
