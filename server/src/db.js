import { PrismaClient } from "@prisma/client";

// Satu instance Prisma untuk seluruh aplikasi
export const prisma = new PrismaClient();
