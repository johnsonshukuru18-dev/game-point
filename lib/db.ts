import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon's pooled connection goes through PgBouncer in transaction mode, which
// doesn't support Prisma's prepared statements. Prisma needs the
// `pgbouncer=true` flag on the connection string to work correctly (and
// quickly) over that pooler. The DATABASE_URL set by the Vercel/Neon
// integration is a locked secret we can't edit directly, so we add the flag
// here at runtime instead.
function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (url.includes("pgbouncer=")) return url;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: getDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;