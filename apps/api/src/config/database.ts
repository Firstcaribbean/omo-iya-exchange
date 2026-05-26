import { prisma } from "@repo/database";

export const db = prisma;
export default db;
export * from "@repo/database";
