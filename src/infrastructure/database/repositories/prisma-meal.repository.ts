import type { PrismaClient, Prisma } from '@prisma/client';
import { Meal, type MealId } from '@/domain/meal/meal.entity';
import type {
  MealRepository,
  MealFilters,
  PaginationOptions,
  PaginatedResult,
  MealQualitiesFilter,
  MealSummary,
} from '@/domain/meal/meal.repository';
import { MEAL_QUALITIES_FILTER_KEYS } from '@/domain/shared/meal-quality.constants';

type MealWithQualities = Prisma.MealGetPayload<{ include: { qualities: true } }>;
type MealWithQualitiesAndIngredients = Prisma.MealGetPayload<{
  include: { qualities: true; ingredients: true };
}>;

export class PrismaMealRepository implements MealRepository {
  constructor(private prisma: PrismaClient) {}

  async findByQualities(tenantId: string, filter: MealQualitiesFilter): Promise<MealSummary[]> {
    const where: Prisma.MealWhereInput = { tenantId };
    if (filter.isArchived !== undefined) {
      where.isArchived = filter.isArchived;
    } else {
      where.isArchived = false;
    }
    where.qualities = {};
    MEAL_QUALITIES_FILTER_KEYS.forEach(key => {
      if (filter[key] !== undefined) {
        (where.qualities as Record<string, boolean>)[key] = filter[key];
      }
    });
    const meals = await this.prisma.meal.findMany({
      where,
      include: { qualities: true },
    });
    return meals.map((meal: MealWithQualities) => ({
      id: meal.id,
      mealName: meal.mealName,
      qualities: {
        isDinner: meal.qualities?.isDinner ?? true,
        isLunch: meal.qualities?.isLunch ?? false,
        isCreamy: meal.qualities?.isCreamy ?? false,
        isAcidic: meal.qualities?.isAcidic ?? false,
        greenVeg: meal.qualities?.greenVeg ?? false,
        makesLunch: meal.qualities?.makesLunch ?? false,
        isEasyToMake: meal.qualities?.isEasyToMake ?? false,
        needsPrep: meal.qualities?.needsPrep ?? false,
      },
    }));
  }

  async create(meal: Meal, tenantId: string, createdBy?: string): Promise<Meal> {
    const id = crypto.randomUUID();
    meal.assignId(id);
    const snapshot = meal.toSnapshot();

    const createdMeal = await this.prisma.meal.create({
      data: {
        id: snapshot.id,
        mealName: snapshot.name,
        isArchived: snapshot.archivedAt !== null,
        deletedAt: snapshot.archivedAt,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
        tenantId,
        createdBy: createdBy || tenantId, // TODO: Extract from auth context
        qualities: {
          create: {
            isDinner: snapshot.qualities.isDinner,
            isLunch: snapshot.qualities.isLunch,
            isCreamy: snapshot.qualities.isCreamy,
            isAcidic: snapshot.qualities.isAcidic,
            greenVeg: snapshot.qualities.greenVeg,
            makesLunch: snapshot.qualities.makesLunch,
            isEasyToMake: snapshot.qualities.isEasyToMake,
            needsPrep: snapshot.qualities.needsPrep,
          },
        },
        ingredients: {
          create: snapshot.ingredientIds.map(ingredientId => ({
            ingredientId,
          })),
        },
      },
      include: {
        qualities: true,
        ingredients: true,
      },
    });

    return this.toDomain(createdMeal);
  }

  async findById(id: MealId, tenantId: string): Promise<Meal | null> {
    const meal = await this.prisma.meal.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        qualities: true,
        ingredients: true,
      },
    });

    return meal ? this.toDomain(meal) : null;
  }

  async findAll(
    tenantId: string,
    filters?: MealFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Meal>> {
    const where: Prisma.MealWhereInput = {
      tenantId,
    };

    // By default, exclude archived meals unless explicitly requested
    if (!filters?.includeArchived) {
      where.isArchived = false;
    }

    if (filters) {
      if (filters.name) {
        where.mealName = {
          contains: filters.name,
          mode: 'insensitive',
        };
      }

      // Quality filters
      if (filters.isDinner !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          isDinner: filters.isDinner,
        };
      }
      if (filters.isLunch !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          isLunch: filters.isLunch,
        };
      }
      if (filters.isCreamy !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          isCreamy: filters.isCreamy,
        };
      }
      if (filters.isAcidic !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          isAcidic: filters.isAcidic,
        };
      }
      if (filters.greenVeg !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          greenVeg: filters.greenVeg,
        };
      }
      if (filters.makesLunch !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          makesLunch: filters.makesLunch,
        };
      }
      if (filters.isEasyToMake !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          isEasyToMake: filters.isEasyToMake,
        };
      }
      if (filters.needsPrep !== undefined) {
        where.qualities = {
          ...(where.qualities as object),
          needsPrep: filters.needsPrep,
        };
      }
    }

    const [meals, total] = await Promise.all([
      this.prisma.meal.findMany({
        where,
        include: {
          qualities: true,
          ingredients: true,
        },
        skip: pagination?.offset ?? 0,
        take: pagination?.limit ?? 50,
        orderBy: {
          mealName: 'asc',
        },
      }),
      this.prisma.meal.count({ where }),
    ]);

    return {
      items: meals.map((meal: MealWithQualitiesAndIngredients) => this.toDomain(meal)),
      total,
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    };
  }

  async save(meal: Meal, tenantId: string): Promise<Meal> {
    const snapshot = meal.toSnapshot();

    await this.prisma.$transaction(async tx => {
      // Update meal
      await tx.meal.update({
        where: {
          id: snapshot.id,
          tenantId,
        },
        data: {
          mealName: snapshot.name,
          isArchived: snapshot.archivedAt !== null,
          deletedAt: snapshot.archivedAt,
          updatedAt: snapshot.updatedAt,
        },
      });

      // Update qualities
      if (snapshot.qualities) {
        await tx.mealQualities.upsert({
          where: {
            mealId: snapshot.id,
          },
          create: {
            mealId: snapshot.id,
            isDinner: snapshot.qualities.isDinner,
            isLunch: snapshot.qualities.isLunch,
            isCreamy: snapshot.qualities.isCreamy,
            isAcidic: snapshot.qualities.isAcidic,
            greenVeg: snapshot.qualities.greenVeg,
            makesLunch: snapshot.qualities.makesLunch,
            isEasyToMake: snapshot.qualities.isEasyToMake,
            needsPrep: snapshot.qualities.needsPrep,
          },
          update: {
            isDinner: snapshot.qualities.isDinner,
            isLunch: snapshot.qualities.isLunch,
            isCreamy: snapshot.qualities.isCreamy,
            isAcidic: snapshot.qualities.isAcidic,
            greenVeg: snapshot.qualities.greenVeg,
            makesLunch: snapshot.qualities.makesLunch,
            isEasyToMake: snapshot.qualities.isEasyToMake,
            needsPrep: snapshot.qualities.needsPrep,
          },
        });
      }

      // Update ingredients (delete all and recreate)
      await tx.mealIngredient.deleteMany({
        where: {
          mealId: snapshot.id,
        },
      });

      if (snapshot.ingredientIds.length > 0) {
        await tx.mealIngredient.createMany({
          data: snapshot.ingredientIds.map(ingredientId => ({
            mealId: snapshot.id,
            ingredientId,
          })),
        });
      }
    });

    // Fetch and return updated meal
    const updatedMeal = await this.prisma.meal.findUniqueOrThrow({
      where: {
        id: snapshot.id,
      },
      include: {
        qualities: true,
        ingredients: true,
      },
    });

    return this.toDomain(updatedMeal);
  }

  async delete(id: MealId, tenantId: string): Promise<void> {
    await this.prisma.meal.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  private toDomain(prismaMeal: MealWithQualitiesAndIngredients): Meal {
    return Meal.rehydrate({
      id: prismaMeal.id,
      name: prismaMeal.mealName,
      qualities: {
        isDinner: prismaMeal.qualities?.isDinner ?? true,
        isLunch: prismaMeal.qualities?.isLunch ?? false,
        isCreamy: prismaMeal.qualities?.isCreamy ?? false,
        isAcidic: prismaMeal.qualities?.isAcidic ?? false,
        greenVeg: prismaMeal.qualities?.greenVeg ?? false,
        makesLunch: prismaMeal.qualities?.makesLunch ?? false,
        isEasyToMake: prismaMeal.qualities?.isEasyToMake ?? false,
        needsPrep: prismaMeal.qualities?.needsPrep ?? false,
      },
      ingredientIds: prismaMeal.ingredients?.map(mi => mi.ingredientId) ?? [],
      archivedAt: prismaMeal.deletedAt,
      createdAt: prismaMeal.createdAt,
      updatedAt: prismaMeal.updatedAt,
    });
  }
}
