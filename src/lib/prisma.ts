import { PrismaClient } from '@prisma/client';

// 1. Prevent multiple instances during development (Hot Module Replacement)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Keep logs clean, only show errors
  });

// 2. Save the instance to global scope so it is reused on reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;