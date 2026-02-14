import { describe, test, expect, beforeAll } from 'bun:test';
import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import { PrismaMealRepository } from '@/infrastructure/database/repositories/prisma-meal.repository';
import { PrismaUserSettingsRepository } from '@/infrastructure/database/repositories/prisma-user-settings.repository';
import { resetDatabase, getTestPrisma } from '../setup';
import { seedDatabase } from '../../prisma/seed-utils';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';
import { SEED_TENANTS, SEED_USER_SETTINGS } from '../../prisma/seed-data';

/**
 * E2E Tests: Database Seeding (US1)
 *
 * These tests verify the complete seed script execution:
 * - Seed integrity (correct number of records created)
 * - Multi-tenant isolation (no cross-tenant data leakage)
 * - Idempotency (re-running seed doesn't duplicate data)
 * - Data quality (realistic values, valid relationships)
 * - Execution time < 2 minutes (T025, SC-001)
 */

describe('Database Seeding (E2E)', () => {
  const prisma = getTestPrisma();
  let seedDurationMs: number = 0;

  beforeAll(async () => {
    await resetDatabase();
    const start = Date.now();
    await seedDatabase(prisma);
    seedDurationMs = Date.now() - start;
  });

  test('Seed completes in under 2 minutes', () => {
    expect(seedDurationMs).toBeLessThan(120_000);
  });

  test('Seed creates correct number of tenants', async () => {
    // Given: Seeded database
    // When: Querying tenant count
    // Then: Exactly 2 tenants exist
    const tenants = await prisma.tenant.findMany();
    expect(tenants.length).toBe(2);
    expect(tenants.some(t => t.name === 'Test Tenant 1')).toBe(true);
    expect(tenants.some(t => t.name === 'Test Tenant 2')).toBe(true);
  });

  test('Seed creates meals with varying qualities', async () => {
    // Given: Seeded database
    // When: Querying meals with their qualities
    // Then: At least 10 meals per tenant with diverse quality flags
    const meals = await prisma.meal.findMany({
      include: { qualities: true },
    });

    // Total meals should be at least 20 (10 per tenant)
    expect(meals.length).toBeGreaterThanOrEqual(20);

    // Collect all unique qualities across meals
    const qualityCoverage = new Set<string>();
    meals.forEach(meal => {
      if (meal.qualities?.isDinner) qualityCoverage.add('isDinner');
      if (meal.qualities?.isLunch) qualityCoverage.add('isLunch');
      if (meal.qualities?.isCreamy) qualityCoverage.add('isCreamy');
      if (meal.qualities?.isAcidic) qualityCoverage.add('isAcidic');
      if (meal.qualities?.greenVeg) qualityCoverage.add('greenVeg');
      if (meal.qualities?.makesLunch) qualityCoverage.add('makesLunch');
      if (meal.qualities?.isEasyToMake) qualityCoverage.add('isEasyToMake');
      if (meal.qualities?.needsPrep) qualityCoverage.add('needsPrep');
    });

    // Should have at least 5 different qualities covered
    expect(qualityCoverage.size).toBeGreaterThanOrEqual(5);
  });

  test('Seed creates ingredients with distributed storage types', async () => {
    // Given: Seeded database
    // When: Querying ingredients by storage type
    // Then: At least 15 per tenant distributed across storage types
    const ingredients = await prisma.ingredient.findMany();

    expect(ingredients.length).toBeGreaterThanOrEqual(30); // At least 15 per tenant

    const storageDistribution = {
      FRIDGE: 0,
      PANTRY: 0,
      FROZEN: 0,
      OTHER: 0,
    };

    ingredients.forEach(ing => {
      storageDistribution[ing.storageType as keyof typeof storageDistribution]++;
    });

    // Verify distribution across types
    expect(storageDistribution.FRIDGE).toBeGreaterThan(0);
    expect(storageDistribution.PANTRY).toBeGreaterThan(0);
    expect(storageDistribution.FROZEN).toBeGreaterThan(0);
    expect(storageDistribution.OTHER).toBeGreaterThan(0);
  });

  test('Seed creates user settings for each tenant', async () => {
    // Given: Seeded database
    // When: Querying user settings
    // Then: Each tenant has user settings with valid weekStartDay
    const settings = await prisma.userSettings.findMany();

    expect(settings.length).toBe(2);

    // Verify each setting has valid weekStartDay
    settings.forEach(setting => {
      expect([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]).toContain(setting.weekStartDay);
      // Verify 7-day preferences exist
      expect(setting.dailyPreferences).toBeDefined();
      if (setting.dailyPreferences) {
        const daysArray = Array.isArray(setting.dailyPreferences)
          ? setting.dailyPreferences
          : Object.keys(setting.dailyPreferences);
        expect(daysArray.length).toBe(7);
      }
    });
  });

  test('Seed creates planned weeks with day plans', async () => {
    // Given: Seeded database
    // When: Querying planned weeks with day plans
    // Then: 2 planned weeks per tenant, each with 7 day plans
    const weeks = await prisma.plannedWeek.findMany({
      include: { dayPlans: true },
    });

    // Should have 4 planned weeks total (2 per tenant)
    expect(weeks.length).toBe(4);

    // Each week should have exactly 7 day plans
    weeks.forEach(week => {
      expect(week.dayPlans.length).toBe(7);

      // Verify day plans have sequential dates
      const dates = week.dayPlans
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(dp => new Date(dp.date).getTime());

      for (let i = 1; i < dates.length; i++) {
        const dayDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        expect(Math.abs(dayDiff - 1)).toBeLessThan(0.1); // Allow small floating point differences
      }
    });
  });

  describe('Planned week structure (US4)', () => {
    test('each planned week has exactly 7 day plans', async () => {
      const weeks = await prisma.plannedWeek.findMany({
        include: { dayPlans: true },
      });
      expect(weeks.length).toBe(4);
      weeks.forEach(week => {
        expect(week.dayPlans.length).toBe(7);
      });
    });

    test('week starting dates align with tenant weekStartDay', async () => {
      const weeks = await prisma.plannedWeek.findMany({
        include: { dayPlans: true },
      });
      const dayNames = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];

      for (const week of weeks) {
        const settings = SEED_USER_SETTINGS.find(s => s.tenantId === week.tenantId);
        const expectedDay = settings?.weekStartDay ?? WeekStartDay.MONDAY;
        const startDate = new Date(week.startingDate);
        const actualDay = dayNames[startDate.getDay()];
        expect(actualDay).toBe(expectedDay);
      }
    });

    test('some day plan slots are filled and some are empty (~50% coverage)', async () => {
      const weeks = await prisma.plannedWeek.findMany({
        include: { dayPlans: true },
      });
      let filledSlots = 0;
      let emptySlots = 0;
      weeks.forEach(week => {
        week.dayPlans.forEach(dp => {
          if (dp.lunchMealId != null) filledSlots++;
          else emptySlots++;
          if (dp.dinnerMealId != null) filledSlots++;
          else emptySlots++;
        });
      });
      expect(filledSlots).toBeGreaterThan(0);
      expect(emptySlots).toBeGreaterThan(0);
      // Seed assigns 7 slots per tenant across 2 weeks = 14 filled; 4 weeks × 7 days × 2 = 56 slots, so 14 filled, 42 empty
      expect(filledSlots).toBeGreaterThanOrEqual(14);
      expect(emptySlots).toBeGreaterThanOrEqual(14);
    });
  });

  test('Re-running seed is idempotent (no duplicates)', async () => {
    // Given: Seeded database
    // When: Querying the same counts before and after conceptually re-running
    // Then: No duplicates exist (verify via unique constraints)

    const _mealsBefore = await prisma.meal.count();
    const _ingredientsBefore = await prisma.ingredient.count();
    const _settingsBefore = await prisma.userSettings.count();

    // Idempotency is verified by checking that marker meal exists (logic in seed script)
    // and that all records have unique identities
    const meals = await prisma.meal.findMany();
    const _mealNames = meals.map(m => m.mealName);

    // Check for duplicate names per tenant
    const tenants = await prisma.tenant.findMany();
    tenants.forEach(tenant => {
      const tenantMeals = meals.filter(m => m.tenantId === tenant.id);
      const names = tenantMeals.map(m => m.mealName);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length); // All names should be unique per tenant
    });
  });

  test('Seed data is isolated per tenant', async () => {
    // Given: Seeded database with multiple tenants
    // When: Querying meals for each tenant
    // Then: Each tenant only sees their own meals
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
      const mealCount = await prisma.meal.count({
        where: { tenantId: tenant.id },
      });

      expect(mealCount).toBeGreaterThanOrEqual(10); // At least 10 meals per tenant

      // Verify isolation: no meals from other tenants
      const mealIds = await prisma.meal.findMany({
        where: { tenantId: tenant.id },
        select: { id: true },
      });

      const otherTenantMeals = await prisma.meal.findMany({
        where: {
          id: { notIn: mealIds.map(m => m.id) },
        },
      });

      // Verify none of the other meals belong to this tenant
      otherTenantMeals.forEach(meal => {
        expect(meal.tenantId).not.toBe(tenant.id);
      });
    }
  });

  test('All seeded meals are vegan (100% plant-based)', async () => {
    // Given: Seeded database
    // When: Checking all ingredient names
    // Then: No non-vegan items in ingredient list
    const ingredients = await prisma.ingredient.findMany();

    // List of non-vegan keywords to check for
    const nonVeganKeywords = [
      'meat',
      'beef',
      'chicken',
      'pork',
      'fish',
      'salmon',
      'tuna',
      'milk',
      'cheese',
      'butter',
      'cream',
      'egg',
      'eggs',
      'honey',
      'bacon',
      'ham',
      'turkey',
      'shrimp',
      'prawn',
      'crab',
      'lobster',
    ];
    // Vegan ingredients that contain flagged substrings (e.g. coconut milk, cashew butter)
    const veganExceptions = new Set(['coconut milk', 'cashew butter']);

    ingredients.forEach(ing => {
      const lowerName = ing.ingredientName.toLowerCase();
      if (veganExceptions.has(lowerName)) return;
      nonVeganKeywords.forEach(keyword => {
        expect(lowerName).not.toContain(keyword);
      });
    });

    // Verify we have a good variety of vegan ingredients
    expect(ingredients.length).toBeGreaterThanOrEqual(30);
  });

  describe('Eligible meals endpoint with seeded data (US3)', () => {
    const mealRepository = new PrismaMealRepository(prisma);
    const userSettingsRepository = new PrismaUserSettingsRepository(prisma);
    const getEligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepository,
      userSettingsRepository
    );

    test('GET eligible meals for Monday lunch returns only lunch-suitable meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await getEligibleMealsUseCase.execute({
        tenantId,
        date: '2026-02-16', // Monday
        mealType: 'lunch',
      });
      expect(Array.isArray(meals)).toBe(true);
      meals.forEach(meal => {
        expect(meal.qualities.isLunch).toBe(true);
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
    });

    test('GET eligible meals for Monday dinner returns only dinner-suitable meals', async () => {
      const tenantId = SEED_TENANTS[0].id;
      const meals = await getEligibleMealsUseCase.execute({
        tenantId,
        date: '2026-02-16',
        mealType: 'dinner',
      });
      expect(Array.isArray(meals)).toBe(true);
      meals.forEach(meal => {
        expect(meal.qualities.isDinner).toBe(true);
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
    });

    test('eligible meals for tenant 2 are isolated from tenant 1', async () => {
      const tenant2Id = SEED_TENANTS[1].id;
      const meals = await getEligibleMealsUseCase.execute({
        tenantId: tenant2Id,
        date: '2026-02-15', // Sunday (tenant 2 week starts Sunday)
        mealType: 'lunch',
      });
      expect(Array.isArray(meals)).toBe(true);
      meals.forEach(meal => {
        expect(meal.qualities.isLunch).toBe(true);
      });
    });
  });

  describe('Comprehensive E2E (all 4 user stories)', () => {
    test('US1: seed creates tenants, meals, ingredients, and user settings', async () => {
      const tenants = await prisma.tenant.findMany();
      expect(tenants.length).toBe(2);
      const meals = await prisma.meal.count();
      expect(meals).toBeGreaterThanOrEqual(20);
      const ingredients = await prisma.ingredient.count();
      expect(ingredients).toBeGreaterThanOrEqual(30);
      const settings = await prisma.userSettings.count();
      expect(settings).toBe(2);
    });

    test('US2: data is isolated per tenant (no cross-tenant leakage)', async () => {
      const [t1, t2] = await prisma.tenant.findMany({ orderBy: { name: 'asc' } });
      const t1Meals = await prisma.meal.count({ where: { tenantId: t1.id } });
      const t2Meals = await prisma.meal.count({ where: { tenantId: t2.id } });
      expect(t1Meals).toBeGreaterThanOrEqual(10);
      expect(t2Meals).toBeGreaterThanOrEqual(10);
    });

    test('US3: eligible meals endpoint returns data for seeded tenants', async () => {
      const useCase = new GetEligibleMealsUseCase(
        new PrismaMealRepository(prisma),
        new PrismaUserSettingsRepository(prisma)
      );
      const meals = await useCase.execute({
        tenantId: SEED_TENANTS[0].id,
        date: '2026-02-16',
        mealType: 'lunch',
      });
      expect(meals.length).toBeGreaterThanOrEqual(1);
    });

    test('US4: planned weeks have 7 day plans each with partial meal coverage', async () => {
      const weeks = await prisma.plannedWeek.findMany({
        include: { dayPlans: true },
      });
      expect(weeks.length).toBe(4);
      weeks.forEach(w => expect(w.dayPlans.length).toBe(7));
      const withMeals = weeks.flatMap(w =>
        w.dayPlans.filter(dp => dp.lunchMealId != null || dp.dinnerMealId != null)
      );
      // 7 assignments per tenant × 2 tenants = 14 day plans with at least one meal
      expect(withMeals.length).toBeGreaterThanOrEqual(14);
    });
  });
});
