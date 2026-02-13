import { afterAll, beforeAll } from 'bun:test';

import { disconnectPrisma, getPrismaClient } from '@/infrastructure/database/prisma/client';

const RESET_TABLES = [
  'meal_ingredients',
  'meal_qualities',
  'day_plans',
  'planned_weeks',
  'ingredients',
  'meals',
  'user_settings',
  'users',
  'tenants',
];

beforeAll(() => {
  getPrismaClient();
});

afterAll(async () => {
  await disconnectPrisma();
});

export const resetDatabase = async (): Promise<void> => {
  const client = getPrismaClient();
  const tableList = RESET_TABLES.map(table => `"${table}"`).join(', ');
  await client.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
};

export const getTestPrisma = () => getPrismaClient();
