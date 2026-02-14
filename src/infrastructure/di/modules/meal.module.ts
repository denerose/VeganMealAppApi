import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import { GetRandomMealUseCase } from '@/application/meal/get-random-meal.use-case';
import { CreateMealUseCase } from '@/application/meal/create-meal.use-case';
import { GetMealUseCase } from '@/application/meal/get-meal.use-case';
import { ListMealsUseCase } from '@/application/meal/list-meals.use-case';
import { UpdateMealUseCase } from '@/application/meal/update-meal.use-case';
import { ArchiveMealUseCase } from '@/application/meal/archive-meal.use-case';
import { MealController } from '@/infrastructure/http/controllers/meal.controller';

export function registerMealModule(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(
    TOKENS.GetEligibleMealsUseCase,
    c =>
      new GetEligibleMealsUseCase(
        c.resolve(TOKENS.MealRepository),
        c.resolve(TOKENS.UserSettingsRepository)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.GetRandomMealUseCase,
    c => new GetRandomMealUseCase(c.resolve(TOKENS.GetEligibleMealsUseCase)),
    { singleton: true }
  );
  container.register(
    TOKENS.CreateMealUseCase,
    c => new CreateMealUseCase(c.resolve(TOKENS.MealRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.GetMealUseCase,
    c => new GetMealUseCase(c.resolve(TOKENS.MealRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.ListMealsUseCase,
    c => new ListMealsUseCase(c.resolve(TOKENS.MealRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.UpdateMealUseCase,
    c => new UpdateMealUseCase(c.resolve(TOKENS.MealRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.ArchiveMealUseCase,
    c => new ArchiveMealUseCase(c.resolve(TOKENS.MealRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.MealController,
    c =>
      new MealController(
        c.resolve(TOKENS.GetEligibleMealsUseCase),
        c.resolve(TOKENS.GetRandomMealUseCase),
        c.resolve(TOKENS.GetMealUseCase),
        c.resolve(TOKENS.CreateMealUseCase),
        c.resolve(TOKENS.ListMealsUseCase),
        c.resolve(TOKENS.UpdateMealUseCase),
        c.resolve(TOKENS.ArchiveMealUseCase)
      ),
    { singleton: true }
  );
}
