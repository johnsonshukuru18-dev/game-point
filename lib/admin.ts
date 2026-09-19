import { getCurrentUser } from "@/lib/auth";

/** Returns the current user if they're an admin, otherwise null. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
