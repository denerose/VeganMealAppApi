import { container } from '@/infrastructure/di/container';
import { getPrismaClient } from '@/infrastructure/database/prisma/client';
import { TOKENS } from '@/infrastructure/di/tokens';
import { registerRepositories } from '@/infrastructure/di/modules/repositories.module';
import { registerPlannedWeekModule } from '@/infrastructure/di/modules/planned-week.module';
import { registerMealModule } from '@/infrastructure/di/modules/meal.module';
import { registerIngredientModule } from '@/infrastructure/di/modules/ingredient.module';
import { registerUserSettingsModule } from '@/infrastructure/di/modules/user-settings.module';
import { registerAuthModule } from '@/infrastructure/di/modules/auth.module';

export { TOKENS };

export const registerDependencies = (): void => {
  container.register(TOKENS.PrismaClient, () => getPrismaClient(), { singleton: true });

  registerRepositories(container, TOKENS);
  registerPlannedWeekModule(container, TOKENS);
  registerMealModule(container, TOKENS);
  registerIngredientModule(container, TOKENS);
  registerUserSettingsModule(container, TOKENS);
  registerAuthModule(container, TOKENS);
};
