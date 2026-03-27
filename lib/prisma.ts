import { PrismaClient } from "@/app/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? `file:./dev.db`;
  // libsql exige caminho absoluto com barras normais no Windows
  const resolvedUrl = dbUrl.startsWith("file:") && !dbUrl.startsWith("file:///")
    ? `file:${path.resolve(process.cwd(), dbUrl.slice(5)).replace(/\\/g, "/")}`
    : dbUrl;

  const adapter = new PrismaLibSql({ url: resolvedUrl });
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
