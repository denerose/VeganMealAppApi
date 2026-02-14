import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { CreateIngredientUseCase } from '@/application/ingredient/create-ingredient.use-case';
import { GetIngredientUseCase } from '@/application/ingredient/get-ingredient.use-case';
import { ListIngredientsUseCase } from '@/application/ingredient/list-ingredients.use-case';
import { UpdateIngredientUseCase } from '@/application/ingredient/update-ingredient.use-case';
import { DeleteIngredientUseCase } from '@/application/ingredient/delete-ingredient.use-case';
import { IngredientController } from '@/infrastructure/http/controllers/ingredient.controller';

export function registerIngredientModule(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(
    TOKENS.CreateIngredientUseCase,
    c => new CreateIngredientUseCase(c.resolve(TOKENS.IngredientRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.GetIngredientUseCase,
    c => new GetIngredientUseCase(c.resolve(TOKENS.IngredientRepository)),
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
    TOKENS.IngredientController,
    c =>
      new IngredientController(
        c.resolve(TOKENS.GetIngredientUseCase),
        c.resolve(TOKENS.CreateIngredientUseCase),
        c.resolve(TOKENS.ListIngredientsUseCase),
        c.resolve(TOKENS.UpdateIngredientUseCase),
        c.resolve(TOKENS.DeleteIngredientUseCase)
      ),
    { singleton: true }
  );
}
