import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __wardenPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__wardenPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__wardenPrisma__ = prisma;
}
