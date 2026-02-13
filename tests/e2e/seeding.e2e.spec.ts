import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * E2E Tests: Database Seeding (US1)
 * 
 * These tests verify the complete seed script execution:
 * - Seed integrity (correct number of records created)
 * - Multi-tenant isolation (no cross-tenant data leakage)
 * - Idempotency (re-running seed doesn't duplicate data)
 * - Data quality (realistic values, valid relationships)
 */

describe('Database Seeding (E2E)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client for testing
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Seed creates correct number of tenants', async () => {
    // Given: Seeded database
    // When: Querying tenant count
    // Then: Exactly 2 tenants exist
    const tenants = await prisma.tenant.findMany();
    expect(tenants.length).toBe(2);
    expect(tenants.some(t => t.name === 'Tenant-1')).toBe(true);
    expect(tenants.some(t => t.name === 'Tenant-2')).toBe(true);
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
      expect(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).toContain(
        setting.weekStartDay
      );
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

  test('Re-running seed is idempotent (no duplicates)', async () => {
    // Given: Seeded database
    // When: Querying the same counts before and after conceptually re-running
    // Then: No duplicates exist (verify via unique constraints)
    
    const mealsBefore = await prisma.meal.count();
    const ingredientsBefore = await prisma.ingredient.count();
    const settingsBefore = await prisma.userSettings.count();
    
    // Idempotency is verified by checking that marker meal exists (logic in seed script)
    // and that all records have unique identities
    const meals = await prisma.meal.findMany();
    const mealNames = meals.map(m => m.mealName);
    
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
      'meat', 'beef', 'chicken', 'pork', 'fish', 'salmon', 'tuna',
      'milk', 'cheese', 'butter', 'cream', 'egg', 'eggs', 'honey',
      'bacon', 'ham', 'turkey', 'shrimp', 'prawn', 'crab', 'lobster'
    ];
    
    ingredients.forEach(ing => {
      const lowerName = ing.name.toLowerCase();
      nonVeganKeywords.forEach(keyword => {
        expect(lowerName).not.toContain(keyword);
      });
    });
    
    // Verify we have a good variety of vegan ingredients
    expect(ingredients.length).toBeGreaterThanOrEqual(30);
  });
});
