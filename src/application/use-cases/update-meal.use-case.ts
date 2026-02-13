import type { MealId, MealSnapshot } from '../../domain/meal/meal.entity';
import type { MealRepository } from '../../domain/meal/meal.repository';
import type { MealQualitiesProps } from '../../domain/meal/meal-qualities.vo';
import type { IngredientId } from '../../domain/ingredient/ingredient.entity';

export type UpdateMealRequest = {
  id: MealId;
  tenantId: string;
  name?: string;
  qualities?: Partial<MealQualitiesProps>;
  ingredientIds?: IngredientId[];
};

export class UpdateMealUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: UpdateMealRequest): Promise<MealSnapshot> {
    const meal = await this.mealRepository.findById(request.id, request.tenantId);
    
    if (!meal) {
      throw new Error(`Meal with ID ${request.id} not found`);
    }

    if (request.name !== undefined) {
      meal.updateName(request.name);
    }

    if (request.qualities !== undefined) {
      meal.updateQualities(request.qualities);
    }

    if (request.ingredientIds !== undefined) {
      meal.setIngredients(request.ingredientIds);
    }

    const savedMeal = await this.mealRepository.save(meal, request.tenantId);
    return savedMeal.toSnapshot();
  }
}
