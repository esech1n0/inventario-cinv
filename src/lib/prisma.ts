import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL_PROD
    : undefined) ||
  process.env.DATABASE_URL_PRODUCTION ||
  process.env.DATABASE_URL_PROD ||
  process.env.DATABASE_URL_DEVELOP ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!process.env.DATABASE_URL && databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: ["error"],
  });

globalForPrisma.prisma = prisma;

