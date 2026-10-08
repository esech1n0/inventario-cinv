import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_DEVELOP;

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_DEVELOP) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEVELOP;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: ["error"],
  });

globalForPrisma.prisma = prisma;

