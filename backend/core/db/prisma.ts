import { PrismaClient } from '@prisma/client';
import path from 'path';

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const isDevelopment = process.env.NODE_ENV !== 'production';

// Singleton pattern: reuse instance across hot-reloads in development
const prisma: PrismaClient = globalThis.prisma ?? new PrismaClient({
  log: isDevelopment ? ['query', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
        ?? `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT ?? 5432}/${process.env.DB_NAME}`
    }
  }
});

if (isDevelopment) {
  globalThis.prisma = prisma;
}

export default prisma;
