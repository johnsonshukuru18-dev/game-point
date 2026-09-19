import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  const { passwordHash, ...safe } = user;
  return jsonOk(safe);
}
