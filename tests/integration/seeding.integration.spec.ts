import { describe, test, expect, beforeEach, beforeAll, spyOn } from 'bun:test';
import {
  deterministicUuid,
  log,
  logVerbose,
  checkIdempotency,
  seedDatabase,
} from '../../prisma/seed-utils';
import { SEED_TENANTS, SEED_MEALS } from '../../prisma/seed-data';
import { PrismaMealRepository } from '@/infrastructure/database/repositories/prisma-meal.repository';
import type { PrismaClient } from '@prisma/client';
import { resetDatabase, getTestPrisma } from '../setup';

const QUALITY_KEYS = [
  'isDinner',
  'isLunch',
  'isCreamy',
  'isAcidic',
  'greenVeg',
  'makesLunch',
  'isEasyToMake',
  'needsPrep',
] as const;

const prisma = getTestPrisma();

describe('Meal quality diversity in seed data (static audit, no DB)', () => {
  test('SEED_MEALS has exactly 10 meals', () => {
    expect(SEED_MEALS.length).toBe(10);
  });

  test('all 8 quality dimensions are covered with at least 2 meals per quality', () => {
    for (const key of QUALITY_KEYS) {
      const count = SEED_MEALS.filter(m => m.qualities[key] === true).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('lunch/dinner flags consistent: every isLunch meal is also isDinner', () => {
    SEED_MEALS.forEach(meal => {
      if (meal.qualities.isLunch) {
        expect(meal.qualities.isDinner).toBe(true);
      }
    });
  });

  test('at least one meal is lunch-suitable and one is dinner-only', () => {
    const hasLunchSuitable = SEED_MEALS.some(m => m.qualities.isLunch === true);
    const hasDinnerOnly = SEED_MEALS.some(
      m => m.qualities.isDinner === true && m.qualities.isLunch === false
    );
    expect(hasLunchSuitable).toBe(true);
    expect(hasDinnerOnly).toBe(true);
  });
});

describe('Seed Utilities', () => {
  describe('deterministicUuid()', () => {
    test('generates consistent UUIDs from same input', () => {
      const a = deterministicUuid('test');
      const b = deterministicUuid('test');
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('generates different UUIDs from different inputs', () => {
      const a = deterministicUuid('test1');
      const b = deterministicUuid('test2');
      expect(a).not.toBe(b);
    });

    test('produces valid UUID v5 format', () => {
      const uuid = deterministicUuid('seed-string');
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('log()', () => {
    test('outputs messages with timestamp and success prefix for info level', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      log('Sample message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\] ✓ Sample message$/);
      spy.mockRestore();
    });

    test('outputs messages with timestamp and error prefix when level is error', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      log('Error message', 'error');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\] ❌ Error message$/);
      spy.mockRestore();
    });
  });

  describe('logVerbose()', () => {
    test('outputs when SEED_VERBOSE=true', () => {
      const orig = process.env.SEED_VERBOSE;
      process.env.SEED_VERBOSE = 'true';
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      logVerbose('Verbose message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\] \[VERBOSE\] Verbose message$/);
      spy.mockRestore();
      process.env.SEED_VERBOSE = orig;
    });

    test('does not output when SEED_VERBOSE is not set', () => {
      const orig = process.env.SEED_VERBOSE;
      delete process.env.SEED_VERBOSE;
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      logVerbose('Verbose message');
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
      if (orig !== undefined) process.env.SEED_VERBOSE = orig;
    });

    test('does not output when SEED_VERBOSE is false', () => {
      const orig = process.env.SEED_VERBOSE;
      process.env.SEED_VERBOSE = 'false';
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      logVerbose('Verbose message');
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
      process.env.SEED_VERBOSE = orig;
    });
  });

  describe('checkIdempotency()', () => {
    beforeEach(async () => {
      await resetDatabase();
    });

    test('returns false when marker meal does not exist', async () => {
      const tenantId = deterministicUuid('Tenant-1');
      await prisma.tenant.create({
        data: { id: tenantId, name: 'Test Tenant' },
      });
      const result = await checkIdempotency(prisma, tenantId);
      expect(result).toBe(false);
    });

    test('returns true when marker meal exists', async () => {
      const tenantId = deterministicUuid('Tenant-idempotency-test');
      const userId = deterministicUuid('User-idempotency-test');
      await prisma.tenant.create({
        data: {
          id: tenantId,
          name: 'Test Tenant',
          users: {
            create: {
              id: userId,
              email: 'u@test.com',
              nickname: 'User',
              isTenantAdmin: false,
            },
          },
        },
      });
      await prisma.meal.create({
        data: {
          id: deterministicUuid(`${tenantId}-marker-meal`),
          mealName: 'Creamy Cashew Alfredo Pasta',
          tenantId,
          createdBy: userId,
          qualities: {
            create: {
              isDinner: true,
              isLunch: false,
              isCreamy: true,
              isAcidic: false,
              greenVeg: false,
              makesLunch: true,
              isEasyToMake: true,
              needsPrep: false,
            },
          },
        },
      });
      const result = await checkIdempotency(prisma, tenantId);
      expect(result).toBe(true);
    });
  });

  describe('Multi-tenant isolation (US2)', () => {
    beforeAll(async () => {
      await resetDatabase();
      await seedDatabase(prisma);
    });

    test('Tenant-1 meals all have tenantId equal to Tenant-1', async () => {
      const tenant1Id = SEED_TENANTS[0].id;
      const meals = await prisma.meal.findMany({
        where: { tenantId: tenant1Id },
      });
      expect(meals.length).toBeGreaterThanOrEqual(10);
      meals.forEach(meal => {
        expect(meal.tenantId).toBe(tenant1Id);
      });
    });

    test('Tenant-2 meals all have tenantId equal to Tenant-2', async () => {
      const tenant2Id = SEED_TENANTS[1].id;
      const meals = await prisma.meal.findMany({
        where: { tenantId: tenant2Id },
      });
      expect(meals.length).toBeGreaterThanOrEqual(10);
      meals.forEach(meal => {
        expect(meal.tenantId).toBe(tenant2Id);
      });
    });

    test('No overlap: meal IDs from Tenant-1 are not in Tenant-2 and vice versa', async () => {
      const tenant1Id = SEED_TENANTS[0].id;
      const tenant2Id = SEED_TENANTS[1].id;
      const meals1 = await prisma.meal.findMany({
        where: { tenantId: tenant1Id },
        select: { id: true },
      });
      const meals2 = await prisma.meal.findMany({
        where: { tenantId: tenant2Id },
        select: { id: true },
      });
      const ids1 = new Set(meals1.map(m => m.id));
      const ids2 = new Set(meals2.map(m => m.id));
      ids1.forEach(id => expect(ids2.has(id)).toBe(false));
      ids2.forEach(id => expect(ids1.has(id)).toBe(false));
    });

    test('Tenant-1 ingredients all have tenantId equal to Tenant-1', async () => {
      const tenant1Id = SEED_TENANTS[0].id;
      const ingredients = await prisma.ingredient.findMany({
        where: { tenantId: tenant1Id },
      });
      expect(ingredients.length).toBe(15);
      ingredients.forEach(ing => {
        expect(ing.tenantId).toBe(tenant1Id);
      });
    });

    test('Tenant-2 ingredients all have tenantId equal to Tenant-2', async () => {
      const tenant2Id = SEED_TENANTS[1].id;
      const ingredients = await prisma.ingredient.findMany({
        where: { tenantId: tenant2Id },
      });
      expect(ingredients.length).toBe(15);
      ingredients.forEach(ing => {
        expect(ing.tenantId).toBe(tenant2Id);
      });
    });
  });

  describe('Meal quality diversity (US3)', () => {
    beforeAll(async () => {
      await resetDatabase();
      await seedDatabase(prisma);
    });

    test('each tenant has exactly 10 seeded meals with qualities', async () => {
      for (const tenant of SEED_TENANTS) {
        const meals = await prisma.meal.findMany({
          where: { tenantId: tenant.id },
          include: { qualities: true },
        });
        expect(meals.length).toBe(10);
        meals.forEach(meal => {
          expect(meal.qualities).toBeDefined();
        });
      }
    });

    test('all 8 quality dimensions are covered with at least 2 meals per quality', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await prisma.meal.findMany({
        where: { tenantId },
        include: { qualities: true },
      });
      expect(meals.length).toBe(10);

      for (const key of QUALITY_KEYS) {
        const count = meals.filter(
          m => m.qualities && (m.qualities as unknown as Record<string, boolean>)[key] === true
        ).length;
        expect(count).toBeGreaterThanOrEqual(2);
      }
    });

    test('lunch/dinner flags are consistent (isLunch meals are dinner-suitable)', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await prisma.meal.findMany({
        where: { tenantId },
        include: { qualities: true },
      });
      meals.forEach(meal => {
        const q = meal.qualities as unknown as Record<string, boolean> | null;
        if (!q) return;
        if (q.isLunch) {
          expect(q.isDinner).toBe(true);
        }
      });
    });

    test('at least one meal is lunch-suitable and one is dinner-only', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await prisma.meal.findMany({
        where: { tenantId },
        include: { qualities: true },
      });
      const hasLunchSuitable = meals.some(
        m => (m.qualities as unknown as Record<string, boolean>)?.isLunch === true
      );
      const hasDinnerOnly = meals.some(m => {
        const q = m.qualities as unknown as Record<string, boolean> | null;
        return q?.isDinner === true && q?.isLunch === false;
      });
      expect(hasLunchSuitable).toBe(true);
      expect(hasDinnerOnly).toBe(true);
    });
  });

  describe('Quality-based filtering with seeded data (US3)', () => {
    const mealRepository = new PrismaMealRepository(prisma);

    beforeAll(async () => {
      await resetDatabase();
      await seedDatabase(prisma);
    });

    test('Monday lunch with creamy preference returns only isLunch and isCreamy meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await mealRepository.findByQualities(tenantId, {
        isArchived: false,
        isLunch: true,
        isCreamy: true,
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
      meals.forEach(meal => {
        expect(meal.qualities.isLunch).toBe(true);
        expect(meal.qualities.isCreamy).toBe(true);
      });
    });

    test('Dinner with acidic preference returns only isDinner and isAcidic meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await mealRepository.findByQualities(tenantId, {
        isArchived: false,
        isDinner: true,
        isAcidic: true,
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
      meals.forEach(meal => {
        expect(meal.qualities.isDinner).toBe(true);
        expect(meal.qualities.isAcidic).toBe(true);
      });
    });

    test('Lunch with greenVeg preference returns only isLunch and greenVeg meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await mealRepository.findByQualities(tenantId, {
        isArchived: false,
        isLunch: true,
        greenVeg: true,
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
      meals.forEach(meal => {
        expect(meal.qualities.isLunch).toBe(true);
        expect(meal.qualities.greenVeg).toBe(true);
      });
    });

    test('Combined filter isLunch + isEasyToMake returns only matching meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await mealRepository.findByQualities(tenantId, {
        isArchived: false,
        isLunch: true,
        isEasyToMake: true,
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
      meals.forEach(meal => {
        expect(meal.qualities.isLunch).toBe(true);
        expect(meal.qualities.isEasyToMake).toBe(true);
      });
    });
  });

  describe('Day plan meal assignments (US4)', () => {
    beforeAll(async () => {
      await resetDatabase();
      await seedDatabase(prisma);
    });

    test('day plans with lunchMealId have meals that are isLunch', async () => {
      const dayPlansWithLunch = await prisma.dayPlan.findMany({
        where: { lunchMealId: { not: null } },
        include: { lunchMeal: { include: { qualities: true } } },
      });
      expect(dayPlansWithLunch.length).toBeGreaterThanOrEqual(1);
      dayPlansWithLunch.forEach(dp => {
        expect(dp.lunchMeal).toBeDefined();
        expect(dp.lunchMeal?.qualities?.isLunch).toBe(true);
      });
    });

    test('day plans with dinnerMealId have meals that are isDinner', async () => {
      const dayPlansWithDinner = await prisma.dayPlan.findMany({
        where: { dinnerMealId: { not: null } },
        include: { dinnerMeal: { include: { qualities: true } } },
      });
      expect(dayPlansWithDinner.length).toBeGreaterThanOrEqual(1);
      dayPlansWithDinner.forEach(dp => {
        expect(dp.dinnerMeal).toBeDefined();
        expect(dp.dinnerMeal?.qualities?.isDinner).toBe(true);
      });
    });

    test('at least one dinner assignment has makesLunch (leftover potential)', async () => {
      const dayPlansWithDinner = await prisma.dayPlan.findMany({
        where: { dinnerMealId: { not: null } },
        include: { dinnerMeal: { include: { qualities: true } } },
      });
      const withMakesLunch = dayPlansWithDinner.filter(
        dp => dp.dinnerMeal?.qualities?.makesLunch === true
      );
      expect(withMakesLunch.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('80% unique meal-ingredient combinations (SC-002)', () => {
    beforeAll(async () => {
      await resetDatabase();
      await seedDatabase(prisma);
    });

    test('at least 80% of seeded meals have unique meal-name + ingredient set combinations', async () => {
      const meals = await prisma.meal.findMany({
        include: { ingredients: { include: { ingredient: true } } },
      });
      expect(meals.length).toBe(20); // 10 per tenant × 2

      const comboKey = (meal: {
        mealName: string;
        ingredients: { ingredient: { ingredientName: string } }[];
      }) => {
        const names = meal.ingredients.map(i => i.ingredient.ingredientName).sort();
        return `${meal.mealName}|${names.join(',')}`;
      };

      const keys = meals.map(comboKey);
      const uniqueKeys = new Set(keys);
      const uniqueCount = uniqueKeys.size;
      // 10 distinct meal definitions duplicated for 2 tenants = 10 unique combos. SC-002: ≥80% of meal *types* unique = ≥8 of 10.
      expect(uniqueCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Seed determinism (FR-008)', () => {
    test('two seed runs on fresh DBs produce identical meal names and structure', async () => {
      await resetDatabase();
      await seedDatabase(prisma);

      const snapshot1 = await captureSeedSnapshot(prisma);

      await resetDatabase();
      await seedDatabase(prisma);

      const snapshot2 = await captureSeedSnapshot(prisma);

      expect(snapshot2.mealNamesSort).toEqual(snapshot1.mealNamesSort);
      expect(snapshot2.tenantIdsSort).toEqual(snapshot1.tenantIdsSort);
      expect(snapshot2.settingsWeekStartDays).toEqual(snapshot1.settingsWeekStartDays);
    });
  });
});

async function captureSeedSnapshot(prisma: PrismaClient) {
  const meals = await prisma.meal.findMany({
    select: { mealName: true, tenantId: true },
  });
  const tenants = await prisma.tenant.findMany({
    select: { id: true },
  });
  const settings = await prisma.userSettings.findMany({
    select: { weekStartDay: true },
  });

  return {
    mealNamesSort: [...meals.map(m => m.mealName)].sort(),
    tenantIdsSort: [...tenants.map(t => t.id)].sort(),
    settingsWeekStartDays: [...settings.map(s => s.weekStartDay)].sort(),
  };
}
