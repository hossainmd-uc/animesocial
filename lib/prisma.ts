import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  transactionOptions: {
    timeout: 10000, // 10 seconds
    maxWait: 5000,  // 5 seconds
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 