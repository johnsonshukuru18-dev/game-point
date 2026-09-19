import { clearSessionCookie, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/utils";

export async function POST() {
  const session = getSession();
  if (session) {
    await prisma.profile.updateMany({
      where: { userId: session.userId },
      data: { status: "OFFLINE" },
    });
  }
  clearSessionCookie();
  return jsonOk({ success: true });
}
