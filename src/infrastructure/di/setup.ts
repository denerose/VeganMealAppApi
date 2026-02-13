import { createToken, container } from '@/infrastructure/di/container';
import { getPrismaClient } from '@/infrastructure/database/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Repositories
import type { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';
import { PrismaPlannedWeekRepository } from '@/infrastructure/database/repositories/prisma-planned-week.repository';
import type { MealRepository } from '@/domain/meal/meal.repository';
import { PrismaMealRepository } from '@/infrastructure/database/repositories/prisma-meal.repository';
import type { IngredientRepository } from '@/domain/ingredient/ingredient.repository';
import { PrismaIngredientRepository } from '@/infrastructure/database/repositories/prisma-ingredient.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/prisma-user.repository';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { PrismaUserSettingsRepository } from '@/infrastructure/database/repositories/prisma-user-settings.repository';

// Use Cases
import { CreatePlannedWeekUseCase } from '@/application/planned-week/create-planned-week.usecase';
import { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.usecase';
import { DeletePlannedWeekUseCase } from '@/application/planned-week/delete-planned-week.usecase';
import { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.usecase';
import { PopulateLeftoversUseCase } from '@/application/planned-week/populate-leftovers.usecase';
import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.usecase';
import { GetRandomMealUseCase } from '@/application/meal/get-random-meal.usecase';
import { CreateMealUseCase } from '@/application/use-cases/create-meal.use-case';
import { ListMealsUseCase } from '@/application/use-cases/list-meals.use-case';
import { UpdateMealUseCase } from '@/application/use-cases/update-meal.use-case';
import { ArchiveMealUseCase } from '@/application/use-cases/archive-meal.use-case';
import { CreateIngredientUseCase } from '@/application/use-cases/create-ingredient.use-case';
import { ListIngredientsUseCase } from '@/application/use-cases/list-ingredients.use-case';
import { UpdateIngredientUseCase } from '@/application/use-cases/update-ingredient.use-case';
import { DeleteIngredientUseCase } from '@/application/use-cases/delete-ingredient.use-case';
import { GetUserSettingsUseCase } from '@/application/use-cases/get-user-settings.use-case';
import { UpdateUserSettingsUseCase } from '@/application/use-cases/update-user-settings.use-case';

// Controllers
import { PlannedWeekController } from '@/infrastructure/http/controllers/planned-week.controller';
import { DayPlanController } from '@/infrastructure/http/controllers/day-plan.controller';
import { MealController } from '@/infrastructure/http/controllers/meal.controller';
import { IngredientController } from '@/infrastructure/http/controllers/ingredient.controller';
import { UserSettingsController } from '@/infrastructure/http/controllers/user-settings.controller';
import { GetEligibleMealsUserSettingsRepositoryAdapter } from '@/infrastructure/adapters/get-eligible-meals-user-settings.adapter';

// ============================================================================
// TOKENS
// ============================================================================

export const TOKENS = {
  // Infrastructure
  PrismaClient: createToken<PrismaClient>('PrismaClient'),

  // Repositories
  PlannedWeekRepository: createToken<PlannedWeekRepository>('PlannedWeekRepository'),
  MealRepository: createToken<MealRepository>('MealRepository'),
  IngredientRepository: createToken<IngredientRepository>('IngredientRepository'),
  UserRepository: createToken<UserRepository>('UserRepository'),
  UserSettingsRepository: createToken<UserSettingsRepository>('UserSettingsRepository'),

  // Use Cases
  CreatePlannedWeekUseCase: createToken<CreatePlannedWeekUseCase>('CreatePlannedWeekUseCase'),
  GetPlannedWeekUseCase: createToken<GetPlannedWeekUseCase>('GetPlannedWeekUseCase'),
  DeletePlannedWeekUseCase: createToken<DeletePlannedWeekUseCase>('DeletePlannedWeekUseCase'),
  AssignMealToDayUseCase: createToken<AssignMealToDayUseCase>('AssignMealToDayUseCase'),
  PopulateLeftoversUseCase: createToken<PopulateLeftoversUseCase>('PopulateLeftoversUseCase'),
  GetEligibleMealsUseCase: createToken<GetEligibleMealsUseCase>('GetEligibleMealsUseCase'),
  GetRandomMealUseCase: createToken<GetRandomMealUseCase>('GetRandomMealUseCase'),
  CreateMealUseCase: createToken<CreateMealUseCase>('CreateMealUseCase'),
  ListMealsUseCase: createToken<ListMealsUseCase>('ListMealsUseCase'),
  UpdateMealUseCase: createToken<UpdateMealUseCase>('UpdateMealUseCase'),
  ArchiveMealUseCase: createToken<ArchiveMealUseCase>('ArchiveMealUseCase'),
  CreateIngredientUseCase: createToken<CreateIngredientUseCase>('CreateIngredientUseCase'),
  ListIngredientsUseCase: createToken<ListIngredientsUseCase>('ListIngredientsUseCase'),
  UpdateIngredientUseCase: createToken<UpdateIngredientUseCase>('UpdateIngredientUseCase'),
  DeleteIngredientUseCase: createToken<DeleteIngredientUseCase>('DeleteIngredientUseCase'),
  GetUserSettingsUseCase: createToken<GetUserSettingsUseCase>('GetUserSettingsUseCase'),
  UpdateUserSettingsUseCase: createToken<UpdateUserSettingsUseCase>('UpdateUserSettingsUseCase'),

  // Controllers
  PlannedWeekController: createToken<PlannedWeekController>('PlannedWeekController'),
  DayPlanController: createToken<DayPlanController>('DayPlanController'),
  MealController: createToken<MealController>('MealController'),
  IngredientController: createToken<IngredientController>('IngredientController'),
  UserSettingsController: createToken<UserSettingsController>('UserSettingsController'),
};

// ============================================================================
// REGISTRATION
// ============================================================================

export const registerDependencies = (): void => {
  // Infrastructure
  container.register(TOKENS.PrismaClient, () => getPrismaClient(), { singleton: true });

  // Repositories
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

  // Use Cases
  container.register(
    TOKENS.CreatePlannedWeekUseCase,
    c => new CreatePlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.GetPlannedWeekUseCase,
    c => new GetPlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.DeletePlannedWeekUseCase,
    c => new DeletePlannedWeekUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.AssignMealToDayUseCase,
    c => new AssignMealToDayUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.PopulateLeftoversUseCase,
    c => new PopulateLeftoversUseCase(c.resolve(TOKENS.PlannedWeekRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.CreateMealUseCase,
    c => new CreateMealUseCase(c.resolve(TOKENS.MealRepository)),
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
    TOKENS.CreateIngredientUseCase,
    c => new CreateIngredientUseCase(c.resolve(TOKENS.IngredientRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.ListIngredientsUseCase,
    c => new ListIngredientsUseCase(c.resolve(TOKENS.IngredientRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.UpdateIngredientUseCase,
    c => new UpdateIngredientUseCase(c.resolve(TOKENS.IngredientRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.DeleteIngredientUseCase,
    c => new DeleteIngredientUseCase(c.resolve(TOKENS.IngredientRepository)),
    { singleton: true }
  );

  container.register(
    TOKENS.GetUserSettingsUseCase,
    c =>
      new GetUserSettingsUseCase(
        c.resolve(TOKENS.UserSettingsRepository),
        c.resolve(TOKENS.UserRepository)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.UpdateUserSettingsUseCase,
    c =>
      new UpdateUserSettingsUseCase(
        c.resolve(TOKENS.UserSettingsRepository),
        c.resolve(TOKENS.UserRepository)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.GetEligibleMealsUseCase,
    c =>
      new GetEligibleMealsUseCase(
        c.resolve(TOKENS.MealRepository),
        new GetEligibleMealsUserSettingsRepositoryAdapter(c.resolve(TOKENS.UserSettingsRepository))
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.GetRandomMealUseCase,
    c => new GetRandomMealUseCase(c.resolve(TOKENS.GetEligibleMealsUseCase)),
    { singleton: true }
  );

  // Controllers
  container.register(
    TOKENS.PlannedWeekController,
    c =>
      new PlannedWeekController(
        c.resolve(TOKENS.CreatePlannedWeekUseCase),
        c.resolve(TOKENS.GetPlannedWeekUseCase),
        c.resolve(TOKENS.DeletePlannedWeekUseCase),
        c.resolve(TOKENS.PopulateLeftoversUseCase)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.DayPlanController,
    c =>
      new DayPlanController(
        c.resolve(TOKENS.AssignMealToDayUseCase),
        c.resolve(TOKENS.GetPlannedWeekUseCase)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.MealController,
    c =>
      new MealController(
        c.resolve(TOKENS.GetEligibleMealsUseCase),
        c.resolve(TOKENS.GetRandomMealUseCase),
        c.resolve(TOKENS.CreateMealUseCase),
        c.resolve(TOKENS.ListMealsUseCase),
        c.resolve(TOKENS.UpdateMealUseCase),
        c.resolve(TOKENS.ArchiveMealUseCase)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.IngredientController,
    c =>
      new IngredientController(
        c.resolve(TOKENS.CreateIngredientUseCase),
        c.resolve(TOKENS.ListIngredientsUseCase),
        c.resolve(TOKENS.UpdateIngredientUseCase),
        c.resolve(TOKENS.DeleteIngredientUseCase)
      ),
    { singleton: true }
  );

  container.register(
    TOKENS.UserSettingsController,
    c =>
      new UserSettingsController(
        c.resolve(TOKENS.GetUserSettingsUseCase),
        c.resolve(TOKENS.UpdateUserSettingsUseCase)
      ),
    { singleton: true }
  );
};
