import type { PrismaClient } from '@prisma/client';
import { Ingredient, type IngredientId } from '@/domain/ingredient/ingredient.entity';
import type {
  IngredientRepository,
  IngredientFilters,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/ingredient/ingredient.repository';
import { StorageType } from '@/domain/shared/storage-type.enum';

export class PrismaIngredientRepository implements IngredientRepository {
  constructor(private prisma: PrismaClient) {}

  async create(ingredient: Ingredient, tenantId: string): Promise<Ingredient> {
    const id = crypto.randomUUID();
    ingredient.assignId(id);
    const snapshot = ingredient.toSnapshot();

    const createdIngredient = await this.prisma.ingredient.create({
      data: {
        id: snapshot.id,
        ingredientName: snapshot.name,
        storageType: snapshot.storageType,
        staple: snapshot.isStaple,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
        tenantId,
      },
    });

    return this.toDomain(createdIngredient);
  }

  async findById(id: IngredientId, tenantId: string): Promise<Ingredient | null> {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return ingredient ? this.toDomain(ingredient) : null;
  }

  async findAll(
    tenantId: string,
    filters?: IngredientFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Ingredient>> {
    const where: any = {
      tenantId,
    };

    if (filters) {
      if (filters.name) {
        where.ingredientName = {
          contains: filters.name,
          mode: 'insensitive',
        };
      }

      if (filters.storageType) {
        where.storageType = filters.storageType;
      }

      if (filters.isStaple !== undefined) {
        where.staple = filters.isStaple;
      }
    }

    const [ingredients, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip: pagination?.offset ?? 0,
        take: pagination?.limit ?? 50,
        orderBy: {
          ingredientName: 'asc',
        },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return {
      items: ingredients.map((ingredient) => this.toDomain(ingredient)),
      total,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    };
  }

  async save(ingredient: Ingredient, tenantId: string): Promise<Ingredient> {
    const snapshot = ingredient.toSnapshot();

    const updatedIngredient = await this.prisma.ingredient.update({
      where: {
        id: snapshot.id,
        tenantId,
      },
      data: {
        ingredientName: snapshot.name,
        storageType: snapshot.storageType,
        staple: snapshot.isStaple,
        updatedAt: snapshot.updatedAt,
      },
    });

    return this.toDomain(updatedIngredient);
  }

  async delete(id: IngredientId, tenantId: string): Promise<void> {
    await this.prisma.ingredient.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  private toDomain(prismaIngredient: any): Ingredient {
    return Ingredient.rehydrate({
      id: prismaIngredient.id,
      name: prismaIngredient.ingredientName,
      storageType: prismaIngredient.storageType as StorageType,
      isStaple: prismaIngredient.staple,
      createdAt: prismaIngredient.createdAt,
      updatedAt: prismaIngredient.updatedAt,
    });
  }
}
