import { PrismaClient as GeneratedPrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PrismaClient = GeneratedPrismaClient;

let prismaInstance: GeneratedPrismaClient | null = null;

export function getPrismaClient(): GeneratedPrismaClient {
  if (!prismaInstance) {
    // Use absolute path to ensure we connect to the same database as migrations
    const dbPath = 'C:/Users/ASUS/Desktop/ClarityFlow/apps/api/dev.db';

    const adapter = new PrismaBetterSqlite3({
      url: `file:${dbPath}`,
    });

    prismaInstance = new GeneratedPrismaClient({
      adapter,
    });
  }
  return prismaInstance;
}
