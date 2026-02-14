import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { PrismaPlannedWeekRepository } from '@/infrastructure/database/repositories/prisma-planned-week.repository';
import { PrismaMealRepository } from '@/infrastructure/database/repositories/prisma-meal.repository';
import { PrismaIngredientRepository } from '@/infrastructure/database/repositories/prisma-ingredient.repository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/prisma-user.repository';
import { PrismaUserSettingsRepository } from '@/infrastructure/database/repositories/prisma-user-settings.repository';
import { PrismaAuthRepository } from '@/infrastructure/database/repositories/prisma-auth.repository';

export function registerRepositories(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(
    TOKENS.PlannedWeekRepository,
    c => new PrismaPlannedWeekRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
  container.register(
    TOKENS.MealRepository,
    c => new PrismaMealRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
  container.register(
    TOKENS.IngredientRepository,
    c => new PrismaIngredientRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
  container.register(
    TOKENS.UserRepository,
    c => new PrismaUserRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
  container.register(
    TOKENS.UserSettingsRepository,
    c => new PrismaUserSettingsRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
  container.register(
    TOKENS.AuthRepository,
    c => new PrismaAuthRepository(c.resolve(TOKENS.PrismaClient)),
    { singleton: true }
  );
}
