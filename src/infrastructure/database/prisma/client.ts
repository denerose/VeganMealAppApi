import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { getDatabaseConfig } from '@/infrastructure/config/database.config';

let prismaInstance: PrismaClient | null = null;
let pool: Pool | null = null;

const createPrismaClient = (): PrismaClient => {
  const { url } = getDatabaseConfig();
  pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }

  return prismaInstance;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
};
