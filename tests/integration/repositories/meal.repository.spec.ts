import { describe, test, expect, beforeEach } from 'bun:test';
import { PrismaMealRepository } from '@/infrastructure/database/repositories/prisma-meal.repository';
import { Meal } from '@/domain/meal/meal.entity';
import { resetDatabase, getTestPrisma } from '../../setup';

const prisma = getTestPrisma();
const repository = new PrismaMealRepository(prisma);

const TEST_TENANT_ID = crypto.randomUUID();
const TEST_USER_ID = crypto.randomUUID();

beforeEach(async () => {
  await resetDatabase();

  // Create test tenant and user
  await prisma.tenant.create({
    data: {
      id: TEST_TENANT_ID,
      name: 'Test Tenant',
      users: {
        create: {
          id: TEST_USER_ID,
          email: 'test@example.com',
          nickname: 'Test User',
          isTenantAdmin: true,
        },
      },
    },
  });
});

describe('PrismaMealRepository', () => {
  describe('create', () => {
    test('should persist a new meal with qualities and ingredients', async () => {
      // Create an ingredient first
      const ingredient = await prisma.ingredient.create({
        data: {
          ingredientName: 'Tomato',
          storageType: 'FRIDGE',
          staple: false,
          tenantId: TEST_TENANT_ID,
        },
      });

      const meal = Meal.create(
        'Spaghetti Marinara',
        {
          isDinner: true,
          isLunch: false,
          isCreamy: false,
          isAcidic: true,
          greenVeg: false,
          makesLunch: true,
          isEasyToMake: true,
          needsPrep: false,
        },
        [ingredient.id]
      );

      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      expect(savedMeal.id).toBeDefined();
      expect(savedMeal.name).toBe('Spaghetti Marinara');
      expect(savedMeal.qualities.props.isDinner).toBe(true);
      expect(savedMeal.qualities.props.isAcidic).toBe(true);
      expect(savedMeal.ingredientIds).toEqual([ingredient.id]);
    });

    test('should persist meal without ingredients', async () => {
      const meal = Meal.create('Simple Salad');

      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      expect(savedMeal.id).toBeDefined();
      expect(savedMeal.name).toBe('Simple Salad');
      expect(savedMeal.ingredientIds).toEqual([]);
    });
  });

  describe('findById', () => {
    test('should retrieve an existing meal with all relationships', async () => {
      const ingredient = await prisma.ingredient.create({
        data: {
          ingredientName: 'Pasta',
          storageType: 'PANTRY',
          staple: true,
          tenantId: TEST_TENANT_ID,
        },
      });

      const meal = Meal.create('Pasta Dish', undefined, [ingredient.id]);
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      const foundMeal = await repository.findById(savedMeal.id!, TEST_TENANT_ID);

      expect(foundMeal).not.toBeNull();
      expect(foundMeal!.id).toBe(savedMeal.id);
      expect(foundMeal!.name).toBe('Pasta Dish');
      expect(foundMeal!.ingredientIds).toEqual([ingredient.id]);
    });

    test('should return null if meal does not exist', async () => {
      const nonExistentId = crypto.randomUUID();
      const foundMeal = await repository.findById(nonExistentId, TEST_TENANT_ID);

      expect(foundMeal).toBeNull();
    });

    test('should return null if tenant does not match', async () => {
      const meal = Meal.create('Test Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      const otherTenantId = crypto.randomUUID();
      const foundMeal = await repository.findById(savedMeal.id!, otherTenantId);

      expect(foundMeal).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should list all meals for a tenant', async () => {
      const meal1 = Meal.create('Meal 1');
      const meal2 = Meal.create('Meal 2');

      await repository.create(meal1, TEST_TENANT_ID, TEST_USER_ID);
      await repository.create(meal2, TEST_TENANT_ID, TEST_USER_ID);

      const result = await repository.findAll(TEST_TENANT_ID);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('should filter meals by name', async () => {
      const meal1 = Meal.create('Spaghetti Bolognese');
      const meal2 = Meal.create('Pizza Margherita');

      await repository.create(meal1, TEST_TENANT_ID, TEST_USER_ID);
      await repository.create(meal2, TEST_TENANT_ID, TEST_USER_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { name: 'Spaghetti' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Spaghetti Bolognese');
    });

    test('should filter meals by quality flags', async () => {
      const meal1 = Meal.create('Creamy Pasta', { isCreamy: true });
      const meal2 = Meal.create('Tomato Soup', { isAcidic: true });

      await repository.create(meal1, TEST_TENANT_ID, TEST_USER_ID);
      await repository.create(meal2, TEST_TENANT_ID, TEST_USER_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { isCreamy: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Creamy Pasta');
    });

    test('should exclude archived meals by default', async () => {
      const meal = Meal.create('Archived Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      savedMeal.archive();
      await repository.save(savedMeal, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID);

      expect(result.items).toHaveLength(0);
    });

    test('should include archived meals when requested', async () => {
      const meal = Meal.create('Archived Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      savedMeal.archive();
      await repository.save(savedMeal, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { includeArchived: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isArchived).toBe(true);
    });

    test('should paginate results', async () => {
      for (let i = 1; i <= 15; i++) {
        const meal = Meal.create(`Meal ${i}`);
        await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);
      }

      const result = await repository.findAll(TEST_TENANT_ID, undefined, { limit: 10, offset: 0 });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);

      const page2 = await repository.findAll(TEST_TENANT_ID, undefined, { limit: 10, offset: 10 });

      expect(page2.items).toHaveLength(5);
    });
  });

  describe('save', () => {
    test('should update meal name and qualities', async () => {
      const meal = Meal.create('Original Name');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      savedMeal.updateName('Updated Name');
      savedMeal.updateQualities({ isCreamy: true });

      const updatedMeal = await repository.save(savedMeal, TEST_TENANT_ID);

      expect(updatedMeal.name).toBe('Updated Name');
      expect(updatedMeal.qualities.props.isCreamy).toBe(true);
    });

    test('should update meal ingredients', async () => {
      const ingredient1 = await prisma.ingredient.create({
        data: {
          ingredientName: 'Ingredient 1',
          storageType: 'FRIDGE',
          staple: false,
          tenantId: TEST_TENANT_ID,
        },
      });

      const ingredient2 = await prisma.ingredient.create({
        data: {
          ingredientName: 'Ingredient 2',
          storageType: 'PANTRY',
          staple: false,
          tenantId: TEST_TENANT_ID,
        },
      });

      const meal = Meal.create('Test Meal', undefined, [ingredient1.id]);
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      savedMeal.setIngredients([ingredient2.id]);

      const updatedMeal = await repository.save(savedMeal, TEST_TENANT_ID);

      expect(updatedMeal.ingredientIds).toEqual([ingredient2.id]);
    });

    test('should persist archived state', async () => {
      const meal = Meal.create('Test Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      savedMeal.archive();
      const updatedMeal = await repository.save(savedMeal, TEST_TENANT_ID);

      expect(updatedMeal.isArchived).toBe(true);
      expect(updatedMeal.archivedAt).not.toBeNull();
    });
  });

  describe('delete', () => {
    test('should remove meal from database', async () => {
      const meal = Meal.create('Test Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      await repository.delete(savedMeal.id!, TEST_TENANT_ID);

      const foundMeal = await repository.findById(savedMeal.id!, TEST_TENANT_ID);
      expect(foundMeal).toBeNull();
    });

    test('should only delete within specified tenant', async () => {
      const otherTenantId = crypto.randomUUID();
      await prisma.tenant.create({
        data: {
          id: otherTenantId,
          name: 'Other Tenant',
        },
      });

      const meal = Meal.create('Test Meal');
      const savedMeal = await repository.create(meal, TEST_TENANT_ID, TEST_USER_ID);

      return expect(repository.delete(savedMeal.id!, otherTenantId)).rejects.toThrow();

      const foundMeal = await repository.findById(savedMeal.id!, TEST_TENANT_ID);
      expect(foundMeal).not.toBeNull();
    });
  });
});
