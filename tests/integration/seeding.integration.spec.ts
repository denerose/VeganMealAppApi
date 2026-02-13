import { describe, test, expect, beforeEach, beforeAll, spyOn } from 'bun:test';
import {
  deterministicUuid,
  log,
  logVerbose,
  checkIdempotency,
  seedDatabase,
} from '../../prisma/seed-utils';
import { SEED_TENANTS } from '../../prisma/seed-data';
import { resetDatabase, getTestPrisma } from '../setup';

const prisma = getTestPrisma();

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
});
