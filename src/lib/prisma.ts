// 1. Import from YOUR custom location, not the default package
//import { PrismaClient } from '../generated/prisma';
import { PrismaClient } from '@prisma/client'; 

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}