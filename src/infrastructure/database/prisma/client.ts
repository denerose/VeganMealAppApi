import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { getDatabaseConfig } from '@/infrastructure/config/database.config';

let prisma: PrismaClient | null = null;
let pool: Pool | null = null;

const createPrismaClient = (): PrismaClient => {
  const { url } = getDatabaseConfig();
  pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = createPrismaClient();
  }

  return prisma;
};

export const prisma = getPrismaClient();

export const disconnectPrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
};
