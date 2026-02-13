import { describe, test, expect, beforeEach } from 'bun:test';
import { getPrismaClient } from '@/infrastructure/database/prisma/client';
import { PrismaIngredientRepository } from '@/infrastructure/database/repositories/prisma-ingredient.repository';
import { Ingredient } from '@/domain/ingredient/ingredient.entity';
import { StorageType } from '@/domain/shared/storage-type.enum';
import { resetDatabase, getTestPrisma } from '../../setup';

const prisma = getTestPrisma();
const repository = new PrismaIngredientRepository(prisma);

const TEST_TENANT_ID = crypto.randomUUID();

beforeEach(async () => {
  await resetDatabase();
  
  // Create test tenant
  await prisma.tenant.create({
    data: {
      id: TEST_TENANT_ID,
      name: 'Test Tenant',
    },
  });
});

describe('PrismaIngredientRepository', () => {
  describe('create', () => {
    test('should persist a new ingredient with storage type', async () => {
      const ingredient = Ingredient.create('Tomato', StorageType.FRIDGE);

      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      expect(savedIngredient.id).toBeDefined();
      expect(savedIngredient.name).toBe('Tomato');
      expect(savedIngredient.storageType).toBe(StorageType.FRIDGE);
      expect(savedIngredient.isStaple).toBe(false);
    });

    test('should persist ingredient with staple flag', async () => {
      const ingredient = Ingredient.create('Olive Oil', StorageType.PANTRY, true);

      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      expect(savedIngredient.isStaple).toBe(true);
    });

    test('should handle all storage type values', async () => {
      const storageTypes: StorageType[] = [
        StorageType.FRIDGE,
        StorageType.PANTRY,
        StorageType.FROZEN,
        StorageType.OTHER,
      ];

      for (const storageType of storageTypes) {
        const ingredient = Ingredient.create(`Test ${storageType}`, storageType);
        const saved = await repository.create(ingredient, TEST_TENANT_ID);
        expect(saved.storageType).toBe(storageType);
      }
    });
  });

  describe('findById', () => {
    test('should retrieve an existing ingredient', async () => {
      const ingredient = Ingredient.create('Garlic', StorageType.PANTRY);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      const foundIngredient = await repository.findById(savedIngredient.id!, TEST_TENANT_ID);

      expect(foundIngredient).not.toBeNull();
      expect(foundIngredient!.id).toBe(savedIngredient.id);
      expect(foundIngredient!.name).toBe('Garlic');
      expect(foundIngredient!.storageType).toBe(StorageType.PANTRY);
    });

    test('should return null if ingredient does not exist', async () => {
      const nonExistentId = crypto.randomUUID();
      const foundIngredient = await repository.findById(nonExistentId, TEST_TENANT_ID);

      expect(foundIngredient).toBeNull();
    });

    test('should return null if tenant does not match', async () => {
      const ingredient = Ingredient.create('Test Ingredient', StorageType.FRIDGE);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      const otherTenantId = crypto.randomUUID();
      const foundIngredient = await repository.findById(savedIngredient.id!, otherTenantId);

      expect(foundIngredient).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should list all ingredients for a tenant', async () => {
      const ingredient1 = Ingredient.create('Tomato', StorageType.FRIDGE);
      const ingredient2 = Ingredient.create('Rice', StorageType.PANTRY);

      await repository.create(ingredient1, TEST_TENANT_ID);
      await repository.create(ingredient2, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    test('should filter ingredients by name', async () => {
      const ingredient1 = Ingredient.create('Red Tomato', StorageType.FRIDGE);
      const ingredient2 = Ingredient.create('Green Pepper', StorageType.FRIDGE);

      await repository.create(ingredient1, TEST_TENANT_ID);
      await repository.create(ingredient2, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { name: 'Tomato' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Red Tomato');
    });

    test('should filter ingredients by storage type', async () => {
      const ingredient1 = Ingredient.create('Frozen Peas', StorageType.FROZEN);
      const ingredient2 = Ingredient.create('Fresh Peas', StorageType.FRIDGE);

      await repository.create(ingredient1, TEST_TENANT_ID);
      await repository.create(ingredient2, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { storageType: StorageType.FROZEN });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Frozen Peas');
    });

    test('should filter ingredients by staple flag', async () => {
      const ingredient1 = Ingredient.create('Salt', StorageType.PANTRY, true);
      const ingredient2 = Ingredient.create('Fresh Herbs', StorageType.FRIDGE, false);

      await repository.create(ingredient1, TEST_TENANT_ID);
      await repository.create(ingredient2, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID, { isStaple: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Salt');
    });

    test('should paginate results', async () => {
      for (let i = 1; i <= 15; i++) {
        const ingredient = Ingredient.create(`Ingredient ${i}`, StorageType.PANTRY);
        await repository.create(ingredient, TEST_TENANT_ID);
      }

      const result = await repository.findAll(
        TEST_TENANT_ID,
        undefined,
        { limit: 10, offset: 0 }
      );

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);

      const page2 = await repository.findAll(
        TEST_TENANT_ID,
        undefined,
        { limit: 10, offset: 10 }
      );

      expect(page2.items).toHaveLength(5);
    });

    test('should sort results alphabetically by name', async () => {
      const ingredient1 = Ingredient.create('Zucchini', StorageType.FRIDGE);
      const ingredient2 = Ingredient.create('Apple', StorageType.FRIDGE);
      const ingredient3 = Ingredient.create('Mango', StorageType.FRIDGE);

      await repository.create(ingredient1, TEST_TENANT_ID);
      await repository.create(ingredient2, TEST_TENANT_ID);
      await repository.create(ingredient3, TEST_TENANT_ID);

      const result = await repository.findAll(TEST_TENANT_ID);

      expect(result.items[0].name).toBe('Apple');
      expect(result.items[1].name).toBe('Mango');
      expect(result.items[2].name).toBe('Zucchini');
    });
  });

  describe('save', () => {
    test('should update ingredient name', async () => {
      const ingredient = Ingredient.create('Original Name', StorageType.FRIDGE);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      savedIngredient.updateName('Updated Name');

      const updatedIngredient = await repository.save(savedIngredient, TEST_TENANT_ID);

      expect(updatedIngredient.name).toBe('Updated Name');
    });

    test('should update storage type', async () => {
      const ingredient = Ingredient.create('Test Ingredient', StorageType.FRIDGE);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      savedIngredient.updateStorageType(StorageType.FROZEN);

      const updatedIngredient = await repository.save(savedIngredient, TEST_TENANT_ID);

      expect(updatedIngredient.storageType).toBe(StorageType.FROZEN);
    });

    test('should update staple flag', async () => {
      const ingredient = Ingredient.create('Test Ingredient', StorageType.PANTRY, false);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      savedIngredient.setStaple(true);

      const updatedIngredient = await repository.save(savedIngredient, TEST_TENANT_ID);

      expect(updatedIngredient.isStaple).toBe(true);
    });

    test('should update multiple properties at once', async () => {
      const ingredient = Ingredient.create('Test', StorageType.FRIDGE, false);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      savedIngredient.updateName('Updated Test');
      savedIngredient.updateStorageType(StorageType.PANTRY);
      savedIngredient.setStaple(true);

      const updatedIngredient = await repository.save(savedIngredient, TEST_TENANT_ID);

      expect(updatedIngredient.name).toBe('Updated Test');
      expect(updatedIngredient.storageType).toBe(StorageType.PANTRY);
      expect(updatedIngredient.isStaple).toBe(true);
    });
  });

  describe('delete', () => {
    test('should remove ingredient from database', async () => {
      const ingredient = Ingredient.create('Test Ingredient', StorageType.FRIDGE);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      await repository.delete(savedIngredient.id!, TEST_TENANT_ID);

      const foundIngredient = await repository.findById(savedIngredient.id!, TEST_TENANT_ID);
      expect(foundIngredient).toBeNull();
    });

    test('should only delete within specified tenant', async () => {
      const otherTenantId = crypto.randomUUID();
      await prisma.tenant.create({
        data: {
          id: otherTenantId,
          name: 'Other Tenant',
        },
      });

      const ingredient = Ingredient.create('Test Ingredient', StorageType.FRIDGE);
      const savedIngredient = await repository.create(ingredient, TEST_TENANT_ID);

      await expect(
        repository.delete(savedIngredient.id!, otherTenantId)
      ).rejects.toThrow();

      const foundIngredient = await repository.findById(savedIngredient.id!, TEST_TENANT_ID);
      expect(foundIngredient).not.toBeNull();
    });
  });
});
